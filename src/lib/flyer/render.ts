import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { createElement, type ReactElement } from "react";
import { pngToPdf } from "@/lib/pdf";
import type { FlyerData } from "./data";
import { Flyer } from "./Flyer";

export const FLYER_FORMATS = {
  /** 4:5 portrait: Instagram/Facebook feed. */
  social: { width: 1080, height: 1350 },
  /** US Letter at 300 dpi; safe margin comes from the layout's padding (~0.5in). */
  print: { width: 2550, height: 3300 },
} as const;

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 800; style: "normal" }[]> | undefined;

function loadFonts() {
  fonts ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Inter-Regular.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Inter-ExtraBold.ttf")),
  ]).then(([regular, bold]) => [
    { name: "Inter", data: regular, weight: 400, style: "normal" },
    { name: "Inter", data: bold, weight: 800, style: "normal" },
  ]);
  return fonts;
}

/** Render a next/og (satori) element to PNG bytes with the bundled fonts. */
export async function renderPng(element: ReactElement, width: number, height: number) {
  const image = new ImageResponse(element, { width, height, fonts: await loadFonts() });
  return new Uint8Array(await image.arrayBuffer());
}

export async function renderFlyerPng(data: FlyerData, format: keyof typeof FLYER_FORMATS) {
  const { width, height } = FLYER_FORMATS[format];
  return renderPng(createElement(Flyer, { data, u: width / 1080 }), width, height);
}

/** Print-ready US Letter PDF (8.5 × 11 in = 612 × 792 pt) from the 300 dpi render. */
export async function renderFlyerPdf(data: FlyerData) {
  return pngToPdf(await renderFlyerPng(data, "print"), 612, 792);
}
