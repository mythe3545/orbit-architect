import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Award, ArrowRight, BookOpen, CalendarClock, ChevronRight, CloudSun, Hammer, Lightbulb, Orbit, Palette, Rocket, Settings as Cog, Siren, Star, Warehouse } from "lucide-react";
import { TUTORIAL, TUT_LINKS, TUT_UI } from "@/lib/tutorial";
import { useSettings } from "@/lib/settings";
import { KIND_COLOR, KIND_ICON } from "@/components/SpaceWeatherPanel";
import type { WeatherKind } from "@/lib/types";

const ICONS: Record<string, typeof Rocket> = {
  start: BookOpen, build: Hammer, fleet: Warehouse, plan: Orbit, flight: Rocket, crises: Siren, weather: CloudSun,
  points: Star, shop: Palette, achievements: Award, weekly: CalendarClock, settings: Cog,
};
const WEATHER_STEP: WeatherKind[] = ["FLR", "SEP", "GST", "IPS", "CME"];

/** Small stack diagram for the builder chapter. */
function StackDiagram() {
  const rows = [
    { c: "#e2e8f0", w: "w-10", h: "h-5", clip: "polygon(28% 0,72% 0,100% 100%,0 100%)" },
    { c: "#cbd5e1", w: "w-12", h: "h-8", stripe: "#00e5ff" },
    { c: "#64748b", w: "w-8", h: "h-3", clip: "polygon(25% 0,75% 0,100% 100%,0 100%)" },
    { c: "#94a3b8", w: "w-16", h: "h-2", clip: "polygon(8% 0,92% 0,100% 100%,0 100%)" },
    { c: "#cbd5e1", w: "w-16", h: "h-16", stripe: "#ffb300" },
    { c: "#475569", w: "w-14", h: "h-4", clip: "polygon(10% 0,90% 0,100% 100%,0 100%)" },
  ];
  return (
    <div className="hidden sm:flex flex-col items-center rounded-lg blueprint-grid border border-cyan-500/20 px-6 py-4" aria-hidden>
      {rows.map((r, i) => (
        <div key={i} className={`relative ${r.w} ${r.h}`} style={{ background: r.c, clipPath: r.clip }}>
          {r.stripe && <span className="absolute left-0.5 top-0.5 bottom-0.5 w-[3px] rounded" style={{ background: r.stripe }} />}
        </div>
      ))}
    </div>
  );
}

export default function Tutorial() {
  const { lang } = useSettings();
  const ui = TUT_UI[lang];
  const sections = TUTORIAL[lang];
  const jump = (id: string) => document.getElementById(`tut-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1300px] mx-auto" data-testid="tutorial-page">
      <header className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#070b12]/75 backdrop-blur-md p-6 sm:p-8 hud-glow">
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <p className="hud-label mb-2">{ui.kicker}</p>
        <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-white" data-testid="tutorial-title">{ui.title}</h1>
        <p className="text-slate-300 mt-3 max-w-2xl">{ui.desc}</p>
        <ol className="mt-6 flex flex-wrap items-center gap-2" data-testid="tutorial-loop">
          {ui.loop.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100">
                <span className="font-mono text-[10px] text-cyan-300">{String(i + 1).padStart(2, "0")}</span>{s}
              </span>
              {i < ui.loop.length - 1 && <ChevronRight className="size-4 text-slate-600" />}
            </li>
          ))}
        </ol>
      </header>

      <div className="grid lg:grid-cols-[230px_1fr] gap-6 mt-6">
        <nav className="lg:sticky lg:top-20 self-start rounded-xl border border-slate-800 bg-[#070b12]/70 backdrop-blur-md p-3" data-testid="tutorial-toc">
          <div className="hud-label px-2 mb-2">{ui.toc}</div>
          <div className="flex flex-wrap lg:flex-col gap-1">
            {sections.map((s, i) => {
              const Icon = ICONS[s.id] ?? BookOpen;
              return (
                <button key={s.id} onClick={() => jump(s.id)} data-testid={`tutorial-toc-${s.id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-300 hover:bg-cyan-400/10 hover:text-white transition-colors duration-150">
                  <Icon className="size-3.5 text-cyan-300 shrink-0" />
                  <span className="font-mono text-[10px] text-slate-500">{String(i + 1).padStart(2, "0")}</span>
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="space-y-5 min-w-0">
          {sections.map((s, i) => {
            const Icon = ICONS[s.id] ?? BookOpen;
            return (
              <motion.section key={s.id} id={`tut-${s.id}`} data-testid={`tutorial-section-${s.id}`}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.4 }}
                className="scroll-mt-20 rounded-xl border border-slate-800 bg-[#070b12]/70 backdrop-blur-md p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="size-11 shrink-0 grid place-items-center rounded-lg border border-cyan-400/40 bg-cyan-400/10"><Icon className="size-5 text-cyan-300" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] text-slate-500">{String(i + 1).padStart(2, "0")} / {String(sections.length).padStart(2, "0")}</div>
                    <h2 className="font-heading text-xl sm:text-2xl text-white">{s.title}</h2>
                    <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{s.intro}</p>
                  </div>
                  {s.id === "build" && <StackDiagram />}
                </div>

                <ol className="mt-5 grid gap-2.5 md:grid-cols-2">
                  {s.steps.map((st, j) => {
                    const wk = s.id === "weather" ? WEATHER_STEP[j] : undefined;
                    const WIcon = wk ? KIND_ICON[wk] : null;
                    return (
                      <li key={st.t} className="relative flex gap-3 rounded-lg border border-slate-800/80 bg-white/[0.02] p-3" data-testid={`tutorial-step-${s.id}-${j}`}>
                        <span className="size-7 shrink-0 grid place-items-center rounded-full border font-mono text-[11px]"
                          style={wk ? { borderColor: KIND_COLOR[wk], color: KIND_COLOR[wk] } : undefined}>
                          {WIcon ? <WIcon className="size-3.5" /> : <span className="text-cyan-200">{j + 1}</span>}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white">{st.t}</div>
                          <div className="text-[13px] text-slate-400 mt-0.5 leading-relaxed">{st.d}</div>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {s.tip && (
                    <div className="flex-1 min-w-[240px] flex gap-2.5 rounded-lg border border-amber-400/30 bg-amber-400/[0.06] p-3" data-testid={`tutorial-tip-${s.id}`}>
                      <Lightbulb className="size-4 text-amber-300 shrink-0 mt-0.5" />
                      <div><div className="hud-label text-amber-300/90">{ui.tip}</div><p className="text-[13px] text-amber-50/90 mt-0.5">{s.tip}</p></div>
                    </div>
                  )}
                  {s.cta && (
                    <Link to={TUT_LINKS[s.id] ?? "/builder"} data-testid={`tutorial-cta-${s.id}`}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-cyan-400/15 border border-cyan-400/40 px-3.5 py-2 text-sm text-cyan-100 hover:bg-cyan-400/25 transition-colors duration-150">
                      {s.cta}<ArrowRight className="size-4" />
                    </Link>
                  )}
                </div>
              </motion.section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
