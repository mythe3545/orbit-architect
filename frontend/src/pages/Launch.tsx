import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AlertOctagon, CheckCircle2, Fuel, Gauge, Rocket, Shield, Wrench, Zap, Timer, Trophy, Orbit } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { useAnalysis, useAstronaut, useAstronautId, useCatalog, useNasaImages, useWeeklyChallenge } from "@/lib/hooks";
import WeeklyChallengeCard from "@/components/WeeklyChallengeCard";
import AchievementPopup from "@/components/AchievementPopup";
import type { Decision, Mission, MissionReport, Planet, Telemetry, WeatherKind } from "@/lib/types";
import { RocketGraphic } from "@/components/RocketGraphic";
import FlightScene, { type FlightEvent } from "@/components/FlightScene";
import SpaceWeatherPanel, { KIND_COLOR, KIND_ICON } from "@/components/SpaceWeatherPanel";
import SimPanel from "@/components/SimPanel";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { sfx } from "@/lib/sound";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = "select" | "countdown" | "flight" | "report";

function PlanetImage({ q, fixed, className }: { q: string; fixed?: string | null; className?: string }) {
  const { data } = useNasaImages(q, 1);
  const url = fixed || data?.[0]?.url;
  return url ? <img src={url} alt={q} className={cn("object-cover", className)} loading="lazy" /> : <div className={cn("bg-gradient-to-br from-slate-700 to-slate-950", className)} />;
}

function PlanetCard({ planet, dv, selected, explored, onSelect }: { planet: Planet; dv: number; selected: boolean; explored: boolean; onSelect: () => void }) {
  const t = useT();
  const r = Math.min(1, dv / planet.required_dv_ms);
  return (
    <button onClick={onSelect} data-testid={`planet-card-${planet.id}`}
      className={cn("text-left rounded-xl border overflow-hidden bg-slate-900/60 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5",
        selected ? "border-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.25)]" : "border-slate-800 hover:border-cyan-500/50")}>
      <div className="relative h-28">
        <PlanetImage q={planet.image_query} fixed={planet.image_url} className="absolute inset-0 size-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        {explored && <span className="absolute top-2 right-2 font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/50 text-emerald-200">{t("explored")}</span>}
        <div className="absolute bottom-2 left-3 font-heading text-lg text-white">{planet.name}</div>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-slate-400">
          <span>{planet.distance_mkm >= 1 ? `${planet.distance_mkm} Mkm` : `${Math.round(planet.distance_mkm * 1e6).toLocaleString()} km`}</span>
          <span>g {planet.gravity_ms2}</span>
          <span>{planet.mean_temp_c}°C</span>
        </div>
        <div>
          <div className="flex justify-between font-mono text-[10px] mb-1">
            <span className="text-slate-500">{t("req", { x: (planet.required_dv_ms / 1000).toFixed(1) })}</span>
            <span className={r >= 1 ? "text-emerald-300" : r >= 0.85 ? "text-amber-300" : "text-rose-300"}>{Math.round(r * 100)}%</span>
          </div>
          <div className="h-1 rounded bg-slate-800"><div className={cn("h-full rounded", r >= 1 ? "bg-emerald-400" : r >= 0.85 ? "bg-amber-400" : "bg-rose-400")} style={{ width: `${r * 100}%` }} /></div>
        </div>
        <div className="font-mono text-[10px] text-amber-300/80">{t("reward", { a: planet.reward, b: planet.explore_bonus })}</div>
      </div>
    </button>
  );
}

function Bar({ icon: Icon, label, v, testid }: { icon: typeof Fuel; label: string; v: number; testid: string }) {
  return (
    <div data-testid={testid}>
      <div className="flex items-center justify-between font-mono text-[10px] mb-1">
        <span className="flex items-center gap-1 text-slate-400"><Icon className="size-3" />{label}</span>
        <span className={v > 60 ? "text-emerald-300" : v > 30 ? "text-amber-300" : "text-rose-300"}>{Math.round(v)}%</span>
      </div>
      <div className="h-1.5 rounded bg-slate-800 overflow-hidden">
        <motion.div className={cn("h-full", v > 60 ? "bg-emerald-400" : v > 30 ? "bg-amber-400" : "bg-rose-400")} animate={{ width: `${v}%` }} transition={{ duration: 0.6 }} />
      </div>
    </div>
  );
}

function CrisisCard({ mission, index, onChoose, busy }: { mission: Mission; index: number; onChoose: (opt: number) => void; busy: boolean }) {
  const t = useT();
  const o = mission.obstacles[index];
  const [left, setLeft] = useState(mission.decision_seconds);
  const fired = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left === 0 && !fired.current && !busy) { fired.current = true; onChoose(-1); }
  }, [left, busy, onChoose]);
  const pct = (left / mission.decision_seconds) * 100;
  const weather = o.kind !== "classic" ? o.kind : null;
  const WIcon = weather ? KIND_ICON[weather] : AlertOctagon;
  const regLevel = (label: string) => Number(label.match(/(\d+)\s*%|%\s*(\d+)/)?.slice(1).find(Boolean) ?? 50);
  return (
    <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
      className="rounded-xl border border-rose-400/50 bg-[#2a0e15]/95 backdrop-blur-xl p-4 animate-urgent" data-testid="crisis-card">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: weather ? KIND_COLOR[weather] : "#fda4af" }} data-testid="crisis-kind">
          <WIcon className={cn("size-3.5", weather === "FLR" && "animate-spin [animation-duration:3s]")} /> {weather ? t(`fx.${weather}`) : t("alarm")} · {t(`ph.${o.phase}`)}</span>
        <span className="flex items-center gap-1 font-mono text-sm text-rose-100 tabular-nums" data-testid="crisis-timer"><Timer className="size-3.5" />{left}s</span>
      </div>
      <div className="h-1 rounded bg-rose-950 mb-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} /></div>
      {weather && (
        <div className="flex flex-wrap gap-1.5 mb-2 font-mono text-[10px]" data-testid="crisis-donki-badge">
          <span className="px-2 py-0.5 rounded border" style={{ borderColor: KIND_COLOR[weather], color: KIND_COLOR[weather] }}>{t("donkiEvent")} · {weather}</span>
          <span className="px-2 py-0.5 rounded border border-slate-600 text-slate-200">{o.value}</span>
          <span className="px-2 py-0.5 rounded border border-slate-600 text-slate-300">{o.event_date}</span>
          <span className="px-2 py-0.5 rounded border border-rose-400/50 text-rose-200">{t(`sev.${o.severity}`)}</span>
        </div>
      )}
      <h3 className="font-heading text-xl text-white" data-testid="crisis-title">{o.title}</h3>
      <p className="text-sm text-rose-100/90 mt-1">{o.description}</p>
      <p className="font-mono text-[10px] text-rose-300/70 mt-2">{t("nasaRef")} · {o.nasa_ref}</p>
      {weather === "GST" ? (
        <div className="mt-3" data-testid="power-regulator">
          <div className="hud-label text-emerald-300/80 mb-2">{t("reg")}</div>
          <div className="grid grid-cols-3 gap-2">
            {o.options.map((op, i) => (
              <button key={i} disabled={busy} onClick={() => { fired.current = true; sfx.click(); onChoose(i); }} data-testid={`crisis-choice-${i}`}
                className="group rounded-lg border border-slate-700 bg-slate-950/70 p-2 hover:border-emerald-300 transition-[border-color] duration-150 disabled:opacity-50">
                <div className="relative h-20 w-6 mx-auto rounded bg-slate-800 overflow-hidden">
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 transition-[height] duration-300" style={{ height: `${regLevel(op.label)}%` }} />
                </div>
                <div className="font-mono text-sm text-white mt-1.5">{regLevel(op.label)}%</div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{op.detail}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
      <div className="mt-3 space-y-2">
        {o.options.map((op, i) => (
          <button key={i} disabled={busy} onClick={() => { fired.current = true; sfx.click(); onChoose(i); }} data-testid={`crisis-choice-${i}`}
            className="w-full text-left rounded-lg border border-slate-700 bg-slate-950/70 p-3 hover:border-cyan-300 hover:bg-cyan-400/5 transition-[border-color,background-color] duration-150 disabled:opacity-50">
            <div className="flex items-center gap-2 text-sm text-white"><span className="font-mono text-cyan-300 text-xs">{String.fromCharCode(65 + i)}</span>{op.label}</div>
            <div className="text-xs text-slate-400 mt-0.5 pl-5">{op.detail}</div>
          </button>
        ))}
      </div>
      )}
    </motion.div>
  );
}

/** The default design label is stored in English; show it in the current language. */
export const rocketLabel = (l: string, t: (k: string) => string) => (l === "Custom Rocket" ? t("customRocket") : l);

const RATING: Record<Decision["rating"], { label: string; cls: string }> = {
  optimal: { label: "r.optimal", cls: "text-emerald-300 border-emerald-400/50 bg-[#0b291b]" },
  acceptable: { label: "r.acceptable", cls: "text-amber-200 border-amber-400/50 bg-amber-400/5" },
  poor: { label: "r.poor", cls: "text-rose-200 border-rose-400/50 bg-[#2a0e15]" },
  timeout: { label: "r.timeout", cls: "text-rose-200 border-rose-400/50 bg-[#2a0e15]" },
};

const EVENT_KEY: Record<FlightEvent, string> = { liftoff: "ev.liftoff", maxq: "ev.maxq", booster: "ev.booster", stage: "ev.stage", tli: "ev.tli", arrival: "ev.arrival" };

export default function Launch() {
  const t = useT();
  const settings = useSettings();
  const [callout, setCallout] = useState<string | null>(null);
  const nav = useNavigate();
  const qc = useQueryClient();
  const id = useAstronautId();
  const { data: weekly } = useWeeklyChallenge(id);
  const { data: astro } = useAstronaut();
  const { data: catalog } = useCatalog();
  const parts = useMemo(() => Object.fromEntries((catalog?.parts ?? []).map((p) => [p.id, p])), [catalog]);
  const stack = astro?.blueprint.stack ?? [];
  const { data: analysis } = useAnalysis(stack, id);

  const [phase, setPhase] = useState<Phase>("select");
  const [planetId, setPlanetId] = useState("moon");
  const [mission, setMission] = useState<Mission | null>(null);
  const [count, setCount] = useState(5);
  const [progress, setProgress] = useState(0);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [crisis, setCrisis] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<Decision | null>(null);
  const [report, setReport] = useState<MissionReport | null>(null);
  const completing = useRef(false);
  const [forced, setForced] = useState<WeatherKind[]>([]);
  const [challengeArmed, setChallengeArmed] = useState(false);
  const [popup, setPopup] = useState<string[]>([]);
  const closePopup = useCallback(() => setPopup([]), []);
  const challengeOn = challengeArmed && !!weekly && !weekly.completed && weekly.planet_id === planetId;
  const [cps, setCps] = useState<number[]>([]);

  const planet = catalog?.planets.find((p) => p.id === planetId);
  const { data: planetImgs } = useNasaImages(planet?.image_query ?? "Moon", 1);
  const n = mission?.obstacles.length ?? 0;
  const baseCheckpoints = (m: Mission) => {
    const obs = m.obstacles;
    const transit = obs.filter((o) => o.phase === "transit").length;
    let k = 0;
    return obs.map((o) => (o.phase === "launch" ? 16 : o.phase === "arrival" ? 94 : 42 + (k++ + 0.5) * (44 / Math.max(1, transit))));
  };
  const checkpoints = cps;
  const telemetry: Telemetry = lastResult?.telemetry ?? decisions.at(-1)?.telemetry ?? mission?.telemetry ?? { fuel: 100, hull: 100, power: 100, shield: 100 };

  const startM = useMutation({
    mutationFn: () => apiPost<Mission>("/missions", { astronaut_id: id, planet_id: planetId, rocket_label: astro?.blueprint.label, stack, lang: settings.lang, difficulty: settings.difficulty, forced, challenge: challengeOn }),
    onSuccess: (m) => { setChallengeArmed(false); setMission(m); setCps(baseCheckpoints(m)); setForced([]); setDecisions([]); setProgress(0); setCrisis(null); setLastResult(null); setReport(null); completing.current = false; setCount(5); setPhase("countdown"); },
    onError: (e) => toast.error(e instanceof ApiError ? String((e.body as { detail?: string })?.detail ?? t("toast.scrub")) : t("toast.scrub")),
  });
  const decideM = useMutation({
    mutationFn: (opt: number) => apiPost<Decision>(`/missions/${mission!.id}/decisions`, { obstacle_index: crisis, option_index: opt }),
    onSuccess: (d) => { sfx.alarmStop(); if (d.overcome) sfx.good(); else sfx.bad(); setDecisions((x) => [...x, d]); setLastResult(d); setCrisis(null); if (d.points) toast.success(t("toast.overcome", { n: d.points })); },
    onError: () => toast.error(t("toast.uplink")),
  });
  const injectM = useMutation({
    mutationFn: (k: WeatherKind) => apiPost<Mission>(`/missions/${mission!.id}/inject`, { type: k }),
    onSuccess: (m, k) => {
      const at = decisions.length;
      setMission(m);
      setCps((c) => [...c.slice(0, at), Math.min(progress, 99), ...c.slice(at)]);
      setLastResult(null);
      toast.message(t("sim.injected", { x: t(`k.${k}`) }));
    },
    onError: () => toast.error(t("toast.uplink")),
  });
  const onSim = (k: WeatherKind) => {
    if (phase === "flight" && mission && crisis === null) injectM.mutate(k);
    else if (phase === "select") setForced((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));
  };
  const simPanel = (phase === "select" || phase === "flight") && (
    <SimPanel inFlight={phase === "flight"} queued={forced} onTrigger={onSim} onClear={() => setForced([])} disabled={phase === "flight" && (crisis !== null || injectM.isPending)} />
  );
  const activeWeather = crisis !== null ? mission?.obstacles[crisis]?.kind : null;
  const completeM = useMutation({
    mutationFn: () => apiPost<MissionReport>(`/missions/${mission!.id}/complete`),
    onSuccess: (r) => { sfx.stopAll(); if (r.mission.status === "fail") sfx.fail(); else sfx.success(); setReport(r); setPopup(r.new_achievements); qc.setQueryData(["astronaut", r.astronaut.id], r.astronaut); qc.invalidateQueries({ queryKey: ["missions"] }); qc.invalidateQueries({ queryKey: ["challenge"] }); setPhase("report"); },
    onError: () => { completing.current = false; toast.error(t("toast.report")); },
  });

  // countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    sfx.countdown(count);
    if (count === 1) sfx.rumbleStart();
    if (count <= 0) { sfx.boom(); setPhase("flight"); return; }
    const tm = setTimeout(() => setCount((c) => c - 1), 900);
    return () => clearTimeout(tm);
  }, [phase, count]);

  // flight ticker: paused while a crisis or its result is on screen
  useEffect(() => {
    if (phase !== "flight" || crisis !== null || lastResult !== null) return;
    const tm = setInterval(() => setProgress((p) => Math.min(100, p + (p < 32 ? 0.2 : 0.45) * settings.speed)), 80);
    return () => clearInterval(tm);
  }, [phase, crisis, lastResult, settings.speed]);

  // engine rumble fades with altitude; alarm while a crisis is open
  useEffect(() => { if (phase === "flight") { if (progress < 31) sfx.rumbleSet(1 - progress / 34); else sfx.rumbleStop(); } }, [phase, progress]);
  useEffect(() => { if (crisis !== null) sfx.alarmStart(mission?.obstacles[crisis]?.kind === "FLR"); else sfx.alarmStop(); }, [crisis, mission]);
  useEffect(() => () => sfx.stopAll(), []);
  const onEvent = useCallback((e: FlightEvent) => {
    if (e === "booster" || e === "stage") sfx.staging();
    setCallout(e);
    window.setTimeout(() => setCallout((c) => (c === e ? null : c)), 2200);
  }, []);

  useEffect(() => {
    if (phase !== "flight" || crisis !== null || lastResult !== null) return;
    const next = decisions.length;
    if (next < n && progress >= checkpoints[next]) setCrisis(next);
    else if (next >= n && progress >= 100 && !completing.current) { completing.current = true; completeM.mutate(); }
  }, [progress, phase, crisis, lastResult, decisions.length, n, checkpoints, completeM]);

  if (!catalog || !astro) return <div className="p-10 font-mono text-sm text-cyan-300/70" data-testid="launch-loading">{t("connecting")}</div>;

  const stats = analysis?.stats;
  const notReady = analysis && !analysis.ready;

  // ---------------- SELECT
  if (phase === "select") {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-end gap-4 justify-between mb-6">
          <div>
            <p className="hud-label mb-1">{t("plan.kicker")}</p>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">{t("plan.title")}</h1>
            <p className="text-slate-400 mt-1 max-w-xl text-sm">{t("plan.desc")}</p>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-cyan-500/20 bg-slate-900/60 p-3" data-testid="launch-rocket-summary">
            <div className="h-20 w-14 blueprint-grid rounded grid place-items-center overflow-hidden"><RocketGraphic stack={stack} parts={parts} scale={1.6} /></div>
            <div>
              <div className="text-white font-heading">{rocketLabel(astro.blueprint.label, t)}</div>
              <div className="font-mono text-[11px] text-slate-400">Δv {((stats?.delta_v_ms ?? 0) / 1000).toFixed(2)} km/s · TWR {(stats?.twr ?? 0).toFixed(2)}</div>
              <Link to="/builder" className="font-mono text-[11px] text-cyan-300 hover:underline" data-testid="modify-design-link">{t("modify")}</Link>
            </div>
          </div>
        </div>
        {notReady && (
          <div className="mb-5 rounded-xl border border-rose-400/40 bg-[#2a0e15] p-4 flex flex-wrap gap-3 items-center justify-between" data-testid="launch-not-ready">
            <span className="text-sm text-rose-100">{t("notReady", { x: analysis.issues.find((i) => i.severity === "error")?.title ?? "" })}</span>
            <Link to="/builder" className={buttonVariants({ variant: "outline", size: "sm" })}>{t("fixBuilder")}</Link>
          </div>
        )}
        {weekly && (
          <div className="mb-5">
            <WeeklyChallengeCard ch={weekly} planetName={catalog.planets.find((p) => p.id === weekly.planet_id)?.name ?? weekly.planet_id} armed={challengeOn}
              onArm={() => { sfx.click(); if (challengeOn) { setChallengeArmed(false); return; } setPlanetId(weekly.planet_id); setChallengeArmed(true); }} />
          </div>
        )}
        <div className="mb-5"><SpaceWeatherPanel /></div>
        {forced.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 font-mono text-[11px]" data-testid="forced-events">
            {forced.map((k) => <span key={k} className="px-2 py-0.5 rounded-full border" style={{ borderColor: KIND_COLOR[k], color: KIND_COLOR[k] }}>{t(`k.${k}`)}</span>)}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {catalog.planets.map((p) => (
            <PlanetCard key={p.id} planet={p} dv={stats?.delta_v_ms ?? 0} selected={p.id === planetId} explored={astro.explored.includes(p.id)} onSelect={() => setPlanetId(p.id)} />
          ))}
        </div>
        {planet && (
          <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/30 bg-slate-950/85 backdrop-blur-xl p-4 hud-glow" data-testid="launch-bar">
            <div>
              <div className="hud-label">{t("target", { name: planet.name })} · {t("difficulty")}: {t(`d.${settings.difficulty}`)}</div>
              <p className="text-sm text-slate-300 mt-0.5">{planet.fact}</p>
            </div>
            <Button size="lg" disabled={!analysis?.ready || startM.isPending} onClick={() => { sfx.click(); startM.mutate(); }} className="font-mono uppercase tracking-[0.18em]" data-testid="launch-mission-btn">
              <Rocket className="size-4" /> {startM.isPending ? t("arming") : t("launchTo", { name: planet.name })}
            </Button>
          </div>
        )}
        {simPanel}
      </div>
    );
  }

  // ---------------- REPORT
  if (phase === "report" && report) {
    const m = report.mission;
    const tone = m.status === "success" ? "text-emerald-300" : m.status === "partial" ? "text-amber-300" : "text-rose-300";
    const label = t(`st.${m.status}`);
    const C = 2 * Math.PI * 70;
    return (
      <div className="px-4 lg:px-8 py-8 max-w-5xl mx-auto" data-testid="mission-report">
        {popup.length > 0 && <AchievementPopup ids={popup} onDone={closePopup} />}
        <p className="hud-label mb-2">{t("report.kicker")} · {rocketLabel(m.rocket_label, t)} → {m.planet_name}</p>
        <div className="grid md:grid-cols-[260px_1fr] gap-6 items-center">
          <div className="relative size-[220px] mx-auto">
            <svg viewBox="0 0 160 160" className="size-full -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="10" fill="none" />
              <motion.circle cx="80" cy="80" r="70" strokeWidth="10" fill="none" strokeLinecap="round"
                stroke={m.status === "success" ? "#34d399" : m.status === "partial" ? "#fbbf24" : "#fb7185"}
                strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - m.success_pct / 100) }} transition={{ duration: 1.4, ease: "easeOut" }} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <div className={cn("font-heading text-5xl font-bold tabular-nums", tone)} data-testid="mission-success-pct">{m.success_pct}%</div>
                <div className="font-mono text-[10px] text-slate-400">{t("score")}</div>
              </div>
            </div>
          </div>
          <div>
            <h1 className={cn("font-heading text-4xl font-bold tracking-tight", tone)} data-testid="mission-status">{label}</h1>
            <p className="text-slate-400 mt-1 text-sm">{t("report.sub", { a: m.decisions.filter((d) => d.overcome).length, b: m.decisions.length, r: Math.round(m.readiness * 100) })}{m.first_visit ? t("firstVisit", { p: m.planet_name }) : ""}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {[[t("pts.mission"), m.points.completion, "points-completion"], [t("pts.obstacles"), m.points.obstacles, "points-obstacles"], [t("pts.exploration"), m.points.exploration, "points-exploration"], [t("pts.total"), m.points.total, "points-total"]].map(([k, v, t]) => (
                <div key={t as string} className={cn("rounded-lg border p-3", t === "points-total" ? "border-amber-400/50 bg-amber-400/10" : "border-slate-800 bg-slate-900/60")} data-testid={t as string}>
                  <div className="hud-label text-[9px]">{k}</div>
                  <div className="font-mono text-2xl text-amber-200 tabular-nums">+{v}</div>
                </div>
              ))}
            </div>
            {report.challenge_bonus > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-300/60 bg-amber-300/10 px-3 py-2 ach-glow" data-testid="report-challenge-bonus">
                <span className="hud-label text-amber-300">{t("weekly.done")}</span><span className="font-mono text-xl text-amber-200">+{report.challenge_bonus}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-6">
              <Button onClick={() => setPhase("select")} data-testid="fly-again-button"><Orbit className="size-4" /> {t("newMission")}</Button>
              <Button variant="outline" onClick={() => nav("/builder")} data-testid="report-modify-rocket-button"><Wrench className="size-4" /> {t("modifyRocket")}</Button>
              <Button variant="outline" onClick={() => nav("/hangar?tab=upgrades")} data-testid="report-upgrades-button"><Trophy className="size-4" /> {t("spend")}</Button>
            </div>
          </div>
        </div>
        {report.new_achievements.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-400/50 bg-amber-400/[0.07] backdrop-blur-md p-4" data-testid="report-achievements">
            <div className="flex items-center justify-between mb-2"><span className="hud-label text-amber-300">{t("nav.ach")}</span><span className="font-mono text-sm text-amber-200">+{report.achievement_bonus}</span></div>
            <div className="flex flex-wrap gap-2">
              {report.new_achievements.map((id, i) => {
                const a = ACHIEVEMENTS.find((x) => x.id === id);
                return a ? (
                  <motion.span key={id} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 + i * 0.12, type: "spring" }}
                    className="flex items-center gap-1.5 rounded-full border border-amber-300/50 bg-black/40 px-3 py-1 text-sm text-white">{a.icon} {a.tx[settings.lang][0]} <span className="font-mono text-[10px] text-amber-300">+{a.bonus}</span></motion.span>
                ) : null;
              })}
            </div>
          </div>
        )}
        <div className="mt-8 space-y-2" data-testid="decision-log">
          <div className="hud-label">{t("decisionLog")}</div>
          {m.decisions.map((d, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <span className={cn("font-mono text-[10px] px-2 py-0.5 rounded border", RATING[d.rating].cls)}>{t(RATING[d.rating].label)}</span>
              <span className="text-sm text-white">{m.obstacles[i]?.title}</span>
              <span className="text-xs text-slate-400 flex-1">{d.option_index >= 0 ? m.obstacles[i]?.options[d.option_index]?.label : t("noDecision")}</span>
              <span className="font-mono text-xs text-amber-300">+{d.points}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------- COUNTDOWN / FLIGHT
  const ascent = Math.min(1, progress / 30);
  const inSpace = progress >= 31;
  const altKm = inSpace ? Math.round(185 + ((progress - 31) / 69) * (planet ? planet.distance_mkm * 1e6 : 1000)) : Math.round(Math.pow(ascent, 1.6) * 185);
  const vel = inSpace ? (11.2 - ((progress - 31) / 69) * 3).toFixed(1) : (Math.pow(ascent, 1.3) * 7.8).toFixed(2);
  const met = Math.round(progress < 31 ? progress * 17 : 510 + (progress - 31) * 3600 * (planet ? Math.max(1, Math.log10(planet.distance_mkm * 1e3 + 10)) : 1));
  const fmtMet = `T+${String(Math.floor(met / 3600)).padStart(2, "0")}:${String(Math.floor((met % 3600) / 60)).padStart(2, "0")}:${String(met % 60).padStart(2, "0")}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6 max-w-[1600px] mx-auto">
      {simPanel}
      <section className={cn("lg:col-span-8 relative rounded-xl border border-cyan-500/30 overflow-hidden bg-black h-[62vh] min-h-[440px]", activeWeather === "IPS" && settings.shake && "animate-glitch")} data-testid="flight-viewport">
        <FlightScene stack={stack} parts={parts} progress={progress} phase={phase === "countdown" ? "countdown" : "flight"} count={count}
          alert={crisis !== null} planetUrl={planet?.image_url ?? planetImgs?.[0]?.url} checkpoints={checkpoints} decided={decisions.map((d) => d.overcome)} onEvent={onEvent} weather={activeWeather === "classic" ? null : activeWeather} />
        <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-10 pointer-events-none">
          {[["met", fmtMet], ["alt", inSpace ? `${altKm.toLocaleString()} km` : `${altKm} km`], ["vel", `${vel} km/s`], ["target", mission?.planet_name ?? ""]].map(([k, v]) => (
            <div key={k} className="rounded-md border border-cyan-500/25 bg-slate-950/60 backdrop-blur px-3 py-1.5">
              <div className="hud-label text-[9px]">{t(`hud.${k}`)}</div>
              <div className="font-mono text-sm text-white tabular-nums" data-testid={`flight-hud-${k}`}>{v}</div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
          <div className="h-1 rounded bg-white/10 overflow-hidden"><div className="h-full bg-cyan-300 transition-[width] duration-100" style={{ width: `${progress}%` }} data-testid="flight-progress" /></div>
        </div>
        <AnimatePresence>
          {callout && phase === "flight" && (
            <motion.div key={callout} initial={{ opacity: 0, y: 8, letterSpacing: "0.5em" }} animate={{ opacity: 1, y: 0, letterSpacing: "0.3em" }} exit={{ opacity: 0 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-12 z-10 rounded-md border border-amber-300/50 bg-black/60 backdrop-blur px-4 py-2 font-mono text-xs text-amber-200 whitespace-nowrap" data-testid="flight-callout">
              {t(EVENT_KEY[callout as FlightEvent])}
            </motion.div>
          )}
          {phase === "countdown" && (
            <motion.div key={count} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-x-0 top-[18%] grid place-items-center z-20 pointer-events-none" data-testid="launch-countdown">
              <div className="text-center drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                <div className="hud-label mb-2">{t("tminus")}</div>
                <div className="font-heading text-7xl sm:text-8xl font-bold text-white tabular-nums">{count > 0 ? count : t("ev.liftoff")}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <aside className="lg:col-span-4 space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3" data-testid="systems-panel">
          <div className="hud-label">{t("systems")} · {rocketLabel(mission?.rocket_label ?? "", t)}</div>
          <Bar icon={Fuel} label={t("fuel")} v={telemetry.fuel} testid="telemetry-fuel" />
          <Bar icon={Shield} label={t("hull")} v={telemetry.hull} testid="telemetry-hull" />
          <Bar icon={Zap} label={t("power")} v={telemetry.power} testid="telemetry-power" />
          <Bar icon={Shield} label={t("shield")} v={telemetry.shield ?? 100} testid="telemetry-shield" />
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Gauge className="size-3" />TWR {mission?.stats.twr}</span>
            <span>Δv {((mission?.stats.delta_v_ms ?? 0) / 1000).toFixed(1)}</span>
            <span>{t("ready")} {Math.round((mission?.readiness ?? 0) * 100)}%</span>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {mission && crisis !== null && (
            <CrisisCard key={`c-${crisis}`} mission={mission} index={crisis} busy={decideM.isPending} onChoose={(opt) => decideM.mutate(opt)} />
          )}
          {lastResult && (
            <motion.div key={`r-${lastResult.obstacle_index}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={cn("rounded-xl border p-4", RATING[lastResult.rating].cls)} data-testid="decision-result">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-[0.2em]">{t(RATING[lastResult.rating].label)}</span>
                <span className="font-mono text-sm text-amber-200">+{lastResult.points} {t("ptsUnit")}</span>
              </div>
              <p className="text-sm text-white mt-2">{lastResult.outcome}</p>
              <Button className="mt-3 w-full" onClick={() => { sfx.click(); setLastResult(null); }} data-testid="continue-flight-button">
                <CheckCircle2 className="size-4" /> {t("continue")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {phase === "flight" && <SpaceWeatherPanel compact />}
        {crisis === null && !lastResult && (
          <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4" data-testid="flight-status">
            <div className="hud-label mb-1">{t("fd")}</div>
            <p className="text-sm text-slate-300">
              {phase === "countdown" ? t("fd.go") : completeM.isPending ? t("fd.filing") : progress < 31 ? t("fd.ascent", { n: n - decisions.length }) : t("fd.coast", { p: mission?.planet_name ?? "", n: n - decisions.length })}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
