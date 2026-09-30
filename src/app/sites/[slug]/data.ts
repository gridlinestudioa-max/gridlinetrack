import { headers } from "next/headers";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { loadSite } from "@/lib/site-data";
import { createPublicClient } from "@/lib/supabase/public";

/** Public site data for a slug, deduplicated across layout/page/metadata in one request. */
export const getPublicSite = cache(async (slug: string) => {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured. Copy .env.example to .env.local.");
  return loadSite(createPublicClient(), { slug: slug.toLowerCase() });
});

/** Where site links are rooted: "" on a tenant subdomain, "/sites/<slug>" on the path fallback. */
export async function getSiteBase(slug: string) {
  const base = (await headers()).get("x-site-base");
  return base ?? `/sites/${slug}`;
}
