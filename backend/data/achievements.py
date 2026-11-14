"""Achievement rules (id -> bonus points). Names/descriptions are localised on the frontend."""

ACHIEVEMENTS = {
    "first_flight": 50, "first_success": 100, "moonwalker": 150, "red_planet": 200, "gas_giant": 300,
    "grand_tour": 400, "flawless": 250, "storm_rider": 200, "hard_mode": 250, "perfect_score": 300, "veteran": 350,
}


def evaluate(m: dict, astro: dict, explored: set[str]) -> list[str]:
    """Return achievement ids satisfied after mission m (not yet filtered by already-owned)."""
    ok = m["status"] != "fail"
    succ = m["status"] == "success"
    decs = m.get("decisions", [])
    weather = [d for d, o in zip(decs, m.get("obs_full", [])) if o.get("kind", "classic") != "classic"]
    rules = {
        "first_flight": True,
        "first_success": succ,
        "moonwalker": succ and m["planet_id"] == "moon",
        "red_planet": succ and m["planet_id"] == "mars",
        "gas_giant": succ and m["planet_id"] in ("jupiter", "saturn"),
        "grand_tour": ok and len(explored) >= 5,
        "flawless": ok and bool(decs) and all(d["rating"] == "optimal" for d in decs),
        "storm_rider": ok and len(weather) >= 2 and all(d["overcome"] for d in weather),
        "hard_mode": succ and m.get("difficulty") == "hard",
        "perfect_score": m.get("success_pct", 0) >= 95,
        "veteran": astro.get("missions_flown", 0) + 1 >= 10,
    }
    return [k for k, v in rules.items() if v]
