import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { useAstronaut, useAstronautId, useCatalog } from "@/lib/hooks";
import type { Mission } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const STATUS_CLS: Record<string, string> = {
  success: "text-emerald-300 border-emerald-400/40",
  partial: "text-amber-300 border-amber-400/40",
  fail: "text-rose-300 border-rose-400/40",
  in_flight: "text-slate-400 border-slate-600",
};

export default function Dossier() {
  const t = useT();
  const id = useAstronautId();
  const { data: astro } = useAstronaut();
  const { data: catalog } = useCatalog();
  const { data: missions, isError } = useQuery({
    queryKey: ["missions", id],
    queryFn: () => apiGet<Mission[]>(`/astronauts/${id}/missions`),
    enabled: !!id,
  });
  const done = (missions ?? []).filter((m) => m.status !== "in_flight");

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1300px] mx-auto">
      <p className="hud-label mb-1">{t("dossier.kicker")}</p>
      <div className="grid lg:grid-cols-[360px_1fr] gap-6 mt-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-cyan-500/25 bg-slate-900/70 p-5 hud-corners hud-glow" data-testid="dossier-profile">
            <div className="font-heading text-3xl font-bold text-white tracking-tight" data-testid="dossier-callsign">{astro?.callsign ?? "—"}</div>
            <div className="text-slate-300">{astro?.full_name}</div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4 font-mono text-xs">
              <span className="text-slate-500">{t("agency")}</span><span className="text-white">{astro?.agency_id}</span>
              <span className="text-slate-500">{t("spec")}</span><span className="text-white">{astro ? t(`spec.${astro.specialization}`) : ""}</span>
              <span className="text-slate-500">{t("nat")}</span><span className="text-white">{astro?.nationality || "—"}</span>
              <span className="text-slate-500">{t("flown")}</span><span className="text-white" data-testid="dossier-missions-flown">{astro?.missions_flown ?? 0}</span>
              <span className="text-slate-500">{t("points")}</span><span className="text-amber-200" data-testid="dossier-points">{astro?.points ?? 0}</span>
              <span className="text-slate-500">{t("lifetimeShort")}</span><span className="text-amber-200">{astro?.total_points_earned ?? 0}</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5" data-testid="dossier-explored">
            <div className="hud-label mb-3">{t("exploredBodies", { a: astro?.explored.length ?? 0, b: catalog?.planets.length ?? 0 })}</div>
            <div className="flex flex-wrap gap-2">
              {catalog?.planets.map((p) => {
                const on = astro?.explored.includes(p.id);
                return <span key={p.id} data-testid={`explored-${p.id}`} className={cn("px-3 py-1 rounded-full border font-mono text-[11px]", on ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" : "border-slate-700 text-slate-500")}>{p.name}</span>;
              })}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 min-w-0" data-testid="mission-log">
          <div className="flex items-center justify-between mb-3">
            <span className="hud-label">{t("log")}</span>
            <Link to="/launch" className={buttonVariants({ size: "sm" })} data-testid="dossier-new-mission">{t("newMission")}</Link>
          </div>
          {isError ? <p className="text-sm text-slate-500">{t("logNA")}</p> : done.length === 0 ? (
            <p className="text-sm text-slate-400" data-testid="mission-log-empty">{t("logEmpty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>{t("th.date")}</TableHead><TableHead>{t("th.rocket")}</TableHead><TableHead>{t("th.dest")}</TableHead><TableHead>{t("th.result")}</TableHead><TableHead className="text-right">{t("th.points")}</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {done.map((m) => (
                  <TableRow key={m.id} data-testid={`mission-row-${m.id}`}>
                    <TableCell className="font-mono text-xs">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{m.rocket_label}</TableCell>
                    <TableCell>{m.planet_name}</TableCell>
                    <TableCell><span className={cn("font-mono text-[11px] px-2 py-0.5 rounded border", STATUS_CLS[m.status])}>{t(`s.${m.status}`)} · {m.success_pct}%</span></TableCell>
                    <TableCell className="text-right font-mono text-amber-200">+{m.points.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
