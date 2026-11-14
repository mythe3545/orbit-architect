import { useSyncExternalStore } from "react";

export type Lang = "en" | "tr" | "de";
export type Difficulty = "easy" | "normal" | "hard";
export type RocketColor = "classic" | "artemis" | "stealth" | "retro";

export interface Settings {
  sound: boolean;
  volume: number;
  lang: Lang;
  difficulty: Difficulty;
  color: RocketColor;
  speed: number;
  shake: boolean;
}

const KEY = "orbital_settings";
const DEFAULTS: Settings = { sound: true, volume: 0.6, lang: "en", difficulty: "normal", color: "classic", speed: 1, shake: true };
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

export interface Theme { body: [string, string, string]; band: string; capsule: [string, string]; nozzle: [string, string]; accent: string }
export const THEMES: Record<RocketColor, Theme> = {
  classic: { body: ["#cbd5e1", "#ffffff", "#cbd5e1"], band: "#0f172a", capsule: ["#ffffff", "#cbd5e1"], nozzle: ["#64748b", "#1e293b"], accent: "#00e5ff" },
  artemis: { body: ["#b45309", "#f59e0b", "#b45309"], band: "#1f2937", capsule: ["#ffffff", "#d1d5db"], nozzle: ["#78716c", "#292524"], accent: "#f59e0b" },
  stealth: { body: ["#0b1220", "#334155", "#0b1220"], band: "#00e5ff", capsule: ["#475569", "#0f172a"], nozzle: ["#334155", "#020617"], accent: "#00e5ff" },
  retro: { body: ["#e5e7eb", "#fafafa", "#e5e7eb"], band: "#dc2626", capsule: ["#fafafa", "#9ca3af"], nozzle: ["#57534e", "#1c1917"], accent: "#dc2626" },
};
