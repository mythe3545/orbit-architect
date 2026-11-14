import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Rocket, Wrench, Star, Trophy, Orbit, ShieldAlert, ArrowUpCircle } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { useAnalysis, useAstronaut, useAstronautId, useCatalog, useNasaImages, useSaveBlueprint } from "@/lib/hooks";
import type { Astronaut, FleetRocket, Part, Upgrade } from "@/lib/types";
import { RocketGraphic } from "@/components/RocketGraphic";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

function FleetCard({ r, parts, onFly, onModify }: { r: FleetRocket; parts: Record<string, Part>; onFly: () => void; onModify: () => void }) {
  const t = useT();
  const id = useAstronautId();
  const { data: img } = useNasaImages(r.image_query, 1);
  const { data: a } = useAnalysis(r.stack, id);
  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-cyan-400/60 hover:-translate-y-0.5 transition-[transform,border-color] duration-200" data-testid={`fleet-card-${r.id}`}>
      <div className="relative h-44 overflow-hidden">
        {img?.[0] ? <img src={img[0].url} alt={r.name} className="absolute inset-0 size-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" /> : <div className="absolute inset-0 blueprint-grid" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute right-3 bottom-2 h-36 w-16 grid place-items-end"><RocketGraphic stack={r.stack} parts={parts} scale={1.4} /></div>
        <div className="absolute left-4 bottom-3">
          <div className="hud-label text-[9px]">{r.era} · {r.flights} {t("flights")}</div>
          <div className="font-heading text-2xl font-bold text-white">{r.name}</div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-slate-400 min-h-[40px]">{r.summary}</p>
        <div className="grid grid-cols-4 gap-2 mt-3 font-mono text-[11px]">
          {[[t("height"), `${r.height_m}m`], [t("mass"), `${Math.round(a?.stats.total_mass_t ?? 0)}t`], ["TWR", (a?.stats.twr ?? 0).toFixed(2)], ["Δv", `${((a?.stats.delta_v_ms ?? 0) / 1000).toFixed(1)}`]].map(([k, v]) => (
            <div key={k} className="rounded border border-slate-800 bg-[#050914] px-2 py-1.5"><div className="text-[9px] text-slate-500 uppercase">{k}</div><div className="text-white tabular-nums">{v}</div></div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button className="flex-1" onClick={onFly} data-testid={`hangar-fly-${r.id}`}><Rocket className="size-4" /> {t("fly")}</Button>
          <Button variant="outline" onClick={onModify} data-testid={`hangar-modify-${r.id}`}><Wrench className="size-4" /> {t("mod")}</Button>
        </div>
      </div>
    </div>
  );
}

function UpgradeRow({ u, astro }: { u: Upgrade; astro: Astronaut }) {
  const t = useT();
  const qc = useQueryClient();
  const level = astro.upgrades[u.id] ?? 0;
  const maxed = level >= u.max_level;
  const cost = u.base_cost * (level + 1);
  const m = useMutation({
    mutationFn: () => apiPost<Astronaut>(`/astronauts/${astro.id}/upgrades/${u.id}`),
    onSuccess: (a) => { qc.setQueryData(["astronaut", a.id], a); qc.invalidateQueries({ queryKey: ["analyze"] }); toast.success(t("upgraded", { name: u.name, l: level + 1 })); },
    onError: (e) => toast.error(e instanceof ApiError ? String((e.body as { detail?: string })?.detail) : t("upFail")),
  });
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4" data-testid={`upgrade-row-${u.id}`}>
      <div className="flex-1 min-w-[200px]">
        <div className="text-white font-heading">{u.name}</div>
        <div className="text-sm text-slate-400">{u.description}</div>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: u.max_level }).map((_, i) => <div key={i} className={cn("h-1.5 w-8 rounded", i < level ? "bg-cyan-300" : "bg-slate-800")} />)}
          <span className="font-mono text-[10px] text-slate-400 ml-2" data-testid={`upgrade-level-${u.id}`}>LV {level}/{u.max_level}</span>
        </div>
      </div>
      <Button disabled={maxed || astro.points < cost || m.isPending} onClick={() => m.mutate()} variant={maxed ? "outline" : "default"} data-testid={`upgrade-buy-${u.id}`} className="font-mono">
        {maxed ? t("maxed") : <><ArrowUpCircle className="size-4" /> {cost} pts</>}
      </Button>
    </div>
  );
}

export default function Hangar() {
  const t = useT();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data: catalog } = useCatalog();
  const { data: astro } = useAstronaut();
  const { save } = useSaveBlueprint();
  const parts = useMemo(() => Object.fromEntries((catalog?.parts ?? []).map((p) => [p.id, p])), [catalog]);
  const tab = params.get("tab") ?? "fleet";

  const pick = async (r: FleetRocket, to: string) => {
    try {
      await save({ label: r.name, stack: r.stack });
      nav(to);
    } catch {
      toast.error(t("loadFail"));
    }
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end mb-6">
        <div>
          <p className="hud-label mb-1">{t("hangar.kicker")}</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">{t("hangar.title")}</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">{t("hangar.desc")}</p>
        </div>
        <div className="grid grid-cols-3 gap-2" data-testid="points-ways">
          {[[Trophy, t("ways.complete")], [ShieldAlert, t("ways.obstacles")], [Orbit, t("ways.explore")]].map(([Icon, t]) => {
            const I = Icon as typeof Trophy;
            return <div key={t as string} className="rounded-lg border border-amber-400/25 bg-amber-400/5 px-3 py-2 text-center"><I className="size-4 mx-auto text-amber-300" /><div className="font-mono text-[10px] text-amber-100 mt-1">{t as string}</div></div>;
          })}
        </div>
      </div>
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: String(v) })}>
        <TabsList className="mb-5">
          <TabsTrigger value="fleet" data-testid="hangar-tab-fleet">{t("tab.fleet")}</TabsTrigger>
          <TabsTrigger value="upgrades" data-testid="hangar-tab-upgrades">{t("tab.upgrades")}</TabsTrigger>
        </TabsList>
        <TabsContent value="fleet">
          {!catalog ? <p className="font-mono text-sm text-slate-500">{t("loadingFleet")}</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {catalog.rockets.map((r) => <FleetCard key={r.id} r={r} parts={parts} onFly={() => pick(r, "/launch")} onModify={() => pick(r, "/builder")} />)}
            </div>
          )}
        </TabsContent>
        <TabsContent value="upgrades">
          <div className="flex items-center gap-3 mb-4 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4" data-testid="upgrade-balance">
            <Star className="size-5 text-amber-300" />
            <div><div className="hud-label text-amber-300/80">{t("available")}</div><div className="font-mono text-2xl text-amber-200 tabular-nums">{astro?.points ?? 0}</div></div>
            <div className="ml-auto font-mono text-[11px] text-slate-400">{t("lifetime", { n: astro?.total_points_earned ?? 0 })}</div>
          </div>
          <div className="space-y-3">
            {astro && catalog?.upgrades.map((u) => <UpgradeRow key={u.id} u={u} astro={astro} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
