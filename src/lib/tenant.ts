// Tenant resolution from the request hostname. Pure, so it runs in the proxy.

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30})[a-z0-9]$/;

// Keep in sync with the tracks_slug_reserved constraint in the migrations.
export const RESERVED_SLUGS = new Set([
  "www", "app", "admin", "api", "auth", "sites", "static", "assets", "cdn",
  "mail", "email", "smtp", "dev", "staging", "preview", "status", "help",
  "support", "docs", "blog", "dashboard", "login", "signup", "gridline",
]);

export type HostMatch = { kind: "root" } | { kind: "tenant"; slug: string } | { kind: "unknown" };

function stripPort(host: string) {
  // IPv6 literals ("[::1]:3000") never carry tenants.
  if (host.startsWith("[")) return host;
  return host.split(":")[0];
}

/**
 * Work out which site a Host header points at.
 *
 *   gridlinetrack.com            -> root (marketing + admin)
 *   www.gridlinetrack.com        -> root
 *   eagle.gridlinetrack.com      -> tenant "eagle"
 *   eagle.localhost:3000         -> tenant "eagle" (dev, when ROOT_DOMAIN is localhost:3000)
 *   anything else                -> unknown (treated as root; e.g. Vercel preview URLs)
 */
export function matchHost(hostHeader: string, rootDomain: string): HostMatch {
  const host = stripPort(hostHeader.trim().toLowerCase()).replace(/\.$/, "");
  const root = stripPort(rootDomain.trim().toLowerCase());
  if (!host) return { kind: "unknown" };
  if (host === root || host === `www.${root}`) return { kind: "root" };

  if (host.endsWith(`.${root}`)) {
    const sub = host.slice(0, -(root.length + 1));
    if (!sub.includes(".") && SLUG_PATTERN.test(sub) && !RESERVED_SLUGS.has(sub)) {
      return { kind: "tenant", slug: sub };
    }
    return { kind: "unknown" };
  }
  return { kind: "unknown" };
}

export function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug);
}

export function slugify(input: string, maxLength = 60) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}
