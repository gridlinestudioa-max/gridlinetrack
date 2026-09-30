import { cache } from "react";
import { requireTrack } from "@/lib/admin";
import { loadSite } from "@/lib/site-data";

/** Site data as the signed-in member sees it (includes drafts and unpublished tracks). */
export const getPreviewSite = cache(async (trackId: string) => {
  const { supabase } = await requireTrack(trackId);
  return loadSite(supabase, { trackId });
});
