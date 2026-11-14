"""NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information) + APOD integration.

Fetches FLR / SEP / GST / IPS / CME from api.nasa.gov, normalises them, caches them, and turns them
into localised crisis obstacles. Falls back to an archive of real 2024 events if the API is unreachable."""
import asyncio
import logging
import os
import time
from datetime import timedelta

import httpx

from datetime import date

from lib.dates import today_iso


def today_utc() -> date:
    return date.fromisoformat(today_iso("UTC"))

logger = logging.getLogger(__name__)
BASE = "https://api.nasa.gov"
TYPES = ["FLR", "SEP", "GST", "IPS", "CME"]
_cache: dict = {"at": 0.0, "report": None}
_apod: dict = {"date": None, "data": None}


def _key() -> str:
    return os.environ.get("NASA_API_KEY", "DEMO_KEY")


def _safe(err: Exception) -> str:
    """Error text with the API key masked (never log secrets)."""
    return str(err).replace(_key(), "***").split("\n")[0]


logging.getLogger("httpx").setLevel(logging.WARNING)


# Real historical events (May & Oct 2024 solar maximum) used when DONKI is unreachable.
ARCHIVE = [
    {"type": "FLR", "id": "2024-10-03T11:58:00-FLR-001", "time": "2024-10-03T12:18Z", "value": "X9.0", "severity": 4, "link": "https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/33664/-1"},
    {"type": "SEP", "id": "2024-05-11T02:12:00-SEP-001", "time": "2024-05-11T02:12Z", "value": ">10 MeV protons", "severity": 3, "link": "https://kauai.ccmc.gsfc.nasa.gov/DONKI/"},
    {"type": "GST", "id": "2024-05-10T15:00:00-GST-001", "time": "2024-05-10T15:00Z", "value": "Kp 9", "severity": 4, "link": "https://kauai.ccmc.gsfc.nasa.gov/DONKI/"},
    {"type": "IPS", "id": "2024-05-10T16:36:00-IPS-001", "time": "2024-05-10T16:36Z", "value": "Earth (L1)", "severity": 3, "link": "https://kauai.ccmc.gsfc.nasa.gov/DONKI/"},
    {"type": "CME", "id": "2024-05-09T09:24:00-CME-001", "time": "2024-05-09T09:24Z", "value": "1480 km/s", "severity": 3, "link": "https://kauai.ccmc.gsfc.nasa.gov/DONKI/"},
]


def _norm(t: str, e: dict) -> dict | None:
    try:
        if t == "FLR":
            cls = e.get("classType") or "C1.0"
            sev = {"X": 4, "M": 3, "C": 2}.get(cls[0], 1)
            return {"type": t, "id": e.get("flrID", ""), "time": e.get("peakTime") or e.get("beginTime"), "value": cls, "severity": sev, "link": e.get("link")}
        if t == "SEP":
            return {"type": t, "id": e.get("sepID", ""), "time": e.get("eventTime"), "value": ">10 MeV protons", "severity": 3, "link": e.get("link")}
        if t == "GST":
            kp = max([k.get("kpIndex", 0) for k in e.get("allKpIndex") or []] or [5])
            sev = 4 if kp >= 8 else 3 if kp >= 7 else 2 if kp >= 6 else 1
            return {"type": t, "id": e.get("gstID", ""), "time": e.get("startTime"), "value": f"Kp {kp:g}", "severity": sev, "link": e.get("link")}
        if t == "IPS":
            loc = e.get("location") or "Earth"
            return {"type": t, "id": e.get("activityID", ""), "time": e.get("eventTime"), "value": loc, "severity": 3 if loc == "Earth" else 2, "link": e.get("link")}
        if t == "CME":
            an = next((a for a in (e.get("cmeAnalyses") or []) if a.get("isMostAccurate")), None) or (e.get("cmeAnalyses") or [{}])[0] or {}
            sp = an.get("speed") or 400
            sev = 4 if sp >= 1500 else 3 if sp >= 1000 else 2 if sp >= 600 else 1
            return {"type": t, "id": e.get("activityID", ""), "time": e.get("startTime"), "value": f"{sp:.0f} km/s", "severity": sev, "link": e.get("link")}
    except Exception:  # malformed record
        return None
    return None


async def fetch_report() -> dict:
    """Cached 30 min. Returns {source, fetched_at, events (newest first), latest: {type: event}}."""
    ttl = 1800 if _cache["report"] and _cache["report"]["source"] == "live" else 300
    if _cache["report"] and time.time() - _cache["at"] < ttl:
        return _cache["report"]
    end = today_utc()
    events: list[dict] = []
    ok = 0
    async with httpx.AsyncClient(timeout=12) as c:
        async def one(t, start):
            r = await c.get(f"{BASE}/DONKI/{t}", params={"startDate": start.isoformat(), "endDate": end.isoformat(), "api_key": _key()})
            r.raise_for_status()
            return t, [n for n in (_norm(t, e) for e in (r.json() or []) if isinstance(e, dict)) if n and n["time"]]
        # 1) today's live feed first
        today = await asyncio.gather(*(one(t, end) for t in TYPES), return_exceptions=True)
        empty = []
        for t, res in zip(TYPES, today):
            if isinstance(res, Exception):
                logger.warning("DONKI live %s failed: %s", t, _safe(res))
                empty.append(t)
                continue
            ok += 1
            if res[1]:
                events += [dict(e, origin="live") for e in res[1]]
            else:
                empty.append(t)
        # 2) nothing today -> last 30 days of recorded events
        if empty:
            recent = await asyncio.gather(*(one(t, end - timedelta(days=30)) for t in empty), return_exceptions=True)
            for t, res in zip(empty, recent):
                if isinstance(res, Exception):
                    logger.warning("DONKI 30-day %s failed: %s", t, _safe(res))
                    continue
                ok += 1
                events += [dict(e, origin="recent") for e in res[1]]
    if ok == 0 and _cache["report"]:
        return _cache["report"]
    have = {e["type"] for e in events}
    # 3) still nothing -> built-in archive of real 2024 events
    events += [dict(a, archive=True, origin="archive") for a in ARCHIVE if a["type"] not in have]
    source = "live" if any(e["origin"] == "live" for e in events) else "recent" if any(e["origin"] == "recent" for e in events) else "archive"
    events.sort(key=lambda e: e["time"], reverse=True)
    latest = {}
    for e in events:
        latest.setdefault(e["type"], e)
    report = {"source": source, "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "events": events[:40], "latest": latest,
              "counts": {t: sum(1 for e in events if e["type"] == t and not e.get("archive")) for t in TYPES}}
    _cache.update(at=time.time(), report=report)
    return report


async def fetch_apod() -> dict | None:
    day = today_utc().isoformat()
    if _apod["date"] == day and (_apod["data"] or time.time() - _apod.get("at", 0) < 300):
        return _apod["data"]
    try:
        d, url = {}, None
        async with httpx.AsyncClient(timeout=10) as c:
            # NASA sometimes serves a placeholder logo for today's APOD; step back to the latest real picture
            for back in range(5):
                r = await c.get(f"{BASE}/planetary/apod", params={"api_key": _key(), "date": (today_utc() - timedelta(days=back)).isoformat()})
                if r.status_code != 200:
                    continue
                d = r.json()
                url = d.get("url") if d.get("media_type") == "image" else d.get("thumbnail_url")
                if url and "nasa-logo" not in url and d.get("title") != "NASA Science":
                    break
                url = None
        if not url:
            raise ValueError("no valid APOD image in the last 5 days")
        data = {"date": d.get("date", day), "title": d.get("title", ""), "url": url, "hdurl": d.get("hdurl"), "copyright": (d.get("copyright") or "").strip() or None,
                "explanation": d.get("explanation", "")}
    except Exception as exc:
        logger.warning("APOD fetch failed: %s", _safe(exc))
        data = None
    _apod.update(date=day, data=data, at=time.time())
    return data


# ---------- crisis templates: (title, description, [(label, detail, outcome) x3]) ----------
T = {
    "en": {
        "FLR": ("Solar Flare {value}: Radiation Alarm", "DONKI reports a {value}-class flare peaking {date}. X-rays are flooding the cockpit and radio is blacked out.",
                [("Seal crew in radiation shelter", "Move to the shielded core and point the engine block at the Sun", "Dose contained. The shelter held."),
                 ("Switch to backup avionics", "Run on rad-hardened backup computers until the flux drops", "Avionics safe, but crew dose is elevated."),
                 ("Ignore the alarm, keep burning", "Stay on the timeline", "Crew dose exceeded limits and the electronics were damaged.")]),
        "SEP": ("Solar Energetic Particle Storm", "A high-energy proton storm (DONKI {date}, {value}) is stripping the outer shield. Shield integrity is dropping fast.",
                [("Divert power to the active shield", "Boost the magnetic deflector at the cost of power", "Protons deflected. Shield stabilised."),
                 ("Roll the thickest hull side into the stream", "Use propellant tanks as extra mass shielding", "Shield worn, but the crew is protected."),
                 ("Hold course and absorb it", "No changes", "Shield collapsed and the hull took heavy radiation.")]),
        "GST": ("Geomagnetic Storm {value}: Power Grid Unstable", "Kp index {value} ({date}). Induced currents are destabilising the ship's power bus. Set the power regulator.",
                [("Regulator 35%: shunt to batteries", "Minimum bus load, batteries absorb the surges", "Bus protected from the surges."),
                 ("Regulator 65%: balanced load", "Moderate load with surge filtering", "Bus balanced at a moderate cost."),
                 ("Regulator 100%: full load", "Keep every system powered", "Breakers tripped. Power systems overloaded.")]),
        "IPS": ("Interplanetary Shock Wave", "A shock front was detected at {value} ({date}). A violent jolt knocked out the inertial reference: emergency inertial damper crisis.",
                [("Engage inertial dampers, re-lock gyros", "Damp the jolt and realign the platform", "Attitude stable. Gyros locked."),
                 ("Fire RCS to stop the tumble", "Counter the motion manually with thrusters", "Tumble stopped, but propellant was spent."),
                 ("Wait for the jolt to pass", "Let the ship settle", "Structural stress and an attitude drift.")]),
        "CME": ("Coronal Mass Ejection on the Route", "A {value} plasma cloud launched {date} is crossing your trajectory.",
                [("Re-plan the trajectory behind the front", "Slip behind the plasma wave with a correction burn", "The plasma wave passed ahead of you."),
                 ("Raise shields and ride through", "Hold course with maximum shielding", "Made it through with shield wear."),
                 ("Accelerate through the plasma", "Punch through as fast as possible", "Hull and shields battered by the plasma.")]),
    },
    "tr": {
        "FLR": ("Güneş Patlaması {value}: Radyasyon Alarmı", "DONKI, {date} tarihinde zirve yapan {value} sınıfı bir patlama bildiriyor. Kokpit X ışınlarıyla doldu, telsiz kesildi.",
                [("Ekibi radyasyon sığınağına kapat", "Korumalı çekirdeğe geç, motor bloğunu Güneş'e çevir", "Doz kontrol altında. Sığınak dayandı."),
                 ("Yedek aviyoniğe geç", "Akı düşene kadar radyasyona dayanıklı yedek bilgisayarları kullan", "Aviyonik güvende ama ekip dozu yüksek."),
                 ("Alarmı yok say, yanmaya devam", "Programa sadık kal", "Ekip dozu limiti aştı, elektronik hasar gördü.")]),
        "SEP": ("Güneş Enerjili Parçacık Fırtınası", "Yüksek enerjili proton fırtınası (DONKI {date}, {value}) dış kalkanı aşındırıyor. Kalkan dayanıklılığı hızla düşüyor.",
                [("Gücü aktif kalkana aktar", "Güç pahasına manyetik saptırıcıyı güçlendir", "Protonlar saptırıldı. Kalkan dengelendi."),
                 ("En kalın gövde tarafını akıntıya çevir", "Yakıt tanklarını ek kütle kalkanı olarak kullan", "Kalkan aşındı ama ekip korundu."),
                 ("Rotayı koru ve dayan", "Değişiklik yok", "Kalkan çöktü, gövde ağır radyasyon aldı.")]),
        "GST": ("Jeomanyetik Fırtına {value}: Güç Şebekesi Kararsız", "Kp indeksi {value} ({date}). İndüklenen akımlar geminin güç hattını bozuyor. Güç regülatörünü ayarla.",
                [("Regülatör %35: bataryalara aktar", "Minimum hat yükü, dalgalanmaları bataryalar emer", "Hat dalgalanmalardan korundu."),
                 ("Regülatör %65: dengeli yük", "Dalgalanma filtreli orta yük", "Hat makul bir bedelle dengelendi."),
                 ("Regülatör %100: tam yük", "Tüm sistemleri çalışır tut", "Sigortalar attı. Güç sistemleri aşırı yüklendi.")]),
        "IPS": ("Gezegenlerarası Şok Dalgası", "{value} konumunda şok cephesi tespit edildi ({date}). Şiddetli sarsıntı atalet referansını bozdu: acil atalet dengeleyici krizi.",
                [("Atalet dengeleyicileri devreye al, jiroskopları kilitle", "Sarsıntıyı sönümle ve platformu hizala", "Yönelim stabil. Jiroskoplar kilitli."),
                 ("Yuvarlanmayı RCS ile durdur", "Hareketi iticilerle elle karşıla", "Yuvarlanma durdu ama yakıt harcandı."),
                 ("Sarsıntının geçmesini bekle", "Geminin oturmasını bekle", "Yapısal gerilim ve yönelim kayması.")]),
        "CME": ("Rotada Koronal Kütle Atımı", "{date} tarihinde fırlatılan {value} hızındaki plazma bulutu rotanı kesiyor.",
                [("Rotayı cephenin arkasına planla", "Düzeltme yanmasıyla plazma dalgasının arkasına geç", "Plazma dalgası önünden geçti."),
                 ("Kalkanları kaldır ve içinden geç", "Maksimum kalkanla rotayı koru", "Kalkan aşınmasıyla geçildi."),
                 ("Plazmanın içinden hızlan", "Olabildiğince hızlı del geç", "Gövde ve kalkanlar plazmadan hırpalandı.")]),
    },
    "de": {
        "FLR": ("Sonneneruption {value}: Strahlungsalarm", "DONKI meldet einen Flare der Klasse {value} mit Maximum am {date}. Röntgenstrahlung flutet das Cockpit, Funkausfall.",
                [("Crew im Strahlenschutzraum abschotten", "In den abgeschirmten Kern, Triebwerksblock zur Sonne", "Dosis begrenzt. Der Schutzraum hielt."),
                 ("Auf Backup-Avionik umschalten", "Strahlungsgehärtete Ersatzrechner bis zum Abklingen", "Avionik sicher, Crewdosis erhöht."),
                 ("Alarm ignorieren, weiterbrennen", "Zeitplan einhalten", "Crewdosis überschritten, Elektronik beschädigt.")]),
        "SEP": ("Sturm energiereicher Sonnenteilchen", "Ein hochenergetischer Protonensturm (DONKI {date}, {value}) trägt den Außenschild ab. Die Schildintegrität fällt schnell.",
                [("Energie auf den aktiven Schild", "Magnetischen Deflektor auf Kosten der Energie verstärken", "Protonen abgelenkt. Schild stabilisiert."),
                 ("Dickste Rumpfseite in den Strom drehen", "Treibstofftanks als zusätzliche Abschirmung nutzen", "Schild abgenutzt, Crew geschützt."),
                 ("Kurs halten und aushalten", "Keine Änderung", "Schild zusammengebrochen, Rumpf stark bestrahlt.")]),
        "GST": ("Geomagnetischer Sturm {value}: Bordnetz instabil", "Kp-Index {value} ({date}). Induzierte Ströme destabilisieren das Bordnetz. Stelle den Leistungsregler ein.",
                [("Regler 35 %: auf Batterien umleiten", "Minimale Last, Batterien puffern die Spitzen", "Bordnetz vor Spitzen geschützt."),
                 ("Regler 65 %: ausgeglichene Last", "Mittlere Last mit Spitzenfilter", "Bordnetz mit moderatem Aufwand ausgeglichen."),
                 ("Regler 100 %: Volllast", "Alle Systeme versorgt halten", "Sicherungen ausgelöst. Energiesysteme überlastet.")]),
        "IPS": ("Interplanetare Schockwelle", "Schockfront bei {value} erkannt ({date}). Ein heftiger Stoß hat die Trägheitsreferenz zerstört: Notfall der Trägheitsdämpfer.",
                [("Trägheitsdämpfer aktivieren, Kreisel sperren", "Stoß dämpfen und Plattform ausrichten", "Lage stabil. Kreisel gesperrt."),
                 ("Taumeln mit RCS stoppen", "Bewegung manuell mit Düsen kontern", "Taumeln gestoppt, Treibstoff verbraucht."),
                 ("Abwarten", "Das Schiff sich beruhigen lassen", "Strukturbelastung und Lagedrift.")]),
        "CME": ("Koronaler Massenauswurf auf der Route", "Eine Plasmawolke mit {value}, ausgestoßen am {date}, kreuzt deine Flugbahn.",
                [("Bahn hinter die Front legen", "Mit einem Korrekturbrand hinter die Plasmawelle", "Die Plasmawelle zog vor dir vorbei."),
                 ("Schilde hoch und durch", "Kurs halten mit maximaler Abschirmung", "Durchgekommen, mit Schildverschleiß."),
                 ("Durch das Plasma beschleunigen", "So schnell wie möglich durchstoßen", "Rumpf und Schilde vom Plasma beschädigt.")]),
    },
}

# base qualities + effects (fuel, hull, power, shield) per option
MECH = {
    "FLR": [(1.0, (0, -4, -4, -6)), (0.6, (0, -10, -8, -8)), (0.1, (0, -22, -12, -15))],
    "SEP": [(1.0, (0, 0, -10, -10)), (0.7, (-4, 0, 0, -18)), (0.1, (0, -10, 0, -40))],
    "GST": [(1.0, (-2, 0, -6, 0)), (0.6, (0, 0, -10, 0)), (0.15, (0, -5, -25, 0))],
    "IPS": [(1.0, (0, 0, -6, 0)), (0.6, (-12, 0, 0, 0)), (0.15, (-6, -18, 0, 0))],
    "CME": [(1.0, (-10, 0, 0, 0)), (0.6, (0, 0, -6, -20)), (0.2, (-8, -18, 0, -12))],
}
DIFF_FX = {"easy": 0.7, "normal": 1.0, "hard": 1.35}


def build_obstacle(event: dict, lang: str, difficulty: str, phase: str) -> dict:
    t = event["type"]
    title, desc, opts = T.get(lang, T["en"])[t]
    date = (event.get("time") or "")[:10]
    sev = event.get("severity", 2)
    k = (0.6 + 0.2 * sev) * DIFF_FX.get(difficulty, 1.0)
    mech = MECH[t]
    if t == "GST" and sev < 3:  # mild storm: balanced load is best, full shunt wastes reserves
        mech = [(0.6, (-6, 0, -6, 0)), (1.0, (0, 0, -6, 0)), (0.25, (0, -3, -18, 0))]
    options = []
    for (label, detail, outcome), (q, (f, h, p, s)) in zip(opts, mech):
        options.append({"label": label, "detail": detail, "outcome": outcome, "quality": q,
                        "effects": {"fuel": round(f * k), "hull": round(h * k), "power": round(p * k), "shield": round(s * k)}})
    return {"id": f"donki_{t.lower()}", "kind": t, "phase": phase, "severity": sev, "value": event["value"], "event_date": date,
            "title": title.format(value=event["value"]), "description": desc.format(value=event["value"], date=date),
            "nasa_ref": f"NASA DONKI · {event.get('id') or t}" + (" (archive)" if event.get("archive") else ""), "options": options}


def pick_events(report: dict, n: int, difficulty: str, forced: list[str]) -> list[dict]:
    """Choose n distinct event types: forced first, then by difficulty (hard = most severe)."""
    latest = report["latest"]
    chosen = [latest[t] for t in dict.fromkeys(forced) if t in latest][:n]
    rest = [e for t, e in latest.items() if t not in {c["type"] for c in chosen}]
    rest.sort(key=lambda e: e["severity"], reverse=difficulty != "easy")
    if difficulty == "normal":
        import random
        random.shuffle(rest)
    return chosen + rest[: max(0, n - len(chosen))]
