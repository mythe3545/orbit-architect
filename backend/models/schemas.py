from datetime import datetime, timezone
from typing import Literal, Optional
import uuid

from pydantic import BaseModel, Field


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------- catalog ----------
class Category(BaseModel):
    id: str
    label: str


class Part(BaseModel):
    id: str
    name: str
    category: str
    program: str
    mass_t: float
    dry_t: float
    diameter_m: float
    propellant: Optional[str] = None
    thrust_sl_kn: float
    thrust_vac_kn: float
    isp_sl_s: float
    isp_vac_s: float
    description: str


class StackItem(BaseModel):
    part_id: str
    qty: int = Field(default=1, ge=1, le=9)


class FleetRocket(BaseModel):
    id: str
    name: str
    era: str
    flights: int
    height_m: float
    image_query: str
    summary: str
    stack: list[StackItem]


class Planet(BaseModel):
    id: str
    name: str
    distance_mkm: float
    gravity_ms2: float
    mean_temp_c: float
    day_hours: float
    moons: int
    atmosphere: str
    required_dv_ms: float
    reward: int
    explore_bonus: int
    obstacle_count: int
    image_query: str
    fact: str


class Upgrade(BaseModel):
    id: str
    name: str
    description: str
    base_cost: int
    max_level: int


class Catalog(BaseModel):
    categories: list[Category]
    parts: list[Part]
    rockets: list[FleetRocket]
    planets: list[Planet]
    upgrades: list[Upgrade]


class NasaImage(BaseModel):
    title: str
    url: str
    nasa_id: str
    date: Optional[str] = None


# ---------- rocket analysis ----------
class RocketStats(BaseModel):
    total_mass_t: float
    payload_mass_t: float
    liftoff_thrust_kn: float
    twr: float
    delta_v_ms: float
    stage_count: int


class GuideIssue(BaseModel):
    severity: Literal["error", "warning", "tip"]
    code: str
    title: str
    message: str
    item_index: Optional[int] = None
    alternatives: list[str] = []


class AnalyzeRequest(BaseModel):
    stack: list[StackItem]
    astronaut_id: Optional[str] = None


class RocketAnalysis(BaseModel):
    stats: RocketStats
    issues: list[GuideIssue]
    ready: bool


# ---------- astronaut ----------
class Blueprint(BaseModel):
    label: str = "Custom Rocket"
    stack: list[StackItem] = []


class EnrollRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=60)
    callsign: str = Field(min_length=2, max_length=20)
    agency_id: str = Field(min_length=2, max_length=30)
    specialization: str = Field(min_length=2, max_length=40)
    nationality: str = Field(default="", max_length=40)
    pin: str = Field(pattern=r"^\d{4,6}$")


class LoginRequest(BaseModel):
    callsign: str
    pin: str


class Astronaut(BaseModel):
    id: str = Field(default_factory=_uuid)
    full_name: str
    callsign: str
    agency_id: str
    specialization: str
    nationality: str = ""
    points: int = 0
    total_points_earned: int = 0
    explored: list[str] = []
    upgrades: dict[str, int] = {}
    blueprint: Blueprint = Field(default_factory=Blueprint)
    missions_flown: int = 0
    created_at: datetime = Field(default_factory=_now)


# ---------- missions ----------
class Telemetry(BaseModel):
    fuel: float = 100
    hull: float = 100
    power: float = 100


class ObstacleOptionView(BaseModel):
    label: str
    detail: str


class ObstacleView(BaseModel):
    id: str
    phase: str
    title: str
    description: str
    nasa_ref: str
    options: list[ObstacleOptionView]


class Decision(BaseModel):
    obstacle_index: int
    option_index: int  # -1 = timed out
    quality: float
    rating: Literal["optimal", "acceptable", "poor", "timeout"]
    outcome: str
    overcome: bool
    points: int
    telemetry: Telemetry


class StartMissionRequest(BaseModel):
    astronaut_id: str
    planet_id: str
    rocket_label: str = "Custom Rocket"
    stack: list[StackItem]


class DecisionRequest(BaseModel):
    obstacle_index: int = Field(ge=0)
    option_index: int = Field(ge=-1)


class PointsBreakdown(BaseModel):
    completion: int = 0
    obstacles: int = 0
    exploration: int = 0
    total: int = 0


class Mission(BaseModel):
    id: str
    astronaut_id: str
    planet_id: str
    planet_name: str
    rocket_label: str
    stats: RocketStats
    readiness: float
    decision_seconds: int
    obstacles: list[ObstacleView]
    decisions: list[Decision]
    telemetry: Telemetry
    status: Literal["in_flight", "success", "partial", "fail"]
    success_pct: int = 0
    points: PointsBreakdown = Field(default_factory=PointsBreakdown)
    first_visit: bool = False
    created_at: datetime


class MissionReport(BaseModel):
    mission: Mission
    astronaut: Astronaut
