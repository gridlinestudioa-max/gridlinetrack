import { Anton, Barlow, Barlow_Condensed, Bebas_Neue, IBM_Plex_Sans, Inter, Oswald, Source_Sans_3 } from "next/font/google";
import type { FontPairId } from "@/lib/types";

// next/font self-hosts these at build time: no runtime requests to Google.
// preload is off so a site only downloads the pair it actually uses.
const oswald = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"], display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", preload: false });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], display: "swap", preload: false });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", preload: false });
const anton = Anton({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const sourceSans = Source_Sans_3({ subsets: ["latin"], display: "swap", preload: false });

const PAIRS = {
  "oswald-inter": [oswald, inter],
  "bebas-barlow": [bebas, barlow],
  "barlowcond-plex": [barlowCondensed, plex],
  "anton-sourcesans": [anton, sourceSans],
} as const;

/** CSS variables that point the template's display/body fonts at a pair. */
export function fontVars(pair: FontPairId) {
  const [display, body] = PAIRS[pair] ?? PAIRS["oswald-inter"];
  return {
    "--site-display": display.style.fontFamily,
    "--site-body": body.style.fontFamily,
  } as Record<string, string>;
}
