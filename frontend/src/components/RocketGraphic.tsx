import type { Part, StackItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROP_COLOR: Record<string, string> = {
  "RP-1/LOX": "#ffb300",
  "LH2/LOX": "#00e5ff",
  "AZ50/N2O4": "#fb7185",
  "ETHANOL/LOX": "#a3e635",
  SOLID: "#cbd5e1",
};

export function propColor(p: string | null) {
  return p ? PROP_COLOR[p] ?? "#94a3b8" : "#475569";
}

/** Visual for one stack entry. scale = px per metre of diameter. */
export function PartShape({ part, qty, scale = 12, flame = false }: { part: Part; qty: number; scale?: number; flame?: boolean }) {
  const w = Math.max(14, part.diameter_m * scale);
  const k = scale / 12;
  switch (part.category) {
    case "crew": {
      const h = Math.max(16, (14 + Math.sqrt(part.mass_t) * 4) * k);
      const narrow = part.id === "apollo_les";
      return (
        <div
          style={{ width: narrow ? 8 * k + 4 : w, height: narrow ? h * 1.6 : h, clipPath: narrow ? undefined : "polygon(28% 0, 72% 0, 100% 100%, 0 100%)" }}
          className={cn("bg-gradient-to-b from-white to-slate-300", narrow && "rounded-t-full from-slate-200 to-slate-500")}
        />
      );
    }
    case "upper":
    case "lower": {
      const h = Math.max(22, Math.min(230, Math.sqrt(part.mass_t) * 4 * k));
      return (
        <div style={{ width: w, height: h }} className="relative bg-gradient-to-r from-slate-300 via-white to-slate-300 border border-cyan-400/40">
          <div className="absolute inset-x-0 top-1/4 h-[3px] bg-slate-900/70" />
          <div className="absolute left-1 top-1 bottom-1 w-[3px] rounded" style={{ background: propColor(part.propellant) }} />
        </div>
      );
    }
    case "interstage":
      return <div style={{ width: w, height: Math.max(8, 12 * k), clipPath: "polygon(4% 0, 96% 0, 100% 100%, 0 100%)" }} className="bg-slate-400" />;
    case "engine": {
      const nw = Math.max(8, Math.min(part.diameter_m * scale, 130 * k / qty + 6));
      const nh = Math.max(10, (10 + part.diameter_m * 5) * k);
      return (
        <div className="flex items-start justify-center gap-[2px]">
          {Array.from({ length: qty }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div style={{ width: nw, height: nh, clipPath: "polygon(30% 0, 70% 0, 100% 100%, 0 100%)" }} className="bg-gradient-to-b from-slate-500 to-slate-800" />
              {flame && (
                <div style={{ width: nw * 0.8, height: nh * 2.2 }} className="origin-top animate-flame rounded-b-full bg-gradient-to-b from-amber-200 via-orange-400 to-transparent" />
              )}
            </div>
          ))}
        </div>
      );
    }
    case "booster": {
      const h = Math.max(30, Math.min(220, Math.sqrt(part.mass_t) * 5 * k));
      return (
        <div className="flex items-end justify-center gap-1">
          {Array.from({ length: qty }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div style={{ width: w, height: h }} className="rounded-t-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 border border-amber-300/30" />
              {flame && <div style={{ width: w * 0.8, height: 30 * k }} className="origin-top animate-flame rounded-b-full bg-gradient-to-b from-amber-100 via-orange-400 to-transparent" />}
            </div>
          ))}
        </div>
      );
    }
    default: {
      if (part.id === "fairing_5m") {
        return <div style={{ width: w, height: 40 * k, clipPath: "polygon(35% 0, 65% 0, 100% 60%, 100% 100%, 0 100%, 0 60%)" }} className="bg-gradient-to-b from-white to-slate-300" />;
      }
      return (
        <div style={{ width: w + 26 * k, height: 18 * k }} className="relative">
          <div className="absolute left-0 bottom-0 h-full w-[22%] bg-slate-500" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
          <div className="absolute right-0 bottom-0 h-full w-[22%] bg-slate-500" style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }} />
        </div>
      );
    }
  }
}

/** Static full-rocket render (hangar cards, launch viewport). */
export function RocketGraphic({ stack, parts, scale = 6, flame = false, className }: {
  stack: StackItem[]; parts: Record<string, Part>; scale?: number; flame?: boolean; className?: string;
}) {
  const core = stack.filter((s) => parts[s.part_id]?.category !== "booster");
  const boosters = stack.filter((s) => parts[s.part_id]?.category === "booster");
  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {core.map((s, i) => {
        const p = parts[s.part_id];
        if (!p) return null;
        const isBottomEngine = p.category === "engine" && i === core.map((c) => parts[c.part_id]?.category).lastIndexOf("engine");
        return <PartShape key={i} part={p} qty={s.qty} scale={scale} flame={flame && isBottomEngine} />;
      })}
      {boosters.length > 0 && (
        <div className="absolute bottom-0 inset-x-0 flex justify-between pointer-events-none" style={{ transform: `translateX(0)` }}>
          {boosters.map((b, i) => {
            const p = parts[b.part_id];
            if (!p) return null;
            const half = Math.ceil(b.qty / 2);
            return (
              <div key={i} className="contents">
                <div className="-ml-3"><PartShape part={p} qty={half} scale={scale} flame={flame} /></div>
                <div className="-mr-3"><PartShape part={p} qty={b.qty - half} scale={scale} flame={flame} /></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
