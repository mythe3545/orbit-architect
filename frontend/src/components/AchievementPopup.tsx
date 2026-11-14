import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { useSettings } from "@/lib/settings";
import { sfx } from "@/lib/sound";

const HEAD = { en: "Achievement unlocked", tr: "Başarım kazanıldı", de: "Erfolg freigeschaltet" };
const TAP = { en: "tap to continue", tr: "devam için dokun", de: "zum Fortfahren tippen" };

/** Glowing full-screen pop-up that shows each newly unlocked achievement in turn, with a chime. */
export default function AchievementPopup({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const { lang } = useSettings();
  const [i, setI] = useState(0);
  const a = ACHIEVEMENTS.find((x) => x.id === ids[i]);
  useEffect(() => {
    if (!a) { onDone(); return; }
    sfx.achievement();
    const tm = window.setTimeout(() => setI((n) => n + 1), 3200);
    return () => clearTimeout(tm);
  }, [i, a, onDone]);
  return (
    <AnimatePresence>
      {a && (
        <motion.div key={a.id} className="fixed inset-0 z-[80] grid place-items-center bg-black/55 backdrop-blur-sm cursor-pointer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setI((n) => n + 1)} data-testid="achievement-popup">
          <motion.div initial={{ scale: 0.5, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative mx-6 w-full max-w-sm rounded-2xl border border-amber-300/70 bg-[#0b0f17]/90 px-8 py-9 text-center ach-glow">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <div className="absolute left-1/2 top-1/3 size-[420px] -translate-x-1/2 -translate-y-1/2 ach-rays" />
            </div>
            <div className="relative">
              <div className="hud-label text-amber-300">{HEAD[lang]}{ids.length > 1 ? ` · ${i + 1}/${ids.length}` : ""}</div>
              <motion.div className="mx-auto mt-5 grid size-24 place-items-center rounded-full bg-amber-300/15 text-5xl ring-2 ring-amber-300/60 ach-pulse"
                initial={{ rotate: -25, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 12 }}>
                {a.icon}
              </motion.div>
              <div className="font-heading text-2xl text-white mt-5" data-testid="achievement-popup-name">{a.tx[lang][0]}</div>
              <div className="text-sm text-slate-300 mt-1">{a.tx[lang][1]}</div>
              <motion.div className="font-mono text-3xl text-amber-200 mt-4" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.45 }}>+{a.bonus}</motion.div>
              <div className="font-mono text-[10px] text-slate-500 mt-4 uppercase tracking-[0.2em]">{TAP[lang]}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
