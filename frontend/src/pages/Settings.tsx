import { Volume2, Languages, Gauge, Palette, Clapperboard, LayoutTemplate, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import CosmeticGrid from "@/components/CosmeticGrid";
import { useT, LANG_LABELS } from "@/lib/i18n";
import { updateSettings, useSettings, type Difficulty, type Lang } from "@/lib/settings";
import { sfx } from "@/lib/sound";
import { cn } from "@/lib/utils";

function Card({ icon: Icon, title, children, testid }: { icon: typeof Volume2; title: string; children: React.ReactNode; testid: string }) {
  return (
    <section className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-5" data-testid={testid}>
      <div className="flex items-center gap-2 mb-4"><Icon className="size-4 text-cyan-300" /><h2 className="font-heading text-lg text-white">{title}</h2></div>
      {children}
    </section>
  );
}

function Seg<T extends string | number>({ value, options, onChange, testid }: { value: T; options: { v: T; label: string; desc?: string }[]; onChange: (v: T) => void; testid: string }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button key={String(o.v)} onClick={() => { onChange(o.v); sfx.click(); }} data-testid={`${testid}-${o.v}`}
          className={cn("rounded-lg border px-3 py-2.5 text-left transition-[border-color,background-color] duration-150",
            value === o.v ? "border-cyan-300 bg-cyan-300/10 text-white" : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-500")}>
          <div className="text-sm">{o.label}</div>
          {o.desc && <div className="font-mono text-[10px] text-slate-400 mt-0.5">{o.desc}</div>}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const t = useT();
  const s = useSettings();
  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <p className="hud-label mb-1">{t("set.kicker")}</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">{t("set.title")}</h1>
      <p className="text-sm text-slate-400 mt-1 mb-6">{t("set.note")}</p>
      <div className="grid gap-4">
        <Card icon={LayoutTemplate} title={t("set.menu")} testid="settings-menu-colors">
          <p className="text-sm text-slate-400 mb-3">{t("set.menuDesc")} <Link to="/hangar?tab=shop" className="text-cyan-300 hover:underline" data-testid="settings-open-shop">{t("shop.open")}</Link></p>
          <CosmeticGrid kind="theme" mode="settings" />
        </Card>
        <Card icon={Volume2} title={t("set.sound")} testid="settings-sound">
          <p className="text-sm text-slate-400 mb-3">{t("set.soundDesc")}</p>
          <Seg testid="settings-sound-toggle" value={s.sound ? "on" : "off"} onChange={(v) => updateSettings({ sound: v === "on" })}
            options={[{ v: "on", label: t("on") }, { v: "off", label: t("off") }]} />
          <div className="flex items-center gap-4 mt-4">
            <span className="hud-label w-24">{t("set.volume")}</span>
            <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
              className="flex-1 accent-cyan-300" data-testid="settings-volume-slider" disabled={!s.sound} />
            <span className="font-mono text-xs w-10 text-right">{Math.round(s.volume * 100)}%</span>
            <button onClick={() => { sfx.boom(); setTimeout(() => sfx.success(), 700); }} data-testid="settings-test-sound"
              className="rounded-md border border-cyan-500/40 px-3 py-1.5 font-mono text-xs text-cyan-200 hover:bg-cyan-400/10 transition-colors duration-150">{t("set.test")}</button>
          </div>
        </Card>
        <Card icon={Languages} title={t("set.lang")} testid="settings-language">
          <Seg testid="settings-lang" value={s.lang} onChange={(v) => updateSettings({ lang: v as Lang })}
            options={(Object.keys(LANG_LABELS) as Lang[]).map((l) => ({ v: l, label: LANG_LABELS[l] }))} />
        </Card>
        <Card icon={Gauge} title={t("set.diff")} testid="settings-difficulty">
          <Seg testid="settings-diff" value={s.difficulty} onChange={(v) => updateSettings({ difficulty: v as Difficulty })}
            options={(["easy", "normal", "hard"] as Difficulty[]).map((d) => ({ v: d, label: t(`d.${d}`), desc: t(`d.${d}D`) }))} />
        </Card>
        <Card icon={Palette} title={t("set.color")} testid="settings-color">
          <CosmeticGrid kind="paint" mode="settings" />
        </Card>
        <Card icon={Flame} title={t("set.flame")} testid="settings-flame-trail">
          <div className="hud-label mb-2">{t("shop.flame")}</div>
          <CosmeticGrid kind="flame" mode="settings" />
          <div className="hud-label mt-5 mb-2">{t("shop.trail")}</div>
          <CosmeticGrid kind="trail" mode="settings" />
        </Card>
        <Card icon={Clapperboard} title={t("set.anim")} testid="settings-animation">
          <div className="hud-label mb-2">{t("set.speed")}</div>
          <Seg testid="settings-speed" value={s.speed} onChange={(v) => updateSettings({ speed: v })}
            options={[0.5, 1, 1.5, 2].map((v) => ({ v, label: `${v}×` }))} />
          <div className="hud-label mt-4 mb-1">{t("set.shake")}</div>
          <p className="text-xs text-slate-400 mb-2">{t("set.shakeDesc")}</p>
          <Seg testid="settings-shake" value={s.shake ? "on" : "off"} onChange={(v) => updateSettings({ shake: v === "on" })}
            options={[{ v: "on", label: t("on") }, { v: "off", label: t("off") }]} />
        </Card>
      </div>
    </div>
  );
}
