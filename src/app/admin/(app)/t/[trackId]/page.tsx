import Link from "next/link";
import { StatusFlag } from "@/components/site/bits";
import { requireTrack } from "@/lib/admin";
import { dateParts, shortTime, todayIn } from "@/lib/dates";
import type { RaceEvent } from "@/lib/types";

export default async function TrackEventsPage({ params }: PageProps<"/admin/t/[trackId]">) {
  const { trackId } = await params;
  const { supabase, track } = await requireTrack(trackId);
  const [{ data: events }, { count: classCount }] = await Promise.all([
    supabase
      .from("events")
      .select("id, slug, title, event_date, gates_open, racing_starts, status")
      .eq("track_id", track.id)
      .order("event_date")
      .returns<Pick<RaceEvent, "id" | "slug" | "title" | "event_date" | "gates_open" | "racing_starts" | "status">[]>(),
    supabase.from("classes").select("id", { count: "exact", head: true }).eq("track_id", track.id),
  ]);
  const today = todayIn(track.timezone);
  const upcoming = (events ?? []).filter((e) => e.event_date >= today);
  const past = (events ?? []).filter((e) => e.event_date < today).reverse();
  const base = `/admin/t/${track.id}`;

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="display text-3xl">Events</h2>
        <Link href={`${base}/events/new`} className="display bg-[#e10600] px-4 py-3 text-lg text-white hover:bg-[#c10500]">
          + New event card
        </Link>
      </div>

      {!classCount ? (
        <p className="border-l-4 border-neutral-950 bg-white p-3 text-sm">
          Tip: add your <Link href={`${base}/classes`} className="font-semibold underline">classes</Link> first so you
          can put them on event cards.
        </p>
      ) : null}

      {[
        ["Upcoming", upcoming],
        ["Past", past],
      ].map(([label, list]) =>
        (list as typeof upcoming).length ? (
          <section key={label as string}>
            <h3 className="display mb-2 text-lg tracking-[0.2em] text-neutral-500">{label as string}</h3>
            <ul className="grid gap-2">
              {(list as typeof upcoming).map((e) => {
                const p = dateParts(e.event_date);
                return (
                  <li key={e.id}>
                    <Link
                      href={`${base}/events/${e.id}`}
                      className="flex items-center gap-3 border-2 border-neutral-950 bg-white p-2 hover:bg-neutral-50"
                    >
                      <span className="display flex w-14 shrink-0 flex-col items-center bg-neutral-950 py-1 text-white">
                        <span className="text-xs">{p.dow}</span>
                        <span className="text-3xl">{p.day}</span>
                        <span className="text-xs">{p.mon}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="display block truncate text-xl">{e.title}</span>
                        <span className="block text-sm text-neutral-500">
                          {[e.gates_open && `Gates ${shortTime(e.gates_open)}`, e.racing_starts && `Racing ${shortTime(e.racing_starts)}`]
                            .filter(Boolean)
                            .join(" · ") || "No times yet"}
                        </span>
                      </span>
                      <span className="shrink-0 [--ink:#0a0a0a] [--paper:#fff]">
                        <StatusFlag status={e.status} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null,
      )}

      {!events?.length ? (
        <div className="border-2 border-dashed border-neutral-400 bg-white p-8 text-center">
          <p className="text-lg">No events yet.</p>
          <p className="mt-1 text-neutral-600">
            An event card is the one place you enter a race night. Everything else is generated from it.
          </p>
        </div>
      ) : null}
    </div>
  );
}
