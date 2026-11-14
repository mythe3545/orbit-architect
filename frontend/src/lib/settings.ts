import { useSyncExternalStore } from "react";

export type Lang = "en" | "tr" | "de";
export type Difficulty = "easy" | "normal" | "hard";
export type RocketColor = "classic" | "artemis" | "stealth" | "retro" | "gold" | "carbon" | "mars" | "nebula" | "checker" | "arctic";

export interface Settings {
  sound: boolean;
  volume: number;
  lang: Lang;
  difficulty: Difficulty;
  color: RocketColor;
  speed: number;
  shake: boolean;
  flame: string;
  trail: string;
  ui: string;
}

const KEY = "orbital_settings";
const DEFAULTS: Settings = { sound: true, volume: 0.6, lang: "en", difficulty: "normal", color: "classic", speed: 1, shake: true, flame: "kerosene", trail: "none", ui: "mission" };
const listeners = new Set<() => void>();
let cache: Settings | null = null;

export function getSettings(): Settings {
  if (!cache) {
    try { cache = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { cache = { ...DEFAULTS }; }
  }
  return cache!;
}

export function updateSettings(patch: Partial<Settings>) {
  cache = { ...getSettings(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

export function useSettings(): Settings {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, getSettings);
}

export interface Theme { body: [string, string, string]; band: string; capsule: [string, string]; nozzle: [string, string]; accent: string; pattern?: "checker" }
export const THEMES: Record<RocketColor, Theme> = {
  classic: { body: ["#cbd5e1", "#ffffff", "#cbd5e1"], band: "#0f172a", capsule: ["#ffffff", "#cbd5e1"], nozzle: ["#64748b", "#1e293b"], accent: "#00e5ff" },
  artemis: { body: ["#b45309", "#f59e0b", "#b45309"], band: "#1f2937", capsule: ["#ffffff", "#d1d5db"], nozzle: ["#78716c", "#292524"], accent: "#f59e0b" },
  stealth: { body: ["#0b1220", "#334155", "#0b1220"], band: "#00e5ff", capsule: ["#475569", "#0f172a"], nozzle: ["#334155", "#020617"], accent: "#00e5ff" },
  retro: { body: ["#e5e7eb", "#fafafa", "#e5e7eb"], band: "#dc2626", capsule: ["#fafafa", "#9ca3af"], nozzle: ["#57534e", "#1c1917"], accent: "#dc2626" },
  gold: { body: ["#a16207", "#fde68a", "#a16207"], band: "#422006", capsule: ["#fef3c7", "#d97706"], nozzle: ["#78350f", "#1c1917"], accent: "#facc15" },
  carbon: { body: ["#0a0a0a", "#3f3f46", "#0a0a0a"], band: "#ef4444", capsule: ["#52525b", "#18181b"], nozzle: ["#3f3f46", "#09090b"], accent: "#ef4444" },
  mars: { body: ["#7c2d12", "#ea580c", "#7c2d12"], band: "#fde68a", capsule: ["#fed7aa", "#c2410c"], nozzle: ["#57534e", "#1c1917"], accent: "#f97316" },
  nebula: { body: ["#3b0764", "#a855f7", "#3b0764"], band: "#f0abfc", capsule: ["#e9d5ff", "#7e22ce"], nozzle: ["#4c1d95", "#1e1b4b"], accent: "#c084fc" },
  checker: { body: ["#e5e7eb", "#ffffff", "#e5e7eb"], band: "#111827", capsule: ["#ffffff", "#9ca3af"], nozzle: ["#374151", "#111827"], accent: "#111827", pattern: "checker" },
  arctic: { body: ["#bae6fd", "#f0f9ff", "#bae6fd"], band: "#0369a1", capsule: ["#ffffff", "#bae6fd"], nozzle: ["#64748b", "#0f172a"], accent: "#38bdf8" },
};
