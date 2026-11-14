import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Lock, ShoppingCart, Star } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { useAstronaut, useCatalog } from "@/lib/hooks";
import { FLAMES, KIND_META, TRAILS, UI_THEMES, keyOf, type Kind } from "@/lib/cosmetics";
import { THEMES, updateSettings, useSettings, type RocketColor } from "@/lib/settings";
import type { Astronaut, Cosmetic } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { sfx } from "@/lib/sound";
import { cn } from "@/lib/utils";

function Preview({ kind, k }: { kind: Kind; k: string }) {
  if (kind === "paint") {
    const th = THEMES[k as RocketColor] ?? THEMES.classic;
    const body = (th.pattern === "checker" ? "repeating-conic-gradient(#111827 0 25%, transparent 0 50%) 0 0 / 16px 16px, " : "") + `linear-gradient(to right, ${th.body[0]}, ${th.body[1]}, ${th.body[2]})`;
    return (
      <div className="flex flex-col items-center">
        <div className="w-4 h-4" style={{ background: `linear-gradient(${th.capsule[0]}, ${th.capsule[1]})`, clipPath: "polygon(30% 0,70% 0,100% 100%,0 100%)" }} />
        <div className="w-6 h-14 relative" style={{ background: body }}><div className="absolute inset-x-0 top-3 h-1" style={{ background: th.band }} /></div>
        <div className="w-4 h-2.5" style={{ background: th.nozzle[1], clipPath: "polygon(25% 0,75% 0,100% 100%,0 100%)" }} />
      </div>
    );
  }
  if (kind === "flame") {
    const f = FLAMES[k] ?? FLAMES.kerosene;
    return (
      <div className="flex flex-col items-center">
        <div className="w-5 h-3 bg-slate-500" style={{ clipPath: "polygon(25% 0,75% 0,100% 100%,0 100%)" }} />
        <div className="w-4 h-14 origin-top animate-flame rounded-b-full" style={{ background: `linear-gradient(rgb(${f.core}), rgb(${f.mid}) 30%, rgba(${f.outer},0.85) 60%, transparent)`, boxShadow: `0 0 18px rgba(${f.glow},0.55)` }} />
      </div>
    );
  }
  if (kind === "trail") {
    const c = TRAILS[k]?.color ?? "100,116,139";
    const bg = k === "rainbow" ? "linear-gradient(90deg,#f472b6,#facc15,#34d399,#38bdf8,#a78bfa)" : k === "none" ? "repeating-linear-gradient(90deg,#334155 0 4px,transparent 4px 8px)" : `linear-gradient(90deg, transparent, rgba(${c},0.95))`;
    return (
      <div className="relative w-20 h-14 grid place-items-center">
        <div className={cn("absolute left-0 right-4 h-1.5 rounded-full", k === "stardust" && "h-0.5")} style={{ background: bg, boxShadow: k === "none" ? undefined : `0 0 12px rgba(${c},0.6)` }} />
        {(k === "sparks" || k === "stardust") && [0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="absolute size-1 rounded-full animate-pulse" style={{ left: `${12 + i * 12}%`, top: `${35 + ((i * 37) % 30)}%`, background: `rgb(${c})`, animationDelay: `${i * 0.2}s` }} />
        ))}
        <div className="absolute right-0 size-3 rotate-90 bg-slate-200" style={{ clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
      </div>
    );
  }
  const u = UI_THEMES[k] ?? UI_THEMES.mission;
  return (
    <div className="w-24 h-14 rounded-md border overflow-hidden" style={{ borderColor: `${u.accent}66`, background: u.swatch[2] }}>
      <div className="h-3 flex items-center gap-1 px-1.5" style={{ background: `${u.accent}22` }}>
        <span className="size-1.5 rounded-full" style={{ background: u.accent }} /><span className="h-1 w-6 rounded" style={{ background: u.accent }} /><span className="h-1 w-4 rounded bg-slate-600" />
      </div>
      <div className="p-1.5 space-y-1">
        <div className="h-1.5 w-14 rounded" style={{ background: u.swatch[0] }} />
        <div className="h-1.5 w-10 rounded" style={{ background: u.swatch[1] }} />
        <div className="h-3 w-12 rounded-sm mt-1" style={{ background: u.accent }} />
      </div>
    </div>
  );
}

export function cosmeticName(kind: Kind, k: string, lang: "en" | "tr" | "de", t: (key: string) => string) {
  if (kind === "paint") return t(`c.${k}`);
  if (kind === "flame") return FLAMES[k]?.names[lang] ?? k;
  if (kind === "trail") return TRAILS[k]?.names[lang] ?? k;
  return UI_THEMES[k]?.names[lang] ?? k;
}

export default function CosmeticGrid({ kind, mode }: { kind: Kind; mode: "shop" | "settings" }) {
  const t = useT();
  const s = useSettings();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: catalog } = useCatalog();
  const { data: astro } = useAstronaut();
  const items = (catalog?.cosmetics ?? []).filter((c) => c.kind === kind);
  const setting = KIND_META[kind].setting;
  const equip = (k: string) => { updateSettings({ [setting]: k } as Partial<typeof s>); sfx.click(); };

  const buy = useMutation({
    mutationFn: (c: Cosmetic) => apiPost<Astronaut>(`/astronauts/${astro!.id}/cosmetics/${c.id}`),
    onSuccess: (a, c) => {
      qc.setQueryData(["astronaut", a.id], a);
      const k = keyOf(c.id, kind);
      updateSettings({ [setting]: k } as Partial<typeof s>);
      sfx.success();
      toast.success(t("shop.bought", { name: cosmeticName(kind, k, s.lang, t) }));
    },
    onError: (e) => toast.error(e instanceof ApiError ? String((e.body as { detail?: string })?.detail) : t("upFail")),
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" data-testid={`cosmetics-${kind}-${mode}`}>
      {items.map((c) => {
        const k = keyOf(c.id, kind);
        const owned = c.price === 0 || !!astro?.owned_cosmetics.includes(c.id);
        const on = s[setting] === k;
        const short = (astro?.points ?? 0) < c.price;
        const name = cosmeticName(kind, k, s.lang, t);
        return (
          <div key={c.id} data-testid={`cosmetic-${c.id}`}
            className={cn("group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center backdrop-blur-md transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5",
              on ? "border-cyan-300 bg-cyan-300/10 hud-glow" : owned ? "border-slate-700 bg-[#070b12]/60 hover:border-slate-500" : "border-slate-800 bg-[#070b12]/50")}>
            {!owned && <Lock className="absolute top-2 right-2 size-3.5 text-slate-500" />}
            {on && <Check className="absolute top-2 right-2 size-4 text-cyan-300" />}
            <div className={cn("h-20 grid place-items-center", !owned && "opacity-70")}><Preview kind={kind} k={k} /></div>
            <div className="text-sm text-white leading-tight min-h-[2.5em]">{name}</div>
            {owned ? (
              <button onClick={() => equip(k)} disabled={on} data-testid={`cosmetic-equip-${c.id}`}
                className={cn("w-full rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-150",
                  on ? "bg-cyan-300/15 text-cyan-200 cursor-default" : "border border-cyan-500/40 text-cyan-200 hover:bg-cyan-400/10")}>
                {on ? t("shop.equipped") : t("shop.equip")}
              </button>
            ) : mode === "shop" ? (
              <button onClick={() => buy.mutate(c)} disabled={short || buy.isPending} data-testid={`cosmetic-buy-${c.id}`}
                className="w-full flex items-center justify-center gap-1.5 rounded-md bg-amber-400/90 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 transition-colors duration-150">
                <ShoppingCart className="size-3.5" />{c.price} {t("ptsUnit")}
              </button>
            ) : (
              <button onClick={() => nav("/hangar?tab=shop")} data-testid={`cosmetic-locked-${c.id}`}
                className="w-full flex items-center justify-center gap-1.5 rounded-md border border-amber-400/40 px-2 py-1.5 text-xs text-amber-200 hover:bg-amber-400/10 transition-colors duration-150">
                <Star className="size-3" />{c.price} · {t("shop.locked")}
              </button>
            )}
            {!owned && mode === "shop" && short && <div className="font-mono text-[10px] text-slate-500 -mt-1">{t("shop.need", { n: c.price - (astro?.points ?? 0) })}</div>}
          </div>
        );
      })}
    </div>
  );
}
