import { requireTrack } from "@/lib/admin";
import { loadFlyerData } from "@/lib/flyer/data";
import { renderFlyerPdf, renderFlyerPng } from "@/lib/flyer/render";

/**
 * GET …/flyer?format=png|pdf[&download=1]
 * The event flyer, generated from the saved event card. Members of the track only.
 */
export async function GET(request: Request, ctx: RouteContext<"/admin/t/[trackId]/events/[eventId]/flyer">) {
  const { trackId, eventId } = await ctx.params;
  const { supabase, track } = await requireTrack(trackId);
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) return new Response("Not found", { status: 404 });

  const data = await loadFlyerData(supabase, track, eventId);
  if (!data) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const pdf = url.searchParams.get("format") === "pdf";
  const body = pdf ? await renderFlyerPdf(data) : await renderFlyerPng(data, "social");
  const filename = `${data.event.slug}-flyer.${pdf ? "pdf" : "png"}`;

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": pdf ? "application/pdf" : "image/png",
      "Content-Disposition": `${url.searchParams.has("download") ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
