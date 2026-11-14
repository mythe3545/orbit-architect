import logging

import httpx
from fastapi import APIRouter, HTTPException, Query

from data import i18n
from data.i18n_parts import localize_part, program
from data.cosmetics import COSMETICS
from data.nasa import CATEGORIES, PARTS, PLANETS, ROCKETS, UPGRADES
from lib.db import db
from lib.rocket import analyze
from models.schemas import AnalyzeRequest, Catalog, NasaImage, RocketAnalysis

router = APIRouter()
logger = logging.getLogger(__name__)
_image_cache: dict[str, list[NasaImage]] = {}


@router.get("/catalog", response_model=Catalog)
async def get_catalog(lang: str = Query("en", pattern="^(en|tr|de)$")):
    if lang == "en":
        return Catalog(categories=CATEGORIES, parts=PARTS, rockets=ROCKETS, planets=PLANETS, upgrades=UPGRADES, cosmetics=COSMETICS)
    cats = [{**c, "label": i18n.CATEGORIES[lang].get(c["id"], c["label"])} for c in CATEGORIES]
    planets = []
    for p in PLANETS:
        n, f, a = i18n.PLANETS[lang].get(p["id"], (p["name"], p["fact"], p["atmosphere"]))
        planets.append({**p, "name": n, "fact": f, "atmosphere": a})
    ups = []
    for u in UPGRADES:
        n, d = i18n.UPGRADES[lang].get(u["id"], (u["name"], u["description"]))
        ups.append({**u, "name": n, "description": d})
    rockets = [{**r, "summary": i18n.ROCKETS[lang].get(r["id"], r["summary"]), "era": program(r["era"], lang)} for r in ROCKETS]
    parts = [localize_part(p, lang) for p in PARTS]
    return Catalog(categories=cats, parts=parts, rockets=rockets, planets=planets, upgrades=ups, cosmetics=COSMETICS)


@router.post("/rocket/analyze", response_model=RocketAnalysis)
async def analyze_rocket(body: AnalyzeRequest):
    upgrades = {}
    if body.astronaut_id:
        doc = await db.astronauts.find_one({"id": body.astronaut_id}, {"upgrades": 1})
        upgrades = (doc or {}).get("upgrades", {})
    return analyze(body.stack, upgrades, body.lang)


@router.get("/nasa/images", response_model=list[NasaImage])
async def nasa_images(q: str = Query(min_length=2, max_length=80), limit: int = Query(6, ge=1, le=20)):
    """Live proxy to the NASA Image and Video Library (images-api.nasa.gov), cached in memory."""
    key = q.lower().strip()
    if key not in _image_cache:
        try:
            async with httpx.AsyncClient(timeout=8) as c:
                r = await c.get("https://images-api.nasa.gov/search", params={"q": q, "media_type": "image"})
                r.raise_for_status()
                out = []
                for item in r.json().get("collection", {}).get("items", [])[:30]:
                    data = (item.get("data") or [{}])[0]
                    links = item.get("links") or []
                    if not links:
                        continue
                    out.append(NasaImage(title=data.get("title", q), url=links[0]["href"], nasa_id=data.get("nasa_id", ""),
                                         date=(data.get("date_created") or "")[:10] or None))
                _image_cache[key] = out
        except Exception as exc:
            logger.warning("NASA image search failed for %s: %s", q, exc)
            raise HTTPException(status_code=502, detail="NASA image library unavailable")
    return _image_cache[key][:limit]
