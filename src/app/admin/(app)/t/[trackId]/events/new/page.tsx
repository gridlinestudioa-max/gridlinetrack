import type { Metadata } from "next";
import { requireTrack } from "@/lib/admin";
import type { RaceClass } from "@/lib/types";
import { EventCardForm } from "../EventCardForm";

export const metadata: Metadata = { title: "New event — Gridline Track" };

export default async function NewEventPage({ params }: PageProps<"/admin/t/[trackId]/events/new">) {
  const { trackId } = await params;
  const { supabase, track } = await requireTrack(trackId);
  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .eq("track_id", track.id)
    .order("sort_order")
    .returns<RaceClass[]>();

  return (
    <>
      <h2 className="display mb-4 text-3xl">New event card</h2>
      <EventCardForm trackId={track.id} event={null} classes={classes ?? []} trackBase={`/admin/t/${track.id}`} />
    </>
  );
}
