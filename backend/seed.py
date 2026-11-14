"""Idempotent seed: demo astronaut APOLLO / PIN 1969."""
import asyncio

from data.nasa import ROCKET_BY_ID
from lib.db import db, ensure_indexes
from models.schemas import Astronaut, Blueprint, StackItem
from routers.astronauts import hash_pin


async def main():
    await ensure_indexes()
    if await db.astronauts.find_one({"callsign": "APOLLO"}):
        print("demo astronaut exists")
        return
    sv = ROCKET_BY_ID["saturn_v"]
    a = Astronaut(full_name="Demo Astronaut", callsign="APOLLO", agency_id="NASA/JSC-1969", specialization="Flight Commander",
                  nationality="USA", points=600, total_points_earned=600,
                  blueprint=Blueprint(label="Saturn V", stack=[StackItem(**s) for s in sv["stack"]]))
    await db.astronauts.insert_one({**a.model_dump(), "pin_hash": hash_pin("1969")})
    print("seeded APOLLO / 1969")


if __name__ == "__main__":
    asyncio.run(main())
