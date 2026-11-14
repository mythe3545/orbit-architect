# Orbital Forge — NASA Mission Architect (SPEC)

## What it does
1. Astronaut credential terminal (`/`): enroll (full name, callsign, agency ID, specialization, nationality, 4–6 digit PIN) or log in (callsign + PIN). Astronaut id stored in localStorage (`astro_id`).
2. Builder (`/builder`): Proteus-like workspace. Side-menu rail toggles the NASA parts library (41 curated real parts in 7 categories). Drag parts onto the blueprint canvas (HTML5 DnD) or tap +. Reorder by dragging or ↑/↓; engines/boosters have qty ×1–9. Live telemetry (mass, thrust, TWR, Δv via Tsiolkovsky staging) and guide panel (errors/warnings with alternative parts, "Use" to swap in). Help guide dialog. Blueprint autosaves to the server.
3. Launch (`/launch`): pick a destination (9: ISS orbit, Moon, Venus, Mars, Mercury, Jupiter, Saturn, Uranus, Neptune; NSSDCA data + live NASA Image Library images). Countdown → flight along trajectory → timed crisis cards (2–3 options, countdown; timeout = option -1) → report with success % (≥80 success, ≥45 partial, else fail) and points.
4. Hangar (`/hangar`): 18 historic NASA rockets (Saturn V, Skylab Saturn V, Saturn IB, SLS Block 1/1B, Shuttle, Atlas V 541, Atlas-Agena, Mercury-Atlas, Delta IV Heavy, Delta II, Titan II, Titan IIIE, Titan IV-B, Antares, Falcon 9, Falcon Heavy, Mercury-Redstone) as real part stacks. Fly or Modify (both save as blueprint). Upgrade depot (`?tab=upgrades`) spends points.
5. Dossier (`/dossier`): profile, explored bodies, mission log.

## Points (server-side)
- Obstacle overcome (quality ≥ 0.6): round(60 × quality)
- Mission completion: success → planet.reward; partial → reward × pct × 0.5
- Exploration: first visit → planet.explore_bonus, repeat → 25 (none on fail)

## API (all /api)
GET /catalog · POST /rocket/analyze · GET /nasa/images?q= · POST /astronauts/enroll · POST /astronauts/login · GET /astronauts/{id} · PUT /astronauts/{id}/blueprint · POST /astronauts/{id}/upgrades/{upgrade_id} · GET /astronauts/{id}/missions · POST /missions · GET /missions/{id} · POST /missions/{id}/decisions · POST /missions/{id}/complete

## Data
Static curated data in backend/data/nasa.py. Mongo: `astronauts` (pin_hash pbkdf2), `missions`.
Physics/guide: backend/lib/rocket.py (single source of truth).

## Seed
`python backend/seed.py` → astronaut APOLLO / PIN 1969, 600 points, Saturn V blueprint.

## v2 additions
- Settings (`/settings`, localStorage `orbital_settings`): sound on/off + volume, language (en/tr/de), crisis difficulty (easy +8s ×0.8 pts, normal, hard -6s ×1.3 pts — sent to POST /missions as `difficulty`), rocket livery (classic/artemis/stealth/retro), animation speed (0.5–2×), camera shake.
- i18n: UI strings in frontend/src/lib/i18n.ts; server content (planets, categories, upgrades, rocket summaries, guide issues, obstacles, timeout text) in backend/data/i18n.py. `GET /catalog?lang=`, `POST /rocket/analyze {lang}`, `POST /missions {lang}`. Part names/descriptions stay English (proper nouns).
- Sound: Web Audio synth in frontend/src/lib/sound.ts (no audio files).
- Cinematic flight: frontend/src/components/FlightScene.tsx (canvas). Progress 0–30 = ascent (pad, tower, ignition smoke, camera follow, Max-Q vapour, booster sep @9, stage seps 15–27, Earth limb), 31–100 = space transit (parallax stars, Earth, NASA planet image, trajectory, craft burns). Checkpoints: launch obstacle @16, transit 42–86, arrival @94.
