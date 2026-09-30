import type { Metadata } from "next";
import { ConfirmButton, SubmitButton, inputClass } from "@/components/admin/ui";
import { requireTrack } from "@/lib/admin";
import type { RaceClass } from "@/lib/types";
import { deleteClass, moveClass, updateClass } from "../actions";
import { AddClassForm } from "./AddClassForm";

export const metadata: Metadata = { title: "Classes — Gridline Track" };

export default async function ClassesPage({ params }: PageProps<"/admin/t/[trackId]/classes">) {
  const { trackId } = await params;
  const { supabase, track } = await requireTrack(trackId);
  const { data } = await supabase
    .from("classes")
    .select("*")
    .eq("track_id", track.id)
    .order("sort_order")
    .order("name")
    .returns<RaceClass[]>();
  const classes = data ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="display text-3xl">Classes</h2>
        <p className="mt-1 text-neutral-600">The divisions you run. The short name shows on schedules and graphics.</p>
      </div>

      <AddClassForm trackId={track.id} />

      {classes.length ? (
        <ol className="grid gap-2">
          {classes.map((c, i) => (
            <li key={c.id} className="grid gap-2 border-2 border-neutral-950 bg-white p-3">
              <form action={updateClass.bind(null, track.id, c.id)} className="grid grid-cols-[1fr_6rem] gap-2 sm:grid-cols-[1fr_7rem_auto]">
                <input name="name" aria-label="Class name" defaultValue={c.name} required maxLength={80} className={inputClass} />
                <input
                  name="short_name"
                  aria-label="Short name"
                  defaultValue={c.short_name ?? ""}
                  maxLength={16}
                  className={`${inputClass} uppercase`}
                />
                <SubmitButton variant="secondary" className="col-span-2 sm:col-span-1">
                  Save
                </SubmitButton>
              </form>
              <div className="flex gap-2 text-sm font-semibold">
                <form action={moveClass.bind(null, track.id, c.id, "up")}>
                  <button disabled={i === 0} className="min-h-10 border-2 border-neutral-300 px-3 disabled:opacity-30" aria-label={`Move ${c.name} up`}>
                    ↑
                  </button>
                </form>
                <form action={moveClass.bind(null, track.id, c.id, "down")}>
                  <button
                    disabled={i === classes.length - 1}
                    className="min-h-10 border-2 border-neutral-300 px-3 disabled:opacity-30"
                    aria-label={`Move ${c.name} down`}
                  >
                    ↓
                  </button>
                </form>
                <form action={deleteClass.bind(null, track.id, c.id)} className="ml-auto">
                  <ConfirmButton
                    message={`Delete ${c.name}? It will be removed from every event card.`}
                    className="min-h-10 px-3 text-red-700 underline underline-offset-4"
                  >
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-2 border-dashed border-neutral-400 bg-white p-6 text-center">No classes yet.</p>
      )}
    </div>
  );
}
