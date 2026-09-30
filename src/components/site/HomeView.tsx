import Link from "next/link";
import { dateParts, daysBetween, shortTime } from "@/lib/dates";
import type { EventCard, SiteData } from "@/lib/types";
import { DateBlock, ExternalButton, SectionHeading, StatusFlag, TimeBoard, countdownLabel, safeHref } from "./bits";
import { SubscribeForm } from "./SubscribeForm";

export function classLine(e: EventCard) {
  return e.event_classes.map((c) => c.classes?.short_name || c.classes?.name).filter(Boolean).join(" · ");
}

export function isUpcoming(e: EventCard, today: string) {
  return e.event_date >= today && e.status !== "completed";
}

export function HomeView({
  site,
  base,
  today,
  subscribe,
}: {
  site: SiteData;
  base: string;
  today: string;
  subscribe: boolean;
}) {
  const upcoming = site.events.filter((e) => isUpcoming(e, today));
  const next = upcoming.find((e) => e.status !== "cancelled" && e.status !== "rained_out") ?? upcoming[0];
  const rest = upcoming.filter((e) => e !== next).slice(0, 6);
  const feature = next?.event_classes.find((c) => c.is_feature) ?? next?.event_classes[0];
  const tickets = safeHref(next?.tickets_url ?? site.track.tickets_url);
  const stream = safeHref(next?.livestream_url ?? site.track.livestream_url);

  return (
    <>
      {next ? (
        <div className="bg-accent text-on-accent">
          <p className="display mx-auto max-w-6xl px-4 py-2 text-base leading-snug tracking-[0.12em] sm:text-lg">
            Next race <span aria-hidden>▸</span> {dateParts(next.event_date).dow} {dateParts(next.event_date).month}.
            {dateParts(next.event_date).day}
            {next.gates_open ? (
              <>
                {" "}
                <span aria-hidden>▸</span> Gates {shortTime(next.gates_open)}
              </>
            ) : null}
            {next.racing_starts ? (
              <>
                {" "}
                <span aria-hidden>▸</span> Racing {shortTime(next.racing_starts)}
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 pt-8 sm:pt-12">
        {next ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="display text-lg tracking-[0.25em] text-brand-text">
                {countdownLabel(daysBetween(today, next.event_date))}
              </p>
              {next.status !== "scheduled" ? <StatusFlag status={next.status} /> : null}
            </div>
            <div className="flex gap-4 sm:gap-6">
              <DateBlock date={next.event_date} />
              <div className="min-w-0 flex-1 self-center">
                <h1 className="display text-4xl break-words hyphens-auto min-[420px]:text-5xl sm:text-7xl lg:text-8xl">
                  <Link href={`${base}/events/${next.slug}`} className="hover:text-brand-text">
                    {next.title}
                  </Link>
                </h1>
                {next.subtitle ? <p className="mt-2 text-lg opacity-80 sm:text-xl">{next.subtitle}</p> : null}
                {feature?.classes ? (
                  <p className="display mt-3 text-xl sm:text-2xl">
                    <span className="text-accent-text">Feature</span> {feature.classes.name}
                    {feature.purse ? <span className="opacity-80"> — {feature.purse}</span> : null}
                  </p>
                ) : null}
              </div>
            </div>
            <TimeBoard
              times={[
                { label: "Gates", value: next.gates_open },
                { label: "Hot laps", value: next.hot_laps },
                { label: "Racing", value: next.racing_starts },
              ]}
            />
            <div className="flex flex-wrap gap-3">
              <Link
                href={`${base}/events/${next.slug}`}
                className="display inline-flex min-h-12 items-center border-2 border-ink px-5 py-3 text-lg hover:bg-ink hover:text-paper"
              >
                Race night details →
              </Link>
              {tickets ? <ExternalButton href={tickets}>Tickets</ExternalButton> : null}
              {stream ? (
                <ExternalButton href={stream} variant="outline">
                  Watch live
                </ExternalButton>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="border-4 border-ink p-8">
            <h1 className="display text-5xl sm:text-7xl">{site.track.name}</h1>
            <p className="mt-4 text-lg opacity-80">The schedule is coming soon. Check back for race nights.</p>
          </div>
        )}
      </section>

      {rest.length ? (
        <section className="mx-auto mt-14 max-w-6xl px-4">
          <SectionHeading kicker={`${upcoming.length} on the board`}>Coming up</SectionHeading>
          <ol className="border-t-2 border-ink">
            {rest.map((e, i) => {
              const p = dateParts(e.event_date);
              return (
                <li key={e.id} className="border-b-2 border-ink">
                  <Link
                    href={`${base}/events/${e.slug}`}
                    className="grid grid-cols-[2rem_6.5rem_minmax(0,1fr)] items-center gap-3 py-3 hover:bg-ink hover:text-paper sm:grid-cols-[3rem_8rem_1fr_auto] sm:gap-4"
                  >
                    <span className="display text-center text-3xl text-accent-text">{i + 2}</span>
                    <span className="display whitespace-nowrap text-xl sm:text-3xl">
                      {p.dow} <span className="text-brand-text">{p.month}.{p.day}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="display block truncate text-2xl sm:text-3xl">{e.title}</span>
                      {classLine(e) ? (
                        <span className="block truncate text-sm opacity-70">{classLine(e)}</span>
                      ) : null}
                    </span>
                    <span className="col-start-3 sm:col-start-auto">
                      {e.status !== "scheduled" ? <StatusFlag status={e.status} /> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <Link href={`${base}/schedule`} className="display mt-4 inline-block text-xl underline underline-offset-4">
            Full schedule →
          </Link>
        </section>
      ) : null}

      {site.classes.length ? (
        <section className="mx-auto mt-14 max-w-6xl px-4">
          <SectionHeading>Divisions</SectionHeading>
          <ul className="grid grid-cols-2 gap-0 border-l-2 border-t-2 border-ink sm:grid-cols-3 lg:grid-cols-5">
            {site.classes.map((c) => (
              <li key={c.id} className="border-b-2 border-r-2 border-ink p-4">
                <span className="display block text-4xl text-brand-text">{c.short_name || c.name.slice(0, 3)}</span>
                <span className="display mt-1 block text-lg">{c.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {subscribe ? (
        <section className="mx-auto mt-14 max-w-6xl px-4">
          <SubscribeForm trackId={site.track.id} trackName={site.track.name} />
        </section>
      ) : null}
    </>
  );
}
