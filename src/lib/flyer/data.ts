import type { SupabaseClient } from "@supabase/supabase-js";
import { storagePublicUrl, tenantSiteUrl } from "@/lib/env";
import { EVENT_CARD_SELECT } from "@/lib/site-data";
import type { EventCard, Track } from "@/lib/types";

export interface FlyerData {
  track: Pick<Track, "name" | "slug" | "address" | "city" | "region">;
  event: EventCard;
  /** Logo as a data: URI (PNG/JPEG only; satori can't draw WebP), or null. */
  logo: string | null;
  /** Public site address without the protocol, e.g. "gridlinetrack.vercel.app/sites/eagle". */
  siteAddress: string;
}

const DRAWABLE = new Set(["image/png", "image/jpeg"]);

/** Everything a flyer needs, straight from the saved event card. */
export async function loadFlyerData(
  supabase: SupabaseClient,
  track: Track,
  eventId: string,
): Promise<FlyerData | null> {
  const [{ data: event }, { data: brand }] = await Promise.all([
    supabase.from("events").select(EVENT_CARD_SELECT).eq("id", eventId).eq("track_id", track.id).maybeSingle<EventCard>(),
    supabase.from("brand_kits").select("logo_media_id").eq("track_id", track.id).maybeSingle<{ logo_media_id: string | null }>(),
  ]);
  if (!event) return null;
  event.event_classes = [...(event.event_classes ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  event.event_specials = [...(event.event_specials ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  event.admission = Array.isArray(event.admission) ? event.admission : [];

  let logo: string | null = null;
  if (brand?.logo_media_id) {
    const { data: media } = await supabase
      .from("media")
      .select("bucket, path, mime_type")
      .eq("id", brand.logo_media_id)
      .maybeSingle<{ bucket: string; path: string; mime_type: string | null }>();
    if (media && DRAWABLE.has(media.mime_type ?? "")) logo = await fetchAsDataUri(storagePublicUrl(media.path, media.bucket));
  }

  return {
    track: { name: track.name, slug: track.slug, address: track.address, city: track.city, region: track.region },
    event,
    logo,
    siteAddress: tenantSiteUrl(track.slug).replace(/^https?:\/\//, ""),
  };
}

async function fetchAsDataUri(url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    const type = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (!res.ok || !DRAWABLE.has(type)) return null;
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}
