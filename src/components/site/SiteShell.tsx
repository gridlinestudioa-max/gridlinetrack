import Link from "next/link";
import type { SiteData } from "@/lib/types";
import { safeHref } from "./bits";

export function SiteShell({
  site,
  base,
  preview,
  children,
}: {
  site: SiteData;
  base: string;
  preview?: { adminHref: string };
  children: React.ReactNode;
}) {
  const { track, logoUrl } = site;
  const tickets = safeHref(track.tickets_url);
  const socials = [
    ["Facebook", track.facebook_url],
    ["Instagram", track.instagram_url],
    ["TikTok", track.tiktok_url],
    ["YouTube", track.youtube_url],
  ]
    .map(([label, url]) => [label, safeHref(url)] as const)
    .filter((s): s is readonly [string, string] => Boolean(s[1]));
  const location = [track.city, track.region].filter(Boolean).join(", ");

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      {preview ? (
        <div className="bg-accent px-4 py-2 text-center text-sm text-on-accent">
          Preview — drafts are visible here only.{" "}
          <Link href={preview.adminHref} className="font-semibold underline">
            Back to admin
          </Link>
        </div>
      ) : null}
      <header className="border-b-4 border-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
          <Link href={base || "/"} className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- plain img: no metered image optimisation
              <img src={logoUrl} alt="" className="h-12 w-auto max-w-32 object-contain" />
            ) : null}
            <span className="display truncate text-2xl sm:text-3xl">{track.name}</span>
          </Link>
          <nav aria-label="Main" className="display flex items-center gap-1 text-lg">
            <Link href={`${base}/schedule`} className="px-3 py-2 hover:bg-ink hover:text-paper">
              Schedule
            </Link>
            {tickets ? (
              <a
                href={tickets}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand px-3 py-2 text-on-brand hover:brightness-110"
              >
                Tickets ↗
              </a>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t-4 border-ink">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3">
          <div>
            <p className="display text-2xl">{track.name}</p>
            {track.tagline ? <p className="mt-1 text-sm opacity-75">{track.tagline}</p> : null}
          </div>
          <address className="text-sm not-italic opacity-90">
            {track.address ?? location}
            {track.phone ? (
              <>
                <br />
                <a href={`tel:${track.phone.replace(/[^\d+]/g, "")}`} className="underline">
                  {track.phone}
                </a>
              </>
            ) : null}
            {track.email ? (
              <>
                <br />
                <a href={`mailto:${track.email}`} className="underline">
                  {track.email}
                </a>
              </>
            ) : null}
          </address>
          {socials.length ? (
            <ul className="display flex flex-wrap gap-2 text-sm sm:justify-end">
              {socials.map(([label, url]) => (
                <li key={label}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border-2 border-ink px-3 py-2 hover:bg-ink hover:text-paper"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <p className="px-4 pb-6 text-center text-xs opacity-50">Site by Gridline Track</p>
      </footer>
    </div>
  );
}
