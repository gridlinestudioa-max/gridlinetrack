import { requireTrack } from "@/lib/admin";
import { loadFlyerData } from "@/lib/flyer/data";
import { GRAPHIC_KINDS, GRAPHIC_SIZES, NOTICE_STATUSES, type GraphicKind, type GraphicSize } from "@/lib/graphics/Graphic";
import { renderGraphicPng } from "@/lib/graphics/render";

/**
 * GET …/graphic?kind=announcement|cancellation|thanks&size=square|story[&download=1]
 * A social graphic generated from the saved event card. Members of the track only.
 */
export async function GET(request: Request, ctx: RouteContext<"/admin/t/[trackId]/events/[eventId]/graphic">) {
  const { trackId, eventId } = await ctx.params;
  const { supabase, track } = await requireTrack(trackId);
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") as GraphicKind;
  const size = url.searchParams.get("size") as GraphicSize;
  if (!GRAPHIC_KINDS.includes(kind) || !(size in GRAPHIC_SIZES)) {
    return new Response("Unknown graphic", { status: 400 });
  }

  const data = await loadFlyerData(supabase, track, eventId);
  if (!data) return new Response("Not found", { status: 404 });
  if (kind === "cancellation" && !NOTICE_STATUSES.has(data.event.status)) {
    return new Response("Set the event to Postponed, Rained out or Cancelled first.", { status: 409 });
  }

  const png = await renderGraphicPng(data, kind, size);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `${url.searchParams.has("download") ? "attachment" : "inline"}; filename="${data.event.slug}-${kind}-${size}.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
