// Hand-written mirrors of backend/models/schemas.py — keep in sync.
export interface Category { id: string; label: string }
export interface Part {
  id: string; name: string; category: string; program: string; mass_t: number; dry_t: number;
  diameter_m: number; propellant: string | null; thrust_sl_kn: number; thrust_vac_kn: number;
  isp_sl_s: number; isp_vac_s: number; description: string;
}
export interface StackItem { part_id: string; qty: number }
export interface FleetRocket {
  id: string; name: string; era: string; flights: number; height_m: number; image_query: string;
  summary: string; stack: StackItem[];
}
export interface Planet {
  id: string; name: string; distance_mkm: number; gravity_ms2: number; mean_temp_c: number; day_hours: number;
  moons: number; atmosphere: string; required_dv_ms: number; reward: number; explore_bonus: number;
  obstacle_count: number; image_query: string; image_url?: string | null; fact: string;
}
export interface Upgrade { id: string; name: string; description: string; base_cost: number; max_level: number }
export interface Cosmetic { id: string; kind: "paint" | "flame" | "trail" | "theme"; price: number }
export interface Catalog { categories: Category[]; parts: Part[]; rockets: FleetRocket[]; planets: Planet[]; upgrades: Upgrade[]; cosmetics: Cosmetic[] }
export interface NasaImage { title: string; url: string; nasa_id: string; date: string | null }

export interface RocketStats {
  total_mass_t: number; payload_mass_t: number; liftoff_thrust_kn: number; twr: number; delta_v_ms: number; stage_count: number;
}
export interface GuideIssue {
  severity: "error" | "warning" | "tip"; code: string; title: string; message: string;
  item_index: number | null; alternatives: string[];
}
export interface RocketAnalysis { stats: RocketStats; issues: GuideIssue[]; ready: boolean }

export interface Blueprint { label: string; stack: StackItem[] }
export interface Astronaut {
  id: string; full_name: string; callsign: string; agency_id: string; specialization: string; nationality: string;
  points: number; total_points_earned: number; explored: string[]; upgrades: Record<string, number>;
  blueprint: Blueprint; missions_flown: number; achievements: string[]; challenges_done: string[]; owned_cosmetics: string[]; created_at: string;
}
export interface EnrollRequest {
  full_name: string; callsign: string; agency_id: string; specialization: string; nationality: string; pin: string;
}

export interface Telemetry { fuel: number; hull: number; power: number; shield: number }
export interface ObstacleOptionView { label: string; detail: string }
export type WeatherKind = "FLR" | "SEP" | "GST" | "IPS" | "CME";
export interface ObstacleView {
  id: string; kind: "classic" | WeatherKind; severity: number; value: string; event_date: string; phase: string; title: string; description: string; nasa_ref: string; options: ObstacleOptionView[];
}
export interface Decision {
  obstacle_index: number; option_index: number; quality: number;
  rating: "optimal" | "acceptable" | "poor" | "timeout"; outcome: string; overcome: boolean; points: number; telemetry: Telemetry;
}
export interface PointsBreakdown { completion: number; obstacles: number; exploration: number; total: number }
export interface Mission {
  id: string; astronaut_id: string; planet_id: string; planet_name: string; rocket_label: string; stats: RocketStats;
  readiness: number; decision_seconds: number; obstacles: ObstacleView[]; decisions: Decision[]; telemetry: Telemetry;
  status: "in_flight" | "success" | "partial" | "fail"; success_pct: number; points: PointsBreakdown;
  first_visit: boolean; lang: "en" | "tr" | "de"; difficulty: "easy" | "normal" | "hard"; challenge_week: string | null; created_at: string;
}
export interface MissionReport { mission: Mission; astronaut: Astronaut; new_achievements: string[]; achievement_bonus: number; challenge_bonus: number }
export interface WeeklyChallenge { week: string; event: DonkiEvent; planet_id: string; bonus: number; this_week: boolean; completed: boolean }
export interface DonkiEvent { type: WeatherKind; id: string; time: string; value: string; severity: number; link: string | null; archive: boolean; origin: "live" | "recent" | "archive" }
export interface SpaceWeatherReport {
  source: "live" | "recent" | "archive"; fetched_at: string; events: DonkiEvent[];
  latest: Partial<Record<WeatherKind, DonkiEvent>>; counts: Record<string, number>;
}
export interface Apod { date: string; title: string; url: string | null; hdurl: string | null; copyright: string | null; explanation: string }
