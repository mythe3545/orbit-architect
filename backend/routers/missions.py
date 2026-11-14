import random
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from data.nasa import OBSTACLE_BY_ID, OBSTACLES, PLANET_BY_ID
from lib.db import db
from lib.rocket import analyze
from models.schemas import (Decision, DecisionRequest, Mission, MissionReport, ObstacleOptionView, ObstacleView,
                            PointsBreakdown, StartMissionRequest, Telemetry)
from routers.astronauts import get_astronaut_or_404

router = APIRouter(prefix="/missions")


def _pick_obstacles(planet_id: str, count: int) -> list[str]:
    def pool(phase):
        return [o["id"] for o in OBSTACLES if o["phase"] == phase and (not o["planets"] or planet_id in o["planets"])]
    rng = random.Random()
    launch = rng.choice(pool("launch"))
    arrival = rng.choice(pool("arrival"))
    transit = rng.sample(pool("transit"), k=max(1, count - 2))
    return [launch, *transit, arrival]


def _view(oid: str, order: list[int]) -> ObstacleView:
    o = OBSTACLE_BY_ID[oid]
    return ObstacleView(id=o["id"], phase=o["phase"], title=o["title"], description=o["description"], nasa_ref=o["nasa_ref"],
                        options=[ObstacleOptionView(label=o["options"][k]["label"], detail=o["options"][k]["detail"]) for k in order])


async def _get(mission_id: str) -> dict:
    doc = await db.missions.find_one({"id": mission_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Mission not found")
    return doc


@router.post("", response_model=Mission)
async def start_mission(body: StartMissionRequest):
    a = await get_astronaut_or_404(body.astronaut_id)
    planet = PLANET_BY_ID.get(body.planet_id)
    if not planet:
        raise HTTPException(status_code=404, detail="Destination not found")
    analysis = analyze(body.stack, a.upgrades)
    if not analysis.ready:
        first = next((i for i in analysis.issues if i.severity == "error"), None)
        raise HTTPException(status_code=400, detail=f"Rocket not flight-ready: {first.title if first else 'incomplete design'}")
    readiness = min(1.0, analysis.stats.delta_v_ms / planet["required_dv_ms"])
    ids = _pick_obstacles(planet["id"], planet["obstacle_count"])
    orders = [random.sample(range(len(OBSTACLE_BY_ID[i]["options"])), k=len(OBSTACLE_BY_ID[i]["options"])) for i in ids]
    doc = {
        "id": str(uuid.uuid4()), "astronaut_id": a.id, "planet_id": planet["id"], "planet_name": planet["name"],
        "rocket_label": body.rocket_label, "stats": analysis.stats.model_dump(), "readiness": round(readiness, 3),
        "decision_seconds": 15 + 3 * a.upgrades.get("nav_ai", 0), "obstacle_ids": ids, "option_orders": orders,
        "obstacles": [_view(i, o).model_dump() for i, o in zip(ids, orders)], "decisions": [], "telemetry": Telemetry().model_dump(),
        "status": "in_flight", "success_pct": 0, "points": PointsBreakdown().model_dump(), "first_visit": False,
        "created_at": datetime.now(timezone.utc),
    }
    await db.missions.insert_one(dict(doc))
    return Mission(**doc)


@router.get("/{mission_id}", response_model=Mission)
async def get_mission(mission_id: str):
    return Mission(**(await _get(mission_id)))


@router.post("/{mission_id}/decisions", response_model=Decision)
async def decide(mission_id: str, body: DecisionRequest):
    m = await _get(mission_id)
    if m["status"] != "in_flight":
        raise HTTPException(status_code=400, detail="Mission already completed")
    if body.obstacle_index != len(m["decisions"]) or body.obstacle_index >= len(m["obstacle_ids"]):
        raise HTTPException(status_code=400, detail="Unexpected obstacle index")
    o = OBSTACLE_BY_ID[m["obstacle_ids"][body.obstacle_index]]
    if body.option_index >= len(o["options"]):
        raise HTTPException(status_code=400, detail="Invalid option")
    a = await get_astronaut_or_404(m["astronaut_id"])
    t = Telemetry(**m["telemetry"])
    if body.option_index == -1:
        quality, outcome = 0.0, "No decision in time. Automated systems did what they could and the situation got worse."
        effects = {"fuel": -12, "hull": -15, "power": -10}
    else:
        opt = o["options"][m["option_orders"][body.obstacle_index][body.option_index]]
        quality, outcome, effects = opt["quality"], opt["outcome"], opt["effects"]
    fuel_k = 1 - 0.15 * a.upgrades.get("fuel_insulation", 0)
    hull_k = 1 - 0.15 * a.upgrades.get("heat_shield", 0)
    t.fuel = max(0, round(t.fuel + effects["fuel"] * fuel_k, 1))
    t.hull = max(0, round(t.hull + effects["hull"] * hull_k, 1))
    t.power = max(0, round(t.power + effects["power"], 1))
    rating = "timeout" if body.option_index == -1 else "optimal" if quality >= 0.95 else "acceptable" if quality >= 0.6 else "poor"
    overcome = quality >= 0.6
    pts = round(60 * quality) if overcome else 0
    d = Decision(obstacle_index=body.obstacle_index, option_index=body.option_index, quality=quality, rating=rating,
                 outcome=outcome, overcome=overcome, points=pts, telemetry=t)
    await db.missions.update_one({"id": mission_id}, {"$push": {"decisions": d.model_dump()}, "$set": {"telemetry": t.model_dump()}})
    return d


@router.post("/{mission_id}/complete", response_model=MissionReport)
async def complete(mission_id: str):
    m = await _get(mission_id)
    if m["status"] != "in_flight":
        raise HTTPException(status_code=400, detail="Mission already completed")
    if len(m["decisions"]) < len(m["obstacle_ids"]):
        raise HTTPException(status_code=400, detail="Resolve all obstacles first")
    a = await get_astronaut_or_404(m["astronaut_id"])
    planet = PLANET_BY_ID[m["planet_id"]]
    twr = m["stats"]["twr"]
    twr_score = 1.0 if 1.2 <= twr <= 2.5 else 0.8 if twr > 2.5 else max(0.5, 0.5 + (twr - 1.0) * 2.5)
    decision_avg = sum(d["quality"] for d in m["decisions"]) / len(m["decisions"])
    t = m["telemetry"]
    tele = (t["fuel"] + t["hull"] + t["power"]) / 300
    pct = (0.3 * m["readiness"] ** 3 + 0.1 * twr_score + 0.45 * decision_avg + 0.15 * tele) * 100 + 2 * a.upgrades.get("nav_ai", 0)
    if min(t["fuel"], t["hull"], t["power"]) <= 0:
        pct = min(pct, 30)
    pct = int(max(0, min(100, round(pct))))
    status = "success" if pct >= 80 else "partial" if pct >= 45 else "fail"

    obstacle_pts = sum(d["points"] for d in m["decisions"])
    completion = planet["reward"] if status == "success" else round(planet["reward"] * pct / 100 * 0.5) if status == "partial" else 0
    first_visit = status != "fail" and planet["id"] not in a.explored
    exploration = 0 if status == "fail" else planet["explore_bonus"] if first_visit else 25
    pb = PointsBreakdown(completion=completion, obstacles=obstacle_pts, exploration=exploration,
                         total=completion + obstacle_pts + exploration)

    await db.missions.update_one({"id": mission_id}, {"$set": {"status": status, "success_pct": pct, "points": pb.model_dump(),
                                                                "first_visit": first_visit}})
    upd: dict = {"$inc": {"points": pb.total, "total_points_earned": pb.total, "missions_flown": 1}}
    if status != "fail":
        upd["$addToSet"] = {"explored": planet["id"]}
    await db.astronauts.update_one({"id": a.id}, upd)
    return MissionReport(mission=Mission(**(await _get(mission_id))), astronaut=await get_astronaut_or_404(a.id))
