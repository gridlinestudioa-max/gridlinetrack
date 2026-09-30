import type { CSSProperties } from "react";
import type { BrandKit, EventStatus, FontPairId } from "@/lib/types";

export const FONT_PAIRS: { id: FontPairId; label: string; display: string; body: string }[] = [
  { id: "oswald-inter", label: "Oswald / Inter", display: "Oswald", body: "Inter" },
  { id: "bebas-barlow", label: "Bebas Neue / Barlow", display: "Bebas Neue", body: "Barlow" },
  { id: "barlowcond-plex", label: "Barlow Condensed / IBM Plex Sans", display: "Barlow Condensed", body: "IBM Plex Sans" },
  { id: "anton-sourcesans", label: "Anton / Source Sans 3", display: "Anton", body: "Source Sans 3" },
];

export const TEMPLATES = [
  {
    id: "pitboard" as const,
    label: "Pit Board",
    description: "Broadcast-style: high contrast, condensed numerals, hard grid.",
  },
];

export const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

function channel(v: number) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = "#FFFFFF";
const BLACK = "#0A0A0A";

/** Black or white, whichever reads better on `bg`. */
export function readableOn(bg: string) {
  return contrastRatio(bg, WHITE) >= contrastRatio(bg, BLACK) ? WHITE : BLACK;
}

/**
 * Resolve a brand kit into the CSS variables the site template uses. Colours
 * that would be unreadable as text on the page background fall back to the
 * page's own ink colour, so any brand kit stays legible.
 */
export function brandVars(brand: Pick<BrandKit, "primary_color" | "secondary_color" | "accent_color">) {
  const paper = HEX_PATTERN.test(brand.secondary_color) ? brand.secondary_color : "#0B0B0C";
  const primary = HEX_PATTERN.test(brand.primary_color) ? brand.primary_color : "#E10600";
  const accent = HEX_PATTERN.test(brand.accent_color) ? brand.accent_color : "#FFD400";
  const ink = readableOn(paper);
  return {
    "--paper": paper,
    "--ink": ink,
    "--brand": primary,
    "--on-brand": readableOn(primary),
    "--accent": accent,
    "--on-accent": readableOn(accent),
    "--brand-text": contrastRatio(primary, paper) >= 3 ? primary : ink,
    "--accent-text": contrastRatio(accent, paper) >= 3 ? accent : ink,
  } as CSSProperties;
}

export const STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  scheduled: "On schedule",
  postponed: "Postponed",
  rained_out: "Rained out",
  cancelled: "Cancelled",
  completed: "Final",
};
