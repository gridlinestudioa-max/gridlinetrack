import { createElement } from "react";
import type { FlyerData } from "@/lib/flyer/data";
import { renderPng } from "@/lib/flyer/render";
import { GRAPHIC_SIZES, Graphic, type GraphicKind, type GraphicSize } from "./Graphic";

export function renderGraphicPng(data: FlyerData, kind: GraphicKind, size: GraphicSize) {
  const { width, height } = GRAPHIC_SIZES[size];
  return renderPng(createElement(Graphic, { data, kind, size }), width, height);
}
