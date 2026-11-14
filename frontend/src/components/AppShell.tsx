import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Hammer, Rocket, Warehouse, IdCard, LogOut, Star, Settings as Cog, Award, BookOpen } from "lucide-react";
import { titleFor } from "@/lib/achievements";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { setAstronautId, useAstronaut, useAstronautId } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import ApodBackground, { ApodCredit } from "@/components/ApodBackground";

const NAV = [
  { to: "/builder", label: "nav.builder", icon: Hammer },
  { to: "/launch", label: "nav.launch", icon: Rocket },
  { to: "/hangar", label: "nav.hangar", icon: Warehouse },
  { to: "/dossier", label: "nav.dossier", icon: IdCard },
  { to: "/achievements", label: "nav.ach", icon: Award },
  { to: "/tutorial", label: "nav.guide", icon: BookOpen },
  { to: "/settings", label: "nav.settings", icon: Cog },
];

export default function AppShell() {
  const t = useT();
  const { lang } = useSettings();
  const id = useAstronautId();
  const { data: astro } = useAstronaut();
  const qc = useQueryClient();
  const nav = useNavigate();
  if (!id) return <Navigate to="/" replace />;

  const logout = () => {
    setAstronautId(null);
    qc.clear();
    nav("/");
  };

  return (
    <div className="relative isolate min-h-dvh flex flex-col">
      <ApodBackground />
      <header className="sticky top-0 z-40 border-b border-cyan-500/15 bg-[#070b12]/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 lg:px-6 h-14">
          <div className="flex items-center gap-2 shrink-0" data-testid="app-logo">
            <div className="size-7 rounded-sm border border-cyan-400/60 grid place-items-center hud-glow">
              <Rocket className="size-4 text-cyan-300" />
            </div>
            <span className="font-heading font-bold tracking-tight text-white hidden sm:block">ORBITAL<span className="text-cyan-300">FORGE</span></span>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 ml-2">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                data-testid={`nav-${to.slice(1)}`}
                title={t(label)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 px-3 h-9 rounded-md text-sm whitespace-nowrap transition-colors duration-200",
                    isActive ? "bg-cyan-400/10 text-cyan-200 border border-cyan-400/40" : "text-slate-400 hover:text-white border border-transparent",
                  )
                }
              >
                <Icon className="size-4" />
                <span className="hidden xl:inline">{t(label)}</span>
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 h-8" data-testid="hud-points">
              <Star className="size-3.5 text-amber-300" />
              <span className="font-mono text-sm text-amber-200 tabular-nums">{astro?.points ?? 0}</span>
              <span className="font-mono text-[10px] text-amber-300/70 hidden sm:inline uppercase">{t("ptsUnit")}</span>
            </div>
            <div className="hidden lg:flex flex-col leading-tight text-right" data-testid="hud-callsign">
              <span className="hud-label">{t("callsign")}</span>
              <span className="font-mono text-sm text-white">{astro?.callsign ?? "···"} <span className="text-amber-300/90 text-[11px]" data-testid="hud-title">· {titleFor(astro?.achievements.length ?? 0).cur.tx[lang]}</span></span>
            </div>
            <button
              onClick={logout}
              data-testid="logout-button"
              className="size-9 grid place-items-center rounded-md border border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-400/50 transition-colors duration-200"
              aria-label={t("logout")}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
      <footer className="border-t border-cyan-500/10 px-4 lg:px-6 h-8 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
        <span className="flex gap-3 min-w-0"><span className="hidden md:inline shrink-0">{t("footer.data")}</span><ApodCredit /></span>
        <span className="hidden sm:inline" data-testid="hud-status">{t("footer.link")} · {astro ? t(`spec.${astro.specialization}`) : ""} · {lang.toUpperCase()}</span>
      </footer>
    </div>
  );
}
