import hashlib
import os

from fastapi import APIRouter, HTTPException

from data.cosmetics import COSMETIC_BY_ID
from data.nasa import UPGRADE_BY_ID
from lib.db import db
from models.schemas import Astronaut, Blueprint, EnrollRequest, LoginRequest, Mission

router = APIRouter(prefix="/astronauts")


def hash_pin(pin: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    return salt.hex() + ":" + hashlib.pbkdf2_hmac("sha256", pin.encode(), salt, 100_000).hex()


def verify_pin(pin: str, stored: str) -> bool:
    salt_hex, _ = stored.split(":", 1)
    return hash_pin(pin, bytes.fromhex(salt_hex)) == stored


async def get_astronaut_or_404(astronaut_id: str) -> Astronaut:
    doc = await db.astronauts.find_one({"id": astronaut_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    return Astronaut(**doc)


@router.post("/enroll", response_model=Astronaut)
async def enroll(body: EnrollRequest):
    callsign = body.callsign.strip().upper()
    if await db.astronauts.find_one({"callsign": callsign}):
        raise HTTPException(status_code=409, detail="Callsign already registered. Log in instead.")
    a = Astronaut(full_name=body.full_name.strip(), callsign=callsign, agency_id=body.agency_id.strip(),
                  specialization=body.specialization, nationality=body.nationality.strip())
    await db.astronauts.insert_one({**a.model_dump(), "pin_hash": hash_pin(body.pin)})
    return a


@router.post("/login", response_model=Astronaut)
async def login(body: LoginRequest):
    doc = await db.astronauts.find_one({"callsign": body.callsign.strip().upper()})
    if not doc or not verify_pin(body.pin, doc.get("pin_hash", "00:")):
        raise HTTPException(status_code=401, detail="Invalid callsign or PIN")
    return Astronaut(**doc)


@router.get("/{astronaut_id}", response_model=Astronaut)
async def get_astronaut(astronaut_id: str):
    return await get_astronaut_or_404(astronaut_id)


@router.put("/{astronaut_id}/blueprint", response_model=Astronaut)
async def save_blueprint(astronaut_id: str, body: Blueprint):
    await get_astronaut_or_404(astronaut_id)
    await db.astronauts.update_one({"id": astronaut_id}, {"$set": {"blueprint": body.model_dump()}})
    return await get_astronaut_or_404(astronaut_id)


@router.post("/{astronaut_id}/upgrades/{upgrade_id}", response_model=Astronaut)
async def buy_upgrade(astronaut_id: str, upgrade_id: str):
    a = await get_astronaut_or_404(astronaut_id)
    u = UPGRADE_BY_ID.get(upgrade_id)
    if not u:
        raise HTTPException(status_code=404, detail="Upgrade not found")
    level = a.upgrades.get(upgrade_id, 0)
    if level >= u["max_level"]:
        raise HTTPException(status_code=400, detail="Upgrade already at max level")
    cost = u["base_cost"] * (level + 1)
    res = await db.astronauts.update_one({"id": astronaut_id, "points": {"$gte": cost}},
                                         {"$inc": {"points": -cost, f"upgrades.{upgrade_id}": 1}})
    if res.modified_count == 0:
        raise HTTPException(status_code=400, detail=f"Not enough points ({cost} needed)")
    return await get_astronaut_or_404(astronaut_id)


@router.post("/{astronaut_id}/cosmetics/{cosmetic_id}", response_model=Astronaut)
async def buy_cosmetic(astronaut_id: str, cosmetic_id: str):
    """Buy a style-shop item with points (free items are always owned)."""
    a = await get_astronaut_or_404(astronaut_id)
    c = COSMETIC_BY_ID.get(cosmetic_id)
    if not c:
        raise HTTPException(status_code=404, detail="Item not found")
    if c["price"] == 0 or cosmetic_id in a.owned_cosmetics:
        raise HTTPException(status_code=400, detail="Item already owned")
    res = await db.astronauts.update_one({"id": astronaut_id, "points": {"$gte": c["price"]}, "owned_cosmetics": {"$ne": cosmetic_id}},
                                         {"$inc": {"points": -c["price"]}, "$addToSet": {"owned_cosmetics": cosmetic_id}})
    if res.modified_count == 0:
        raise HTTPException(status_code=400, detail=f"Not enough points ({c['price']} needed)")
    return await get_astronaut_or_404(astronaut_id)


@router.get("/{astronaut_id}/missions", response_model=list[Mission])
async def list_missions(astronaut_id: str):
    docs = await db.missions.find({"astronaut_id": astronaut_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [Mission(**d) for d in docs]
