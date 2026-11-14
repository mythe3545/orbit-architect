"""Style shop catalogue. Visuals + names live in frontend/src/lib/cosmetics.ts (keyed by id); price 0 = free for everyone."""

COSMETICS = [
    # rocket paints
    {"id": "paint_classic", "kind": "paint", "price": 0}, {"id": "paint_artemis", "kind": "paint", "price": 0},
    {"id": "paint_stealth", "kind": "paint", "price": 0}, {"id": "paint_retro", "kind": "paint", "price": 0},
    {"id": "paint_gold", "kind": "paint", "price": 900}, {"id": "paint_carbon", "kind": "paint", "price": 600},
    {"id": "paint_mars", "kind": "paint", "price": 500}, {"id": "paint_nebula", "kind": "paint", "price": 800},
    {"id": "paint_checker", "kind": "paint", "price": 700}, {"id": "paint_arctic", "kind": "paint", "price": 450},
    # engine flames
    {"id": "flame_kerosene", "kind": "flame", "price": 0}, {"id": "flame_hydrogen", "kind": "flame", "price": 400},
    {"id": "flame_plasma", "kind": "flame", "price": 650}, {"id": "flame_emerald", "kind": "flame", "price": 550},
    {"id": "flame_solar", "kind": "flame", "price": 850},
    # flight trails
    {"id": "trail_none", "kind": "trail", "price": 0}, {"id": "trail_sparks", "kind": "trail", "price": 350},
    {"id": "trail_ion", "kind": "trail", "price": 500}, {"id": "trail_stardust", "kind": "trail", "price": 650},
    {"id": "trail_rainbow", "kind": "trail", "price": 1000},
    # menu themes
    {"id": "ui_mission", "kind": "theme", "price": 0}, {"id": "ui_emerald", "kind": "theme", "price": 0},
    {"id": "ui_arctic", "kind": "theme", "price": 0}, {"id": "ui_mars", "kind": "theme", "price": 500},
    {"id": "ui_nebula", "kind": "theme", "price": 700}, {"id": "ui_gold", "kind": "theme", "price": 900},
    {"id": "ui_aurora", "kind": "theme", "price": 1100},
]
COSMETIC_BY_ID = {c["id"]: c for c in COSMETICS}
