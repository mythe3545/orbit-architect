from typing import Optional

from fastapi import APIRouter

from lib.donki import fetch_apod, fetch_report
from models.schemas import Apod, SpaceWeatherReport

router = APIRouter()


@router.get("/donki/report", response_model=SpaceWeatherReport)
async def donki_report():
    """Live NASA DONKI space weather (FLR, SEP, GST, IPS, CME) for the last 30 days."""
    return await fetch_report()


@router.get("/apod", response_model=Optional[Apod])
async def apod():
    """NASA Astronomy Picture of the Day (used as the app background)."""
    return await fetch_apod()
