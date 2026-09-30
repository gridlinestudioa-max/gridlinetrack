// Central access to environment configuration.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * The apex host the app is served from, including port in dev.
 * e.g. "gridlinetrack.com" in production, "localhost:3000" locally.
 * Tenant sites live at "<slug>.<ROOT_DOMAIN>".
 */
export const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000").toLowerCase();

/**
 * Allow reaching a tenant site at /sites/<slug> on the root host.
 * Always on in development; opt in elsewhere (e.g. Vercel preview URLs, which
 * don't get wildcard subdomains) with ALLOW_PATH_TENANTS=true.
 */
export const ALLOW_PATH_TENANTS =
  process.env.NODE_ENV !== "production" || process.env.ALLOW_PATH_TENANTS === "true";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Public URL for an object in a public storage bucket. */
export function storagePublicUrl(path: string, bucket = "track-media") {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

/** Absolute URL of a tenant's public site. */
export function tenantSiteUrl(slug: string) {
  const protocol = ROOT_DOMAIN.startsWith("localhost") || ROOT_DOMAIN.includes("lvh.me") ? "http" : "https";
  return `${protocol}://${slug}.${ROOT_DOMAIN}`;
}
