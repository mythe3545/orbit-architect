"""Weekly challenge: the strongest real DONKI event of the past 7 days, frozen per ISO week."""
from datetime import timedelta

from lib import donki
from lib.db import db
from lib.donki import today_utc

ROTATION = ["moon", "mars", "venus", "mercury", "jupiter", "saturn"]


def week_id() -> str:
    y, w, _ = today_utc().isocalendar()
    return f"{y}-W{w:02d}"


async def weekly() -> dict:
    wk = week_id()
    doc = await db.challenges.find_one({"week": wk}, {"_id": 0})
    if doc:
        return doc
    report = await donki.fetch_report()
    since = (today_utc() - timedelta(days=7)).isoformat()
    events = report["events"]
    recent = [e for e in events if e["time"][:10] >= since and not e.get("archive")]
    pool = recent or events
    ev = sorted(pool, key=lambda e: (e["severity"], e["time"]), reverse=True)[0]
    num = int(wk.split("W")[1])
    doc = {"week": wk, "event": ev, "planet_id": ROTATION[num % len(ROTATION)], "bonus": 200 + 100 * ev["severity"],
           "this_week": bool(recent)}
    if not recent:
        return doc  # archive fallback: don't freeze, so live data can replace it once available
    await db.challenges.update_one({"week": wk}, {"$setOnInsert": doc}, upsert=True)
    return await db.challenges.find_one({"week": wk}, {"_id": 0}) or doc
