import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AlertOctagon, CheckCircle2, Fuel, Gauge, Rocket, Shield, Wrench, Zap, Timer, Trophy, Orbit } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { useAnalysis, useAstronaut, useAstronautId, useCatalog, useNasaImages } from "@/lib/hooks";
import type { Decision, Mission, MissionReport, Planet, Telemetry } from "@/lib/types";
import { RocketGraphic } from "@/components/RocketGraphic";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = "select" | "countdown" | "flight" | "report";

function PlanetImage({ q, className }: { q: string; className?: string }) {
  const { data } = useNasaImages(q, 1);
  const url = data?.[0]?.url;
  return url ? <img src={url} alt={q} className={cn("object-cover", className)} loading="lazy" /> : <div className={cn("bg-gradient-to-br from-slate-700 to-slate-950", className)} />;
}

function PlanetCard({ planet, dv, selected, explored, onSelect }: { planet: Planet; dv: number; selected: boolean; explored: boolean; onSelect: () => void }) {
  const r = Math.min(1, dv / planet.required_dv_ms);
  return (
    <button onClick={onSelect} data-testid={`planet-card-${planet.id}`}
      className={cn("text-left rounded-xl border overflow-hidden bg-slate-900/60 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5",
        selected ? "border-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.25)]" : "border-slate-800 hover:border-cyan-500/50")}>
      <div className="relative h-28">
        <PlanetImage q={planet.image_query} className="absolute inset-0 size-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        {explored && <span className="absolute top-2 right-2 font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/50 text-emerald-200">EXPLORED</span>}
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
            <span className="text-slate-500">Δv {(planet.required_dv_ms / 1000).toFixed(1)} km/s req</span>
            <span className={r >= 1 ? "text-emerald-300" : r >= 0.85 ? "text-amber-300" : "text-rose-300"}>{Math.round(r * 100)}%</span>
          </div>
          <div className="h-1 rounded bg-slate-800"><div className={cn("h-full rounded", r >= 1 ? "bg-emerald-400" : r >= 0.85 ? "bg-amber-400" : "bg-rose-400")} style={{ width: `${r * 100}%` }} /></div>
        </div>
        <div className="font-mono text-[10px] text-amber-300/80">+{planet.reward} mission · +{planet.explore_bonus} explore</div>
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
  return (
    <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
      className="rounded-xl border border-rose-400/50 bg-[#2a0e15]/95 backdrop-blur-xl p-4 animate-urgent" data-testid="crisis-card">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-rose-300"><AlertOctagon className="size-3.5" /> Master alarm · {o.phase}</span>
        <span className="flex items-center gap-1 font-mono text-sm text-rose-100 tabular-nums" data-testid="crisis-timer"><Timer className="size-3.5" />{left}s</span>
      </div>
      <div className="h-1 rounded bg-rose-950 mb-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} /></div>
      <h3 className="font-heading text-xl text-white" data-testid="crisis-title">{o.title}</h3>
      <p className="text-sm text-rose-100/90 mt-1">{o.description}</p>
      <p className="font-mono text-[10px] text-rose-300/70 mt-2">NASA ref · {o.nasa_ref}</p>
      <div className="mt-3 space-y-2">
        {o.options.map((op, i) => (
          <button key={i} disabled={busy} onClick={() => { fired.current = true; onChoose(i); }} data-testid={`crisis-choice-${i}`}
            className="w-full text-left rounded-lg border border-slate-700 bg-slate-950/70 p-3 hover:border-cyan-300 hover:bg-cyan-400/5 transition-[border-color,background-color] duration-150 disabled:opacity-50">
            <div className="flex items-center gap-2 text-sm text-white"><span className="font-mono text-cyan-300 text-xs">{String.fromCharCode(65 + i)}</span>{op.label}</div>
            <div className="text-xs text-slate-400 mt-0.5 pl-5">{op.detail}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

const RATING: Record<Decision["rating"], { label: string; cls: string }> = {
  optimal: { label: "OPTIMAL CALL", cls: "text-emerald-300 border-emerald-400/50 bg-[#0b291b]" },
  acceptable: { label: "ACCEPTABLE", cls: "text-amber-200 border-amber-400/50 bg-amber-400/5" },
  poor: { label: "POOR CALL", cls: "text-rose-200 border-rose-400/50 bg-[#2a0e15]" },
  timeout: { label: "TIMED OUT", cls: "text-rose-200 border-rose-400/50 bg-[#2a0e15]" },
};

const P0 = [70, 330], P1 = [320, -60], P2 = [630, 110];
const bez = (t: number) => [0, 1].map((k) => (1 - t) ** 2 * P0[k] + 2 * (1 - t) * t * P1[k] + t ** 2 * P2[k]);

export default function Launch() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const id = useAstronautId();
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

  const planet = catalog?.planets.find((p) => p.id === planetId);
  const n = mission?.obstacles.length ?? 0;
  const checkpoints = useMemo(() => Array.from({ length: n }, (_, i) => ((i + 1) * 100) / (n + 1)), [n]);
  const telemetry: Telemetry = lastResult?.telemetry ?? decisions.at(-1)?.telemetry ?? mission?.telemetry ?? { fuel: 100, hull: 100, power: 100 };

  const startM = useMutation({
    mutationFn: () => apiPost<Mission>("/missions", { astronaut_id: id, planet_id: planetId, rocket_label: astro?.blueprint.label, stack }),
    onSuccess: (m) => { setMission(m); setDecisions([]); setProgress(0); setCrisis(null); setLastResult(null); setReport(null); completing.current = false; setCount(5); setPhase("countdown"); },
    onError: (e) => toast.error(e instanceof ApiError ? String((e.body as { detail?: string })?.detail ?? "Launch scrubbed") : "Launch scrubbed"),
  });
  const decideM = useMutation({
    mutationFn: (opt: number) => apiPost<Decision>(`/missions/${mission!.id}/decisions`, { obstacle_index: crisis, option_index: opt }),
    onSuccess: (d) => { setDecisions((x) => [...x, d]); setLastResult(d); setCrisis(null); if (d.points) toast.success(`+${d.points} pts · obstacle overcome`); },
    onError: () => toast.error("Telemetry uplink lost. Try again."),
  });
  const completeM = useMutation({
    mutationFn: () => apiPost<MissionReport>(`/missions/${mission!.id}/complete`),
    onSuccess: (r) => { setReport(r); qc.setQueryData(["astronaut", r.astronaut.id], r.astronaut); qc.invalidateQueries({ queryKey: ["missions"] }); setPhase("report"); },
    onError: () => { completing.current = false; toast.error("Could not file mission report"); },
  });

  // countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) { setPhase("flight"); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [phase, count]);

  // flight ticker: paused while a crisis or its result is on screen
  useEffect(() => {
    if (phase !== "flight" || crisis !== null || lastResult !== null) return;
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 0.6)), 80);
    return () => clearInterval(t);
  }, [phase, crisis, lastResult]);

  useEffect(() => {
    if (phase !== "flight" || crisis !== null || lastResult !== null) return;
    const next = decisions.length;
    if (next < n && progress >= checkpoints[next]) setCrisis(next);
    else if (next >= n && progress >= 100 && !completing.current) { completing.current = true; completeM.mutate(); }
  }, [progress, phase, crisis, lastResult, decisions.length, n, checkpoints, completeM]);

  if (!catalog || !astro) return <div className="p-10 font-mono text-sm text-cyan-300/70" data-testid="launch-loading">Connecting to launch control…</div>;

  const stats = analysis?.stats;
  const notReady = analysis && !analysis.ready;

  // ---------------- SELECT
  if (phase === "select") {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-end gap-4 justify-between mb-6">
          <div>
            <p className="hud-label mb-1">Mission planning · Step 1</p>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">Choose your destination</h1>
            <p className="text-slate-400 mt-1 max-w-xl text-sm">Planetary data from the NASA NSSDCA fact sheets, imagery live from the NASA Image Library. The bar shows how much of the required delta-v your rocket provides.</p>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-cyan-500/20 bg-slate-900/60 p-3" data-testid="launch-rocket-summary">
            <div className="h-20 w-14 blueprint-grid rounded grid place-items-center overflow-hidden"><RocketGraphic stack={stack} parts={parts} scale={1.6} /></div>
            <div>
              <div className="text-white font-heading">{astro.blueprint.label}</div>
              <div className="font-mono text-[11px] text-slate-400">Δv {((stats?.delta_v_ms ?? 0) / 1000).toFixed(2)} km/s · TWR {(stats?.twr ?? 0).toFixed(2)}</div>
              <Link to="/builder" className="font-mono text-[11px] text-cyan-300 hover:underline" data-testid="modify-design-link">Modify design →</Link>
            </div>
          </div>
        </div>
        {notReady && (
          <div className="mb-5 rounded-xl border border-rose-400/40 bg-[#2a0e15] p-4 flex flex-wrap gap-3 items-center justify-between" data-testid="launch-not-ready">
            <span className="text-sm text-rose-100">Your rocket is NO-GO: {analysis.issues.find((i) => i.severity === "error")?.title ?? "design incomplete"}.</span>
            <Link to="/builder" className={buttonVariants({ variant: "outline", size: "sm" })}>Fix in builder</Link>
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
              <div className="hud-label">Target · {planet.name}</div>
              <p className="text-sm text-slate-300 mt-0.5">{planet.fact}</p>
            </div>
            <Button size="lg" disabled={!analysis?.ready || startM.isPending} onClick={() => startM.mutate()} className="font-mono uppercase tracking-[0.18em]" data-testid="launch-mission-btn">
              <Rocket className="size-4" /> {startM.isPending ? "Arming…" : `Launch to ${planet.name}`}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ---------------- REPORT
  if (phase === "report" && report) {
    const m = report.mission;
    const tone = m.status === "success" ? "text-emerald-300" : m.status === "partial" ? "text-amber-300" : "text-rose-300";
    const label = m.status === "success" ? "MISSION SUCCESS" : m.status === "partial" ? "PARTIAL SUCCESS" : "MISSION FAILED";
    const C = 2 * Math.PI * 70;
    return (
      <div className="px-4 lg:px-8 py-8 max-w-5xl mx-auto" data-testid="mission-report">
        <p className="hud-label mb-2">Post-flight report · {m.rocket_label} → {m.planet_name}</p>
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
                <div className="font-mono text-[10px] text-slate-400">MISSION SCORE</div>
              </div>
            </div>
          </div>
          <div>
            <h1 className={cn("font-heading text-4xl font-bold tracking-tight", tone)} data-testid="mission-status">{label}</h1>
            <p className="text-slate-400 mt-1 text-sm">{m.decisions.filter((d) => d.overcome).length}/{m.decisions.length} obstacles overcome · Δv readiness {Math.round(m.readiness * 100)}%{m.first_visit ? ` · First visit to ${m.planet_name}!` : ""}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {[["Mission", m.points.completion, "points-completion"], ["Obstacles", m.points.obstacles, "points-obstacles"], ["Exploration", m.points.exploration, "points-exploration"], ["Total", m.points.total, "points-total"]].map(([k, v, t]) => (
                <div key={t as string} className={cn("rounded-lg border p-3", t === "points-total" ? "border-amber-400/50 bg-amber-400/10" : "border-slate-800 bg-slate-900/60")} data-testid={t as string}>
                  <div className="hud-label text-[9px]">{k}</div>
                  <div className="font-mono text-2xl text-amber-200 tabular-nums">+{v}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <Button onClick={() => setPhase("select")} data-testid="fly-again-button"><Orbit className="size-4" /> New mission</Button>
              <Button variant="outline" onClick={() => nav("/builder")} data-testid="report-modify-rocket-button"><Wrench className="size-4" /> Modify rocket</Button>
              <Button variant="outline" onClick={() => nav("/hangar?tab=upgrades")} data-testid="report-upgrades-button"><Trophy className="size-4" /> Spend points</Button>
            </div>
          </div>
        </div>
        <div className="mt-8 space-y-2" data-testid="decision-log">
          <div className="hud-label">Decision log</div>
          {m.decisions.map((d, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <span className={cn("font-mono text-[10px] px-2 py-0.5 rounded border", RATING[d.rating].cls)}>{RATING[d.rating].label}</span>
              <span className="text-sm text-white">{m.obstacles[i]?.title}</span>
              <span className="text-xs text-slate-400 flex-1">{d.option_index >= 0 ? m.obstacles[i]?.options[d.option_index]?.label : "No decision"}</span>
              <span className="font-mono text-xs text-amber-300">+{d.points}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------- COUNTDOWN / FLIGHT
  const [rx, ry] = bez(progress / 100);
  const [ax, ay] = bez(Math.min(1, progress / 100 + 0.01));
  const angle = (Math.atan2(ay - ry, ax - rx) * 180) / Math.PI + 90;
  const shaking = phase === "countdown" ? count <= 1 : progress < 8;
  const altitude = Math.round(progress < 10 ? progress * 40 : 400 + (progress - 10) * (planet ? planet.distance_mkm * 1e4 : 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6 max-w-[1500px] mx-auto">
      <section className={cn("lg:col-span-8 relative rounded-xl border border-cyan-500/30 overflow-hidden starfield animate-star-drift min-h-[440px]", shaking && "animate-hud-shake")} data-testid="flight-viewport">
        <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-10">
          {[["MET", `T+${Math.round(progress * 2.4)}s`], ["Progress", `${Math.round(progress)}%`], ["Range", `${altitude.toLocaleString()} km`], ["Target", mission?.planet_name ?? ""]].map(([k, v]) => (
            <div key={k} className="rounded-md border border-cyan-500/25 bg-slate-950/70 backdrop-blur px-3 py-1.5">
              <div className="hud-label text-[9px]">{k}</div>
              <div className="font-mono text-sm text-white tabular-nums" data-testid={`flight-hud-${k.toLowerCase()}`}>{v}</div>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 700 400" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid meet">
          <path d={`M${P0[0]} ${P0[1]} Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} stroke="rgba(0,229,255,0.35)" strokeDasharray="4 6" fill="none" strokeWidth="1.5" />
          <circle cx={P0[0]} cy={P0[1] + 20} r="34" fill="url(#earth)" />
          <defs>
            <radialGradient id="earth"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#0c4a6e" /></radialGradient>
            <clipPath id="pclip"><circle cx={P2[0]} cy={P2[1]} r="38" /></clipPath>
          </defs>
          {checkpoints.map((c, i) => {
            const [x, y] = bez(c / 100);
            const done = i < decisions.length;
            return <circle key={i} cx={x} cy={y} r="5" fill={done ? (decisions[i].overcome ? "#34d399" : "#fb7185") : "#fbbf24"} stroke="#020617" strokeWidth="2" />;
          })}
        </svg>
        <div className="absolute overflow-hidden rounded-full" style={{ left: `${(P2[0] - 38) / 7}%`, top: `${(P2[1] - 38) / 4}%`, width: `${76 / 7}%`, aspectRatio: "1" }}>
          {planet && <PlanetImage q={planet.image_query} className="size-full" />}
        </div>
        {phase === "flight" && (
          <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-100 ease-linear" style={{ left: `${rx / 7}%`, top: `${ry / 4}%`, transform: `translate(-50%,-50%) rotate(${angle}deg)` }} data-testid="flight-rocket">
            <RocketGraphic stack={stack} parts={parts} scale={0.9} flame={crisis === null && lastResult === null} />
          </div>
        )}
        <AnimatePresence>
          {phase === "countdown" && (
            <motion.div key={count} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 grid place-items-center z-20" data-testid="launch-countdown">
              <div className="text-center">
                <div className="hud-label mb-2">T-minus</div>
                <div className="font-heading text-8xl font-bold text-white tabular-nums">{count > 0 ? count : "LIFTOFF"}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <aside className="lg:col-span-4 space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3" data-testid="systems-panel">
          <div className="hud-label">Vehicle systems · {mission?.rocket_label}</div>
          <Bar icon={Fuel} label="Propellant" v={telemetry.fuel} testid="telemetry-fuel" />
          <Bar icon={Shield} label="Hull integrity" v={telemetry.hull} testid="telemetry-hull" />
          <Bar icon={Zap} label="Power" v={telemetry.power} testid="telemetry-power" />
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Gauge className="size-3" />TWR {mission?.stats.twr}</span>
            <span>Δv {((mission?.stats.delta_v_ms ?? 0) / 1000).toFixed(1)}</span>
            <span>Ready {Math.round((mission?.readiness ?? 0) * 100)}%</span>
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
                <span className="font-mono text-[11px] tracking-[0.2em]">{RATING[lastResult.rating].label}</span>
                <span className="font-mono text-sm text-amber-200">+{lastResult.points} pts</span>
              </div>
              <p className="text-sm text-white mt-2">{lastResult.outcome}</p>
              <Button className="mt-3 w-full" onClick={() => setLastResult(null)} data-testid="continue-flight-button">
                <CheckCircle2 className="size-4" /> Continue flight
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {crisis === null && !lastResult && (
          <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4" data-testid="flight-status">
            <div className="hud-label mb-1">Flight director</div>
            <p className="text-sm text-slate-300">
              {phase === "countdown" ? "All stations GO for launch." : completeM.isPending ? "Filing mission report…" : `Coasting toward ${mission?.planet_name}. ${n - decisions.length} hazards remain on the trajectory.`}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
