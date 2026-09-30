import { NextResponse, type NextRequest } from "next/server";
import { ALLOW_PATH_TENANTS, ROOT_DOMAIN } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy";
import { matchHost } from "@/lib/tenant";

/**
 * Multi-tenancy by hostname.
 *
 *   <slug>.ROOT_DOMAIN/…   -> rewritten to /sites/<slug>/…   (public track site)
 *   ROOT_DOMAIN/admin/…    -> admin (session refreshed, sign-in required)
 *   ROOT_DOMAIN/sites/<slug>/… -> tenant site by path; dev / ALLOW_PATH_TENANTS only
 *
 * The rendered site needs to know where its links are rooted ("" on a
 * subdomain, "/sites/<slug>" on the path fallback); that travels in the
 * x-site-base request header, which we always overwrite so clients can't set it.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-site-base");

  const host = matchHost(request.headers.get("host") ?? "", ROOT_DOMAIN);

  if (host.kind === "tenant") {
    const url = request.nextUrl.clone();
    url.pathname = `/sites/${host.slug}${pathname === "/" ? "" : pathname}`;
    requestHeaders.set("x-site-base", "");
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  if (pathname === "/sites" || pathname.startsWith("/sites/")) {
    if (!ALLOW_PATH_TENANTS) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
    const slug = pathname.split("/")[2] ?? "";
    requestHeaders.set("x-site-base", `/sites/${slug}`);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const { response, signedIn } = await updateSession(request, requestHeaders);
    const isPublicAdminPath = pathname === "/admin/login";
    if (!signedIn && !isPublicAdminPath) {
      const login = request.nextUrl.clone();
      login.pathname = "/admin/login";
      login.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(login);
    }
    return response;
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Everything except Next internals and files with an extension (favicon, robots.txt, images…)
    "/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
