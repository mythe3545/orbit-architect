import type { Lang } from "@/lib/settings";

type Tx = Record<Lang, [string, string]>;
export interface AchievementDef { id: string; bonus: number; icon: string; tx: Tx }

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_flight", bonus: 50, icon: "🚀", tx: { en: ["First Ignition", "Fly your first mission"], tr: ["İlk Ateşleme", "İlk görevini uçur"], de: ["Erste Zündung", "Fliege deine erste Mission"] } },
  { id: "first_success", bonus: 100, icon: "✅", tx: { en: ["Mission Accomplished", "Complete a mission with full success"], tr: ["Görev Tamam", "Bir görevi tam başarıyla bitir"], de: ["Mission erfüllt", "Schließe eine Mission voll erfolgreich ab"] } },
  { id: "moonwalker", bonus: 150, icon: "🌕", tx: { en: ["Moonwalker", "Succeed on a Moon mission"], tr: ["Ay Yürüyüşçüsü", "Ay görevinde başarılı ol"], de: ["Mondgänger", "Erfolgreiche Mondmission"] } },
  { id: "red_planet", bonus: 200, icon: "🔴", tx: { en: ["Red Planet", "Succeed on a Mars mission"], tr: ["Kızıl Gezegen", "Mars görevinde başarılı ol"], de: ["Roter Planet", "Erfolgreiche Marsmission"] } },
  { id: "gas_giant", bonus: 300, icon: "🪐", tx: { en: ["Gas Giant Explorer", "Succeed at Jupiter or Saturn"], tr: ["Gaz Devi Kâşifi", "Jüpiter veya Satürn'de başarılı ol"], de: ["Gasriesen-Forscher", "Erfolg bei Jupiter oder Saturn"] } },
  { id: "grand_tour", bonus: 400, icon: "🧭", tx: { en: ["Grand Tour", "Explore 5 celestial bodies"], tr: ["Büyük Tur", "5 gök cismini keşfet"], de: ["Große Tour", "Erkunde 5 Himmelskörper"] } },
  { id: "flawless", bonus: 250, icon: "💎", tx: { en: ["Flawless Flight", "Make only optimal calls in a mission"], tr: ["Kusursuz Uçuş", "Bir görevde sadece en iyi kararları ver"], de: ["Makelloser Flug", "Nur optimale Entscheidungen in einer Mission"] } },
  { id: "storm_rider", bonus: 200, icon: "☀️", tx: { en: ["Storm Rider", "Overcome every DONKI space-weather crisis in a mission"], tr: ["Fırtına Binicisi", "Bir görevdeki tüm DONKI uzay havası krizlerini aş"], de: ["Sturmreiter", "Meistere alle DONKI-Weltraumwetterkrisen einer Mission"] } },
  { id: "hard_mode", bonus: 250, icon: "🔥", tx: { en: ["Iron Nerves", "Succeed on Hard difficulty"], tr: ["Çelik Sinirler", "Zor seviyede başarılı ol"], de: ["Nerven aus Stahl", "Erfolg auf Schwer"] } },
  { id: "perfect_score", bonus: 300, icon: "🏆", tx: { en: ["Perfect Score", "Reach a mission score of 95% or more"], tr: ["Mükemmel Skor", "%95 veya üzeri görev puanına ulaş"], de: ["Perfekte Wertung", "Erreiche 95 % oder mehr"] } },
  { id: "veteran", bonus: 350, icon: "🎖️", tx: { en: ["Veteran", "Fly 10 missions"], tr: ["Kıdemli", "10 görev uçur"], de: ["Veteran", "Fliege 10 Missionen"] } },
];

export const TITLES: { min: number; tx: Record<Lang, string> }[] = [
  { min: 0, tx: { en: "Space Cadet", tr: "Uzay Öğrencisi", de: "Weltraumkadett" } },
  { min: 2, tx: { en: "Orbital Pilot", tr: "Yörünge Pilotu", de: "Orbitalpilot" } },
  { min: 4, tx: { en: "Mission Commander", tr: "Görev Komutanı", de: "Missionskommandant" } },
  { min: 7, tx: { en: "Flight Director", tr: "Uçuş Direktörü", de: "Flugdirektor" } },
  { min: 10, tx: { en: "Space Legend", tr: "Uzay Efsanesi", de: "Weltraumlegende" } },
];

export function titleFor(count: number) {
  let idx = 0;
  TITLES.forEach((t, i) => { if (count >= t.min) idx = i; });
  return { idx, cur: TITLES[idx], next: TITLES[idx + 1] ?? null };
}
