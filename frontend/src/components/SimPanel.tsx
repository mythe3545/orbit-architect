import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FlaskConical, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { WeatherKind } from "@/lib/types";
import { KINDS, KIND_COLOR, KIND_ICON } from "@/components/SpaceWeatherPanel";
import { cn } from "@/lib/utils";

let persistedOpen = false;

/** Hidden manual trigger panel (Shift+S or the faint SIM button). */
export default function SimPanel({ inFlight, queued, onTrigger, onClear, disabled }: {
  inFlight: boolean; queued: WeatherKind[]; onTrigger: (k: WeatherKind) => void; onClear: () => void; disabled?: boolean;
}) {
  const t = useT();
  const [open, setOpenState] = useState(persistedOpen);
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenState((o) => { persistedOpen = typeof v === "function" ? v(o) : v; return persistedOpen; });
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.shiftKey && (e.key === "S" || e.key === "s")) setOpen((o) => !o); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <div className="fixed left-4 bottom-12 z-50 flex flex-col items-start gap-2 pointer-events-none [&>*]:pointer-events-auto">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
            className="w-[280px] rounded-xl border border-fuchsia-400/40 bg-[#0b0614]/90 backdrop-blur-xl p-3 shadow-[0_0_30px_rgba(217,70,239,0.2)]" data-testid="sim-panel">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fuchsia-300">{t("sim.title")}</span>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white" data-testid="sim-panel-close" aria-label="Close"><X className="size-3.5" /></button>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">{inFlight ? t("sim.mid") : t("sim.pre")}</p>
            <div className="grid grid-cols-5 gap-1.5">
              {KINDS.map((k) => {
                const Icon = KIND_ICON[k];
                return (
                  <button key={k} disabled={disabled} onClick={() => onTrigger(k)} data-testid={`sim-trigger-${k}`} title={t(`k.${k}`)}
                    className={cn("flex flex-col items-center gap-1 rounded-lg border py-2 transition-[transform,background-color] duration-150 hover:-translate-y-0.5 disabled:opacity-40",
                      queued.includes(k) ? "border-fuchsia-300 bg-fuchsia-400/15" : "border-slate-700 hover:bg-white/5")}>
                    <Icon className="size-4" style={{ color: KIND_COLOR[k] }} />
                    <span className="font-mono text-[10px] text-white">{k}</span>
                  </button>
                );
              })}
            </div>
            {!inFlight && queued.length > 0 && (
              <div className="flex items-center justify-between mt-2 font-mono text-[10px]">
                <span className="text-fuchsia-200" data-testid="sim-queued">{t("sim.queued", { x: queued.join(", ") })}</span>
                <button onClick={onClear} className="text-slate-400 hover:text-white" data-testid="sim-clear">{t("sim.clear")}</button>
              </div>
            )}
            <p className="font-mono text-[9px] text-slate-500 mt-2">{t("sim.hint")}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen((o) => !o)} data-testid="sim-panel-toggle" aria-label="Simulation"
        className="flex items-center gap-1 rounded-full border border-slate-700/60 bg-black/40 px-2 py-1 font-mono text-[9px] text-slate-500 opacity-40 hover:opacity-100 transition-opacity duration-200">
        <FlaskConical className="size-3" /> SIM
      </button>
    </div>
  );
}
