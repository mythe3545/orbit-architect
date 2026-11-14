import type { Lang } from "@/lib/settings";

export type Kind = "paint" | "flame" | "trail" | "theme";
type Names = Record<Lang, string>;

export interface FlameStyle { core: string; mid: string; outer: string; tail: string; glow: string }
export interface UiTheme { accent: string; rgb: string; swatch: [string, string, string] }

/** Flame colour ramps (rgb triplets) used by the flight canvas and the builder preview. */
export const FLAMES: Record<string, FlameStyle & { names: Names }> = {
  kerosene: { core: "255,255,240", mid: "255,200,90", outer: "255,110,20", tail: "255,60,0", glow: "255,220,150", names: { en: "Kerosene orange", tr: "Kerosen turuncusu", de: "Kerosin-Orange" } },
  hydrogen: { core: "240,250,255", mid: "147,197,253", outer: "59,130,246", tail: "30,64,175", glow: "165,210,255", names: { en: "Hydrogen blue", tr: "Hidrojen mavisi", de: "Wasserstoff-Blau" } },
  plasma: { core: "255,240,255", mid: "232,121,249", outer: "168,85,247", tail: "88,28,135", glow: "240,171,252", names: { en: "Plasma violet", tr: "Plazma moru", de: "Plasma-Violett" } },
  emerald: { core: "240,255,244", mid: "134,239,172", outer: "34,197,94", tail: "20,83,45", glow: "187,247,208", names: { en: "Copper green", tr: "Bakır yeşili", de: "Kupfergrün" } },
  solar: { core: "255,255,255", mid: "254,240,138", outer: "250,204,21", tail: "234,88,12", glow: "254,249,195", names: { en: "Solar white-gold", tr: "Güneş beyaz-altını", de: "Sonnen-Weißgold" } },
};

/** Flight trails drawn behind the vehicle. */
export const TRAILS: Record<string, { names: Names; color: string }> = {
  none: { names: { en: "No trail", tr: "İz yok", de: "Keine Spur" }, color: "100,116,139" },
  sparks: { names: { en: "Ember sparks", tr: "Kıvılcım izi", de: "Funkenflug" }, color: "251,146,60" },
  ion: { names: { en: "Ion stream", tr: "İyon akışı", de: "Ionenstrom" }, color: "56,189,248" },
  stardust: { names: { en: "Stardust", tr: "Yıldız tozu", de: "Sternenstaub" }, color: "255,255,255" },
  rainbow: { names: { en: "Aurora ribbon", tr: "Kutup ışığı kurdelesi", de: "Polarlichtband" }, color: "244,114,182" },
};

/** Menu colour themes. The CSS for each lives in index.css under html[data-ui="..."]. */
export const UI_THEMES: Record<string, UiTheme & { names: Names }> = {
  mission: { accent: "#00e5ff", rgb: "0,229,255", swatch: ["#00e5ff", "#0e7490", "#070b12"], names: { en: "Mission cyan", tr: "Görev camgöbeği", de: "Missions-Cyan" } },
  emerald: { accent: "#34d399", rgb: "52,211,153", swatch: ["#34d399", "#047857", "#070b12"], names: { en: "Emerald control", tr: "Zümrüt kontrol", de: "Smaragd-Kontrolle" } },
  arctic: { accent: "#7dd3fc", rgb: "125,211,252", swatch: ["#7dd3fc", "#0369a1", "#070b12"], names: { en: "Arctic ice", tr: "Kutup buzu", de: "Arktis-Eis" } },
  mars: { accent: "#fb923c", rgb: "251,146,60", swatch: ["#fb923c", "#c2410c", "#120806"], names: { en: "Mars dust", tr: "Mars tozu", de: "Marsstaub" } },
  nebula: { accent: "#a78bfa", rgb: "167,139,250", swatch: ["#a78bfa", "#6d28d9", "#0b0716"], names: { en: "Nebula violet", tr: "Bulutsu moru", de: "Nebel-Violett" } },
  gold: { accent: "#facc15", rgb: "250,204,21", swatch: ["#facc15", "#a16207", "#100c04"], names: { en: "Apollo gold", tr: "Apollo altını", de: "Apollo-Gold" } },
  aurora: { accent: "#f472b6", rgb: "244,114,182", swatch: ["#f472b6", "#be185d", "#12060c"], names: { en: "Aurora pink", tr: "Kutup ışığı pembesi", de: "Polarlicht-Pink" } },
};

/** Settings key each kind writes to, and the id prefix used in the shop catalogue. */
export const KIND_META: Record<Kind, { prefix: string; setting: "color" | "flame" | "trail" | "ui" }> = {
  paint: { prefix: "paint_", setting: "color" },
  flame: { prefix: "flame_", setting: "flame" },
  trail: { prefix: "trail_", setting: "trail" },
  theme: { prefix: "ui_", setting: "ui" },
};

export const keyOf = (id: string, kind: Kind) => id.slice(KIND_META[kind].prefix.length);
