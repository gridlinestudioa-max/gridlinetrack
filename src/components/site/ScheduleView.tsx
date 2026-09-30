import Link from "next/link";
import { dateParts, shortTime } from "@/lib/dates";
import type { EventCard, SiteData } from "@/lib/types";
import { DateBlock, StatusFlag } from "./bits";
import { classLine } from "./HomeView";

export function ScheduleView({ site, base, today }: { site: SiteData; base: string; today: string }) {
  const months = new Map<string, EventCard[]>();
  for (const e of site.events) {
    const key = e.event_date.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), e]);
  }
  const years = [...new Set(site.events.map((e) => e.event_date.slice(0, 4)))];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:pt-12">
      <h1 className="display text-6xl sm:text-8xl">
        {years.length === 1 ? `${years[0]} ` : ""}
        <span className="text-brand-text">Schedule</span>
      </h1>

      {site.events.length === 0 ? (
        <p className="mt-8 border-4 border-ink p-6 text-lg">No race nights posted yet.</p>
      ) : null}

      {[...months.entries()].map(([key, events]) => (
        <section key={key} className="mt-10">
          <h2 className="display border-b-4 border-ink pb-1 text-3xl tracking-[0.1em] sm:text-4xl">
            {dateParts(`${key}-01`).monLong} {key.slice(0, 4)}
          </h2>
          <ol>
            {events.map((e) => {
              const past = e.event_date < today || e.status === "completed";
              const flag = past && e.status === "scheduled" ? "completed" : e.status;
              const times = [
                e.gates_open && `Gates ${shortTime(e.gates_open)}`,
                e.racing_starts && `Racing ${shortTime(e.racing_starts)}`,
              ].filter(Boolean);
              return (
                <li key={e.id} className={`border-b-2 border-ink ${past ? "opacity-55" : ""}`}>
                  <Link
                    href={`${base}/events/${e.slug}`}
                    className="flex items-stretch gap-4 py-3 hover:bg-ink hover:text-paper"
                  >
                    <DateBlock date={e.event_date} size="sm" />
                    <div className="min-w-0 flex-1 self-center">
                      <p className="display text-2xl break-words sm:text-4xl">{e.title}</p>
                      {times.length ? (
                        <p className="display mt-1 text-base tracking-wide opacity-80">{times.join("  ·  ")}</p>
                      ) : null}
                      {classLine(e) ? <p className="mt-1 text-sm opacity-70">{classLine(e)}</p> : null}
                    </div>
                    <div className="self-center">
                      {flag !== "scheduled" ? <StatusFlag status={flag} /> : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
