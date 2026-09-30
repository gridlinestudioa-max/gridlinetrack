import type { SupabaseClient } from "@supabase/supabase-js";
import { storagePublicUrl } from "@/lib/env";
import type { BrandKit, EventCard, RaceClass, SiteData, Track } from "@/lib/types";

const DEFAULT_BRAND: Omit<BrandKit, "track_id"> = {
  logo_media_id: null,
  primary_color: "#E10600",
  secondary_color: "#0B0B0C",
  accent_color: "#FFD400",
  font_pair: "oswald-inter",
  template: "pitboard",
};

export const EVENT_CARD_SELECT =
  "*, event_classes(class_id, purse, is_feature, sort_order, classes(name, short_name)), event_specials(id, title, details, sort_order)";

function sortCard(e: EventCard): EventCard {
  return {
    ...e,
    admission: Array.isArray(e.admission) ? e.admission : [],
    event_classes: [...(e.event_classes ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    event_specials: [...(e.event_specials ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

/**
 * Everything a tenant site renders, loaded through whichever client the caller
 * passes: the anonymous client for the public site (RLS hides drafts and
 * unpublished tracks), or the signed-in client for the admin preview.
 */
export async function loadSite(
  supabase: SupabaseClient,
  by: { slug: string } | { trackId: string },
): Promise<SiteData | null> {
  const query = supabase.from("tracks").select("*");
  const { data: track, error } = await ("slug" in by ? query.eq("slug", by.slug) : query.eq("id", by.trackId))
    .maybeSingle<Track>();
  if (error) throw error;
  if (!track) return null;

  const [brandRes, eventsRes, classesRes] = await Promise.all([
    supabase.from("brand_kits").select("*").eq("track_id", track.id).maybeSingle<BrandKit>(),
    supabase
      .from("events")
      .select(EVENT_CARD_SELECT)
      .eq("track_id", track.id)
      .order("event_date", { ascending: true })
      .returns<EventCard[]>(),
    supabase
      .from("classes")
      .select("*")
      .eq("track_id", track.id)
      .order("sort_order")
      .order("name")
      .returns<RaceClass[]>(),
  ]);
  if (brandRes.error) throw brandRes.error;
  if (eventsRes.error) throw eventsRes.error;
  if (classesRes.error) throw classesRes.error;

  const brand: BrandKit = brandRes.data ?? { track_id: track.id, ...DEFAULT_BRAND };

  let logoUrl: string | null = null;
  if (brand.logo_media_id) {
    const { data: media } = await supabase
      .from("media")
      .select("bucket, path")
      .eq("id", brand.logo_media_id)
      .maybeSingle<{ bucket: string; path: string }>();
    if (media) logoUrl = storagePublicUrl(media.path, media.bucket);
  }

  return {
    track,
    brand,
    logoUrl,
    events: (eventsRes.data ?? []).map(sortCard),
    classes: classesRes.data ?? [],
  };
}
