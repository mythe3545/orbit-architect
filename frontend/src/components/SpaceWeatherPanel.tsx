import { Sun, Atom, Magnet, Waves, CloudLightning, Radio, ExternalLink } from "lucide-react";
import { useSpaceWeather } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import type { WeatherKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const KINDS: WeatherKind[] = ["FLR", "SEP", "GST", "IPS", "CME"];
export const KIND_ICON: Record<WeatherKind, typeof Sun> = { FLR: Sun, SEP: Atom, GST: Magnet, IPS: Waves, CME: CloudLightning };
export const KIND_COLOR: Record<WeatherKind, string> = { FLR: "#facc15", SEP: "#f472b6", GST: "#34d399", IPS: "#60a5fa", CME: "#c084fc" };
const SEV_CLS = ["", "text-slate-300 border-slate-500/50", "text-amber-200 border-amber-400/50", "text-orange-200 border-orange-400/60", "text-rose-200 border-rose-400/70"];

function isActive(time: string) {
  return Date.now() - new Date(time).getTime() < 3 * 864e5;
}

export default function SpaceWeatherPanel({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const { data, isLoading } = useSpaceWeather();
  const srcCls = data?.source === "live" ? "border-emerald-400/50 text-emerald-300" : data?.source === "recent" ? "border-amber-400/50 text-amber-300" : "border-slate-500 text-slate-300";
  return (
    <section className="rounded-xl border border-cyan-500/20 bg-[#070b12]/70 backdrop-blur-xl p-4 hud-corners" data-testid="space-weather-panel">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Radio className="size-4 text-cyan-300" />
        <h2 className={cn("font-heading text-white", compact ? "text-sm" : "text-base sm:text-lg")}>{t("sw.title")}</h2>
        {data && (
          <span className={cn("ml-auto font-mono text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1.5", srcCls)} data-testid="space-weather-source">
            <span className={cn("size-1.5 rounded-full", data.source === "live" ? "bg-emerald-400 animate-pulse" : "bg-slate-400")} />
            {t(`sw.${data.source}`)}
          </span>
        )}
      </div>
      {isLoading && <p className="font-mono text-xs text-slate-500">…</p>}
      {data && (
        <>
          <div className={cn("grid gap-2", compact ? "grid-cols-5" : "grid-cols-2 md:grid-cols-5")}>
            {KINDS.map((k) => {
              const e = data.latest[k];
              const Icon = KIND_ICON[k];
              const active = e && !e.archive && isActive(e.time);
              return (
                <div key={k} data-testid={`space-weather-${k}`}
                  className={cn("rounded-lg border bg-black/30 transition-[border-color] duration-200", compact ? "p-1.5" : "p-2.5", active ? "border-rose-400/60" : "border-slate-800")}>
                  <div className="flex items-center gap-1.5">
                    <Icon className="size-3.5" style={{ color: KIND_COLOR[k] }} />
                    <span className="font-mono text-[10px] text-slate-400">{k}</span>
                    {e && !compact && <span className={cn("font-mono text-[8px] px-1 rounded", e.origin === "live" ? "bg-emerald-400/20 text-emerald-200" : e.origin === "recent" ? "bg-amber-400/15 text-amber-200" : "bg-slate-700/60 text-slate-300")} data-testid={`space-weather-origin-${k}`}>{t(`o.${e.origin}`)}</span>}
                    {active && <span className="ml-auto font-mono text-[9px] text-rose-300 animate-pulse" data-testid={`space-weather-active-${k}`}>●{compact ? "" : ` ${t("sw.active")}`}</span>}
                  </div>
                  {!compact && <div className="text-sm text-white mt-1 leading-tight">{t(`k.${k}`)}</div>}
                  {compact ? <div className="font-mono text-[10px] text-white mt-1 truncate" title={`${t(`k.${k}`)} · ${e?.value ?? ""}`}>{e?.value ?? "—"}</div> : e ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs text-white">{e.value}</span>
                      <span className={cn("font-mono text-[9px] px-1.5 rounded border", SEV_CLS[e.severity])}>{t(`sev.${e.severity}`)}</span>
                      <span className="font-mono text-[10px] text-slate-500 w-full">{e.time.slice(0, 16).replace("T", " ")}</span>
                      {!compact && <span className="font-mono text-[10px] text-cyan-300/70 w-full">→ {t(`m.${k}`)}</span>}
                    </div>
                  ) : <div className="font-mono text-[10px] text-slate-500 mt-1">—</div>}
                </div>
              );
            })}
          </div>
          {!compact && <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 font-mono text-[10px] text-slate-500">
            <span>{t("sw.src")}</span>
            <span>{t("sw.updated", { t: data.fetched_at.slice(11, 16) })}</span>
            {!compact && <span className="text-cyan-300/70">{t("sw.inFlight")}</span>}
            {data.source !== "live" && <span className="text-amber-300/80" data-testid="space-weather-archive-note">{t("sw.archiveNote")}</span>}
            <a href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-cyan-300/80 hover:text-cyan-200" data-testid="space-weather-donki-link">DONKI <ExternalLink className="size-3" /></a>
          </div>}
        </>
      )}
    </section>
  );
}
