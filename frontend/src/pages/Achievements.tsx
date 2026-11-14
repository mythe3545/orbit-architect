import { motion } from "motion/react";
import { Award, Lock, Crown } from "lucide-react";
import { useAstronaut } from "@/lib/hooks";
import { useSettings } from "@/lib/settings";
import { ACHIEVEMENTS, TITLES, titleFor } from "@/lib/achievements";
import { cn } from "@/lib/utils";

const L = {
  en: { kicker: "Post-mission achievements", title: "Achievements", rank: "Current title", next: "Next title in {n} achievements", max: "Highest title reached", bonus: "bonus pts", ladder: "Title ladder", unlocked: "unlocked" },
  tr: { kicker: "Görev sonrası başarımlar", title: "Başarımlar", rank: "Mevcut ünvan", next: "Sonraki ünvana {n} başarım kaldı", max: "En yüksek ünvana ulaşıldı", bonus: "bonus puan", ladder: "Ünvan basamakları", unlocked: "açıldı" },
  de: { kicker: "Erfolge nach der Mission", title: "Erfolge", rank: "Aktueller Titel", next: "Nächster Titel in {n} Erfolgen", max: "Höchster Titel erreicht", bonus: "Bonuspunkte", ladder: "Titelstufen", unlocked: "freigeschaltet" },
};

export default function Achievements() {
  const { lang } = useSettings();
  const { data: astro } = useAstronaut();
  const l = L[lang];
  const owned = new Set(astro?.achievements ?? []);
  const { idx, cur, next } = titleFor(owned.size);
  const pct = next ? ((owned.size - cur.min) / (next.min - cur.min)) * 100 : 100;
  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1300px] mx-auto">
      <p className="hud-label mb-1">{l.kicker}</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">{l.title}</h1>
      <div className="grid lg:grid-cols-[340px_1fr] gap-6 mt-5">
        <aside className="space-y-4">
          <div className="rounded-xl border border-amber-400/40 bg-[#070b12]/70 backdrop-blur-md p-5 hud-glow" data-testid="achievement-title-card">
            <div className="hud-label text-amber-300/80">{l.rank}</div>
            <div className="flex items-center gap-2 mt-1"><Crown className="size-6 text-amber-300" /><span className="font-heading text-2xl text-white" data-testid="achievement-current-title">{cur.tx[lang]}</span></div>
            <div className="h-2 rounded bg-slate-800 mt-4 overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-amber-400 to-cyan-300" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} /></div>
            <p className="font-mono text-[11px] text-slate-400 mt-2" data-testid="achievement-progress">{owned.size}/{ACHIEVEMENTS.length} {l.unlocked} · {next ? l.next.replace("{n}", String(next.min - owned.size)) : l.max}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#070b12]/70 backdrop-blur-md p-5" data-testid="title-ladder">
            <div className="hud-label mb-3">{l.ladder}</div>
            <ol className="space-y-2">
              {TITLES.map((t, i) => (
                <li key={t.min} className={cn("flex items-center justify-between rounded-md px-3 py-2 border", i === idx ? "border-amber-300 bg-amber-300/10 text-white" : i < idx ? "border-emerald-400/30 text-emerald-200" : "border-slate-800 text-slate-500")}>
                  <span className="text-sm">{i + 1}. {t.tx[lang]}</span><span className="font-mono text-[10px]">{t.min}+</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start">
          {ACHIEVEMENTS.map((a, i) => {
            const on = owned.has(a.id);
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} data-testid={`achievement-${a.id}`}
                className={cn("relative rounded-xl border p-4 backdrop-blur-md transition-[transform,border-color] duration-200 hover:-translate-y-0.5",
                  on ? "border-amber-400/50 bg-amber-400/[0.07]" : "border-slate-800 bg-[#070b12]/60")}>
                <div className="flex items-start gap-3">
                  <div className={cn("size-11 shrink-0 grid place-items-center rounded-lg text-2xl", on ? "bg-amber-400/15" : "bg-slate-900 grayscale opacity-40")}>{a.icon}</div>
                  <div className="min-w-0">
                    <div className={cn("font-heading", on ? "text-white" : "text-slate-400")}>{a.tx[lang][0]}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{a.tx[lang][1]}</div>
                    <div className="font-mono text-[10px] text-amber-300/80 mt-1.5">+{a.bonus} {l.bonus}</div>
                  </div>
                  <div className="ml-auto">{on ? <Award className="size-4 text-amber-300" data-testid={`achievement-unlocked-${a.id}`} /> : <Lock className="size-4 text-slate-600" />}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
