import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { longDate, todayIn } from "@/lib/dates";
import type { SiteData } from "@/lib/types";
import { EventView } from "./EventView";
import { HomeView } from "./HomeView";
import { ScheduleView } from "./ScheduleView";

type Route = { page: "home" } | { page: "schedule" } | { page: "event"; slug: string };

export function resolveSitePath(path: string[] = []): Route | null {
  if (path.length === 0) return { page: "home" };
  if (path.length === 1 && path[0] === "schedule") return { page: "schedule" };
  if (path.length === 2 && path[0] === "events") return { page: "event", slug: decodeURIComponent(path[1]) };
  return null;
}

/** Renders one page of the (single) Pit Board template. Shared by the public site and the admin preview. */
export function SitePage({
  site,
  path,
  base,
  preview = false,
}: {
  site: SiteData;
  path?: string[];
  base: string;
  preview?: boolean;
}) {
  const route = resolveSitePath(path);
  if (!route) notFound();
  const today = todayIn(site.track.timezone);

  switch (route.page) {
    case "home":
      return <HomeView site={site} base={base} today={today} subscribe={!preview} />;
    case "schedule":
      return <ScheduleView site={site} base={base} today={today} />;
    case "event": {
      const event = site.events.find((e) => e.slug === route.slug);
      if (!event) notFound();
      return <EventView site={site} event={event} base={base} />;
    }
  }
}

export function siteMetadata(site: SiteData | null, path?: string[]): Metadata {
  if (!site) return { title: "Track not found" };
  const { track } = site;
  const route = resolveSitePath(path);
  if (route?.page === "schedule") return { title: `Schedule — ${track.name}` };
  if (route?.page === "event") {
    const event = site.events.find((e) => e.slug === route.slug);
    if (event) {
      return {
        title: `${event.title} — ${track.name}`,
        description: `${longDate(event.event_date)} at ${track.name}.${event.subtitle ? ` ${event.subtitle}` : ""}`,
      };
    }
  }
  return { title: track.name, description: track.tagline ?? undefined };
}
