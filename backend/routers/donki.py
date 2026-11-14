from typing import Optional

from fastapi import APIRouter

from lib.challenge import weekly
from lib.db import db

from lib.donki import fetch_apod, fetch_report
from models.schemas import Apod, SpaceWeatherReport, WeeklyChallenge

router = APIRouter()


@router.get("/donki/report", response_model=SpaceWeatherReport)
async def donki_report():
    """Live NASA DONKI space weather (FLR, SEP, GST, IPS, CME) for the last 30 days."""
    return await fetch_report()


@router.get("/apod", response_model=Optional[Apod])
async def apod():
    """NASA Astronomy Picture of the Day (used as the app background)."""
    return await fetch_apod()


@router.get("/challenge/weekly", response_model=WeeklyChallenge)
async def weekly_challenge(astronaut_id: Optional[str] = None):
    """This week's challenge mission, built from the strongest real DONKI event of the last 7 days."""
    ch = await weekly()
    a = await db.astronauts.find_one({"id": astronaut_id}, {"challenges_done": 1}) if astronaut_id else None
    return WeeklyChallenge(**ch, completed=bool(a and ch["week"] in a.get("challenges_done", [])))
