"""Rocket physics (Tsiolkovsky staging) + beginner guide checks. Single source of truth."""
import math

from data.nasa import PART_BY_ID, PARTS
from models.schemas import GuideIssue, RocketAnalysis, RocketStats, StackItem

G0 = 9.80665
TANKS = ("upper", "lower")


def _alts(pred, exclude: str | None = None, limit: int = 4) -> list[str]:
    return [p["id"] for p in PARTS if pred(p) and p["id"] != exclude][:limit]


def analyze(stack: list[StackItem], upgrades: dict[str, int] | None = None) -> RocketAnalysis:
    up = upgrades or {}
    isp_mult = 1 + 0.03 * up.get("engine_isp", 0)
    dry_mult = 1 - 0.03 * up.get("structural", 0)
    issues: list[GuideIssue] = []

    items = []
    for idx, s in enumerate(stack):
        p = PART_BY_ID.get(s.part_id)
        if not p:
            continue
        dry = p["dry_t"] * dry_mult
        wet = p["mass_t"] - (p["dry_t"] - dry)
        items.append({"idx": idx, "p": p, "qty": s.qty, "wet": wet * s.qty, "dry": dry * s.qty})

    zero = RocketStats(total_mass_t=0, payload_mass_t=0, liftoff_thrust_kn=0, twr=0, delta_v_ms=0, stage_count=0)
    if not items:
        issues.append(GuideIssue(severity="tip", code="EMPTY", title="Start your build",
                                 message="Open the parts library and drag a crew capsule onto the blueprint, then add a stage and an engine below it.",
                                 alternatives=_alts(lambda p: p["category"] == "crew", limit=3)))
        return RocketAnalysis(stats=zero, issues=issues, ready=False)

    # ---- group into stages (top -> bottom)
    payload, boosters, groups = [], [], []
    cur = {"tanks": [], "engines": [], "extras": []}

    def close():
        nonlocal cur
        if cur["tanks"] or cur["engines"] or cur["extras"]:
            groups.append(cur)
        cur = {"tanks": [], "engines": [], "extras": []}

    for it in items:
        cat = it["p"]["category"]
        if cat == "booster":
            boosters.append(it)
        elif cat in TANKS:
            if cur["engines"]:
                close()
            cur["tanks"].append(it)
        elif cat == "engine":
            cur["engines"].append(it)
        else:
            if not groups and not cur["tanks"] and not cur["engines"]:
                payload.append(it)
            else:
                if cur["engines"]:
                    close()
                cur["extras"].append(it)
    close()
    # trailing extras-only group merges into the stage above it
    if groups and not groups[-1]["tanks"] and not groups[-1]["engines"] and len(groups) > 1:
        tail = groups.pop()
        groups[-1]["extras"].extend(tail["extras"])
    elif groups and not groups[-1]["tanks"] and not groups[-1]["engines"]:
        payload.extend(groups.pop()["extras"])

    # ---- guide checks
    if not any(i["p"]["category"] == "crew" for i in items):
        issues.append(GuideIssue(severity="warning", code="NO_PAYLOAD", title="No crew or payload",
                                 message="A mission needs a capsule or payload at the top of the stack.",
                                 alternatives=_alts(lambda p: p["category"] == "crew")))
    for g in groups:
        props = {t["p"]["propellant"] for t in g["tanks"]}
        if g["tanks"] and not g["engines"]:
            t = g["tanks"][-1]
            issues.append(GuideIssue(severity="error", code="TANK_NO_ENGINE", title=f"{t['p']['name']} has no engine",
                                     message="Every fuel stage needs an engine directly below it that burns the same propellant.",
                                     item_index=t["idx"],
                                     alternatives=_alts(lambda p, pr=t["p"]["propellant"]: p["category"] == "engine" and p["propellant"] == pr)))
        if g["engines"] and not g["tanks"]:
            e = g["engines"][0]
            issues.append(GuideIssue(severity="error", code="ENGINE_NO_TANK", title=f"{e['p']['name']} has no fuel",
                                     message="Place a tank stage above this engine so it has propellant to burn.",
                                     item_index=e["idx"],
                                     alternatives=_alts(lambda p, pr=e["p"]["propellant"]: p["category"] in TANKS and p["propellant"] == pr)))
        for e in g["engines"]:
            if props and e["p"]["propellant"] not in props:
                tp = next(iter(props))
                issues.append(GuideIssue(severity="error", code="PROPELLANT_MISMATCH", title=f"{e['p']['name']} is incompatible",
                                         message=f"This engine burns {e['p']['propellant']} but the tank above holds {tp}. Pick an engine that burns {tp}.",
                                         item_index=e["idx"],
                                         alternatives=_alts(lambda p, pr=tp: p["category"] == "engine" and p["propellant"] == pr, exclude=e["p"]["id"])))
    structural = [i for i in items if i["p"]["category"] not in ("engine", "booster")]
    for a, b in zip(structural, structural[1:]):
        da, db_ = a["p"]["diameter_m"], b["p"]["diameter_m"]
        if da - db_ > 1.0 and a["p"]["category"] != "aero":
            issues.append(GuideIssue(severity="warning", code="OVERHANG", title=f"{a['p']['name']} overhangs",
                                     message=f"It is {da:.1f} m wide on a {db_:.1f} m section below. Use an adapter or a narrower part.",
                                     item_index=a["idx"],
                                     alternatives=_alts(lambda p, c=a["p"]["category"], lim=db_ + 0.5: (p["category"] == c or p["category"] == "interstage") and p["diameter_m"] <= lim, exclude=a["p"]["id"])))
    if boosters and not groups:
        issues.append(GuideIssue(severity="error", code="BOOSTER_NO_CORE", title="Boosters need a core stage",
                                 message="Strap-on boosters attach to a core stage. Add a lower fuselage stage with an engine.",
                                 item_index=boosters[0]["idx"], alternatives=_alts(lambda p: p["category"] == "lower")))

    # ---- physics
    total = sum(i["wet"] for i in items)
    payload_mass = sum(i["wet"] for i in payload)
    valid = [g for g in groups if g["tanks"] and g["engines"]]
    bottom = groups[-1] if groups else None
    core_thrust = sum(e["p"]["thrust_sl_kn"] * e["qty"] for e in bottom["engines"]) if bottom else 0
    boost_thrust = sum(b["p"]["thrust_sl_kn"] * b["qty"] for b in boosters)
    thrust = core_thrust + boost_thrust
    twr = thrust / (total * G0) if total else 0

    dv, m = 0.0, total
    if boosters and valid:
        prop = sum(b["wet"] - b["dry"] for b in boosters)
        isp = sum((b["p"]["isp_sl_s"] + b["p"]["isp_vac_s"]) / 2 * b["p"]["thrust_sl_kn"] * b["qty"] for b in boosters) / max(boost_thrust, 1)
        dv += isp * isp_mult * G0 * math.log(m / (m - prop))
        m -= sum(b["wet"] for b in boosters)
    for n, g in enumerate(reversed(valid)):
        prop = sum(t["wet"] - t["dry"] for t in g["tanks"])
        first = n == 0
        w = sum(e["p"]["thrust_vac_kn"] * e["qty"] for e in g["engines"]) or 1
        isp = sum(((e["p"]["isp_sl_s"] + e["p"]["isp_vac_s"]) / 2 if first and e["p"]["isp_sl_s"] else e["p"]["isp_vac_s"])
                  * e["p"]["thrust_vac_kn"] * e["qty"] for e in g["engines"]) / w
        if m - prop > 0:
            dv += isp * isp_mult * G0 * math.log(m / (m - prop))
        m -= sum(i["wet"] for i in g["tanks"] + g["engines"] + g["extras"])

    if groups and twr < 1:
        bp = next((t["p"]["propellant"] for t in bottom["tanks"]), None) if bottom else None
        issues.append(GuideIssue(severity="error", code="LOW_TWR", title=f"Thrust-to-weight {twr:.2f}: rocket cannot lift off",
                                 message="Liftoff thrust must exceed weight (TWR > 1). Add more or stronger first-stage engines, add boosters, or lighten the stack.",
                                 item_index=bottom["engines"][0]["idx"] if bottom and bottom["engines"] else None,
                                 alternatives=_alts(lambda p: (p["category"] == "engine" and p["propellant"] == bp and p["thrust_sl_kn"] > 1500) or p["category"] == "booster", limit=5)))
    elif groups and twr < 1.12:
        issues.append(GuideIssue(severity="warning", code="MARGINAL_TWR", title=f"Marginal TWR {twr:.2f}",
                                 message="The rocket will climb slowly and lose a lot to gravity. NASA vehicles launch at TWR 1.15 to 1.6.",
                                 alternatives=_alts(lambda p: p["category"] == "booster", limit=3)))
    if valid and not any(i.severity == "error" for i in issues):
        issues.append(GuideIssue(severity="tip", code="READY", title="Flight-ready",
                                 message=f"Ideal delta-v {dv / 1000:.1f} km/s. Compare it with each destination's requirement before launch."))

    stats = RocketStats(total_mass_t=round(total, 1), payload_mass_t=round(payload_mass, 1), liftoff_thrust_kn=round(thrust),
                        twr=round(twr, 2), delta_v_ms=round(dv), stage_count=len(valid) + (1 if boosters and valid else 0))
    ready = bool(valid) and not any(i.severity == "error" for i in issues)
    return RocketAnalysis(stats=stats, issues=issues, ready=ready)
