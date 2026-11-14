import { motion } from "motion/react";
import { CalendarClock, CheckCircle2, Crosshair, ExternalLink } from "lucide-react";
import type { WeeklyChallenge } from "@/lib/types";
import { useSettings } from "@/lib/settings";
import { KIND_COLOR, KIND_ICON } from "@/components/SpaceWeatherPanel";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const L = {
  en: { kicker: "Weekly challenge", title: "Ride this week's strongest solar storm", body: "Your first crisis is this real NASA DONKI event. Fly to {p} and get a full success for the bonus.", arm: "Accept challenge", armed: "Challenge armed", done: "Completed this week", bonus: "bonus pts", src: { live: "This week's event", archive: "No major event this week: strongest recorded event" }, until: "Resets Monday" },
  tr: { kicker: "Haftalık görev", title: "Bu haftanın en güçlü güneş fırtınasını aş", body: "İlk krizin bu gerçek NASA DONKI olayı olacak. {p} hedefine uç ve bonus için tam başarı elde et.", arm: "Görevi kabul et", armed: "Görev hazır", done: "Bu hafta tamamlandı", bonus: "bonus puan", src: { live: "Bu haftanın olayı", archive: "Bu hafta büyük olay yok: kayıtlı en güçlü olay" }, until: "Pazartesi yenilenir" },
  de: { kicker: "Wochen-Challenge", title: "Überstehe den stärksten Sonnensturm der Woche", body: "Deine erste Krise ist dieses echte NASA-DONKI-Ereignis. Fliege zu {p} und erziele vollen Erfolg für den Bonus.", arm: "Challenge annehmen", armed: "Challenge aktiv", done: "Diese Woche erledigt", bonus: "Bonuspunkte", src: { live: "Ereignis dieser Woche", archive: "Kein großes Ereignis diese Woche: stärkstes erfasstes Ereignis" }, until: "Reset am Montag" },
};

export default function WeeklyChallengeCard({ ch, planetName, armed, onArm }: { ch: WeeklyChallenge; planetName: string; armed: boolean; onArm: () => void }) {
  const { lang } = useSettings();
  const t = useT();
  const l = L[lang];
  const Icon = KIND_ICON[ch.event.type];
  const color = KIND_COLOR[ch.event.type];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} data-testid="weekly-challenge-card"
      className={cn("relative overflow-hidden rounded-xl border bg-[#070b12]/75 backdrop-blur-md p-4 sm:p-5 transition-[border-color,box-shadow] duration-300",
        armed ? "border-amber-300 shadow-[0_0_32px_-6px_rgba(251,191,36,0.55)]" : "border-amber-400/30")}>
      <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full blur-3xl opacity-30" style={{ background: color }} />
      <div className="relative flex flex-wrap gap-4 items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 hud-label text-amber-300/90"><CalendarClock className="size-3.5" />{l.kicker} · {ch.week}<span className="text-slate-500 normal-case tracking-normal">· {l.until}</span></div>
          <h3 className="font-heading text-lg sm:text-xl text-white mt-1" data-testid="weekly-challenge-title">{l.title}</h3>
          <p className="text-sm text-slate-300 mt-1">{l.body.replace("{p}", planetName)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-1" style={{ borderColor: color, color }} data-testid="weekly-challenge-event">
              <Icon className="size-3.5" />{t(`k.${ch.event.type}`)} · {ch.event.value}
            </span>
            <span className="text-slate-400">{ch.event.time.slice(0, 10)} · {ch.this_week ? l.src.live : l.src.archive}</span>
            {ch.event.link && <a href={ch.event.link} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline flex items-center gap-1">DONKI <ExternalLink className="size-3" /></a>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="font-mono text-2xl text-amber-200" data-testid="weekly-challenge-bonus">+{ch.bonus}<span className="text-[10px] text-amber-300/70 ml-1">{l.bonus}</span></div>
          {ch.completed ? (
            <span className="flex items-center gap-1.5 text-emerald-300 text-sm" data-testid="weekly-challenge-done"><CheckCircle2 className="size-4" />{l.done}</span>
          ) : (
            <button onClick={onArm} data-testid="weekly-challenge-accept-button"
              className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-[background-color,transform] duration-150 active:scale-95",
                armed ? "bg-amber-300 text-slate-950" : "bg-amber-400/15 text-amber-200 border border-amber-300/50 hover:bg-amber-400/25")}>
              <Crosshair className="size-4" />{armed ? `${l.armed} · ${planetName}` : l.arm}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
