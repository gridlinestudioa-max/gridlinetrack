import type { Metadata } from "next";
import { requireTrack } from "@/lib/admin";
import { FONT_PAIRS } from "@/lib/brand";
import { storagePublicUrl } from "@/lib/env";
import { fontVars } from "@/lib/fonts";
import type { BrandKit, FontPairId } from "@/lib/types";
import { BrandForm } from "./BrandForm";

export const metadata: Metadata = { title: "Brand — Gridline Track" };

export default async function BrandPage({ params, searchParams }: PageProps<"/admin/t/[trackId]/brand">) {
  const { trackId } = await params;
  const { welcome } = await searchParams;
  const { supabase, track } = await requireTrack(trackId);
  const { data: brand } = await supabase.from("brand_kits").select("*").eq("track_id", track.id).single<BrandKit>();

  let logoUrl: string | null = null;
  if (brand?.logo_media_id) {
    const { data: media } = await supabase
      .from("media")
      .select("bucket, path")
      .eq("id", brand.logo_media_id)
      .maybeSingle<{ bucket: string; path: string }>();
    if (media) logoUrl = storagePublicUrl(media.path, media.bucket);
  }

  const fonts = Object.fromEntries(FONT_PAIRS.map((p) => [p.id, fontVars(p.id)])) as Record<
    FontPairId,
    Record<string, string>
  >;

  return (
    <div className="grid gap-4">
      {welcome ? (
        <p role="status" className="border-l-4 border-green-700 bg-green-50 px-3 py-2 text-sm text-green-800">
          {track.name} is set up. Add your logo and colours, then create your first event.
        </p>
      ) : null}
      <h2 className="display text-3xl">Brand kit</h2>
      {brand ? (
        <BrandForm trackId={track.id} trackName={track.name} brand={brand} logoUrl={logoUrl} fonts={fonts} />
      ) : (
        <p>Brand kit missing for this track.</p>
      )}
    </div>
  );
}
