import Link from "next/link";
import { longDate } from "@/lib/dates";
import type { EventCard, SiteData } from "@/lib/types";
import { DateBlock, ExternalButton, SectionHeading, StatusFlag, TimeBoard, safeHref } from "./bits";

const BANNERS: Partial<Record<EventCard["status"], string>> = {
  postponed: "Postponed",
  rained_out: "Rained out",
  cancelled: "Cancelled",
};

export function EventView({ site, event, base }: { site: SiteData; event: EventCard; base: string }) {
  const tickets = safeHref(event.tickets_url ?? site.track.tickets_url);
  const stream = safeHref(event.livestream_url ?? site.track.livestream_url);
  const banner = BANNERS[event.status];
  const mapsQuery = site.track.address ?? [site.track.name, site.track.city, site.track.region].filter(Boolean).join(", ");

  return (
    <article className="mx-auto max-w-6xl px-4 pt-6 sm:pt-10">
      <Link href={`${base}/schedule`} className="display text-base opacity-70 hover:opacity-100">
        ← Schedule
      </Link>

      {banner ? (
        <div className="mt-4 border-4 border-ink p-1">
          <p className="display bg-paper px-4 py-3 text-3xl sm:text-4xl">
            {banner}
            {event.rain_date ? <span className="text-brand-text"> — new date {longDate(event.rain_date)}</span> : null}
          </p>
        </div>
      ) : null}

      <header className="mt-4 flex gap-4 sm:gap-6">
        <DateBlock date={event.event_date} />
        <div className="min-w-0 flex-1 self-center">
          <p className="display text-base text-brand-text sm:text-lg">{longDate(event.event_date)}</p>
          <h1 className="display mt-1 text-3xl break-words hyphens-auto sm:text-5xl lg:text-6xl">{event.title}</h1>
          {event.subtitle ? <p className="mt-2 text-lg opacity-80 sm:text-xl">{event.subtitle}</p> : null}
          {event.status !== "scheduled" && !banner ? (
            <div className="mt-3">
              <StatusFlag status={event.status} />
            </div>
          ) : null}
        </div>
      </header>

      <div className="mt-6">
        <TimeBoard
          times={[
            { label: "Gates", value: event.gates_open },
            { label: "Hot laps", value: event.hot_laps },
            { label: "Racing", value: event.racing_starts },
          ]}
        />
      </div>

      {tickets || stream ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {tickets ? <ExternalButton href={tickets}>Buy tickets</ExternalButton> : null}
          {stream ? (
            <ExternalButton href={stream} variant="outline">
              Watch live
            </ExternalButton>
          ) : null}
        </div>
      ) : null}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_22rem]">
        <div className="grid content-start gap-12">
          {event.event_classes.length ? (
            <section>
              <SectionHeading kicker={`${event.event_classes.length} classes`}>On the card</SectionHeading>
              <ol className="border-t-2 border-ink">
                {event.event_classes.map((c, i) => (
                  <li
                    key={c.class_id}
                    className={`grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b-2 border-ink py-3 ${
                      c.is_feature ? "bg-brand px-2 text-on-brand" : ""
                    }`}
                  >
                    <span className={`display text-center text-4xl ${c.is_feature ? "" : "text-accent-text"}`}>
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="display block text-3xl break-words sm:text-4xl">{c.classes?.name}</span>
                      {c.is_feature ? (
                        <span className="display text-sm">Feature event</span>
                      ) : null}
                    </span>
                    {c.purse ? <span className="display text-right text-xl sm:text-2xl">{c.purse}</span> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {event.event_specials.length ? (
            <section>
              <SectionHeading>Tonight&rsquo;s specials</SectionHeading>
              <ul className="grid gap-3 sm:grid-cols-2">
                {event.event_specials.map((s) => (
                  <li key={s.id} className="border-l-8 border-accent bg-ink/5 p-4">
                    <p className="display text-2xl">{s.title}</p>
                    {s.details ? <p className="mt-1 opacity-80">{s.details}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {event.description ? (
            <section>
              <SectionHeading>The rundown</SectionHeading>
              <div className="max-w-prose space-y-4 text-lg leading-relaxed">
                {event.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="grid content-start gap-8">
          {event.admission.length ? (
            <section className="border-4 border-ink">
              <h2 className="display bg-ink px-4 py-2 text-2xl text-paper">Admission</h2>
              <dl>
                {event.admission.map((a, i) => (
                  <div key={i} className="flex items-baseline gap-2 border-t-2 border-ink px-4 py-3 first:border-t-0">
                    <dt className="text-lg">{a.label}</dt>
                    <span className="flex-1 border-b-2 border-dotted border-current opacity-40" aria-hidden />
                    <dd className="display text-3xl text-brand-text">{a.price}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section>
            <h2 className="display text-2xl">Location</h2>
            <p className="mt-2">{mapsQuery}</p>
            {mapsQuery ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="display mt-2 inline-block text-lg underline underline-offset-4"
              >
                Directions ↗
              </a>
            ) : null}
          </section>
        </aside>
      </div>
    </article>
  );
}
