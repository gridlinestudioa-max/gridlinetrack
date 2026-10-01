import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ui";
import { requireTrack } from "@/lib/admin";
import { EVENT_CARD_SELECT } from "@/lib/site-data";
import type { EventCard, RaceClass } from "@/lib/types";
import { deleteEvent } from "../../actions";
import { EventCardForm } from "../EventCardForm";
import { FlyerPanel } from "./FlyerPanel";

export const metadata: Metadata = { title: "Edit event — Gridline Track" };

export default async function EditEventPage({ params, searchParams }: PageProps<"/admin/t/[trackId]/events/[eventId]">) {
  const { trackId, eventId } = await params;
  const { saved } = await searchParams;
  const { supabase, track } = await requireTrack(trackId);
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) notFound();

  const [{ data: event }, { data: classes }] = await Promise.all([
    supabase.from("events").select(EVENT_CARD_SELECT).eq("id", eventId).eq("track_id", track.id).maybeSingle<EventCard>(),
    supabase.from("classes").select("*").eq("track_id", track.id).order("sort_order").returns<RaceClass[]>(),
  ]);
  if (!event) notFound();
  event.event_classes.sort((a, b) => a.sort_order - b.sort_order);
  event.event_specials.sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="display text-3xl">Edit event card</h2>
        <Link
          href={`/admin/preview/${track.id}/events/${event.slug}`}
          className="border-2 border-neutral-950 px-3 py-2 text-sm font-semibold hover:bg-neutral-100"
        >
          Preview page
        </Link>
      </div>
      {saved ? (
        <p role="status" className="mb-4 border-l-4 border-black bg-neutral-100 px-3 py-2 text-sm text-black">
          Event card created.{event.status === "draft" ? " It’s a draft — set a status to show it on your site." : ""}
        </p>
      ) : null}
      <div className="mb-6">
        <FlyerPanel trackId={track.id} event={event} />
      </div>
      <EventCardForm trackId={track.id} event={event} classes={classes ?? []} trackBase={`/admin/t/${track.id}`} />
      <form action={deleteEvent.bind(null, track.id, event.id)} className="mt-10 border-t-2 border-neutral-300 pt-6">
        <ConfirmButton
          message={`Delete “${event.title}”? This can’t be undone.`}
          className="min-h-12 border-2 border-black px-4 font-semibold text-black hover:bg-neutral-100"
        >
          Delete this event
        </ConfirmButton>
      </form>
    </>
  );
}
