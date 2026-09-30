import type { EventStatus, FontPairId } from "@/lib/types";

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

export const STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  scheduled: "On schedule",
  postponed: "Postponed",
  rained_out: "Rained out",
  cancelled: "Cancelled",
  completed: "Final",
};
