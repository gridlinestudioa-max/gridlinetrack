import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/admin";
import { tenantSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Track } from "@/lib/types";

export const metadata: Metadata = { title: "Your tracks — Gridline Track" };

export default async function AdminHome() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("track_members")
    .select("role, tracks(id, slug, name, city, region, published)")
    .eq("user_id", user.id)
    .returns<{ role: string; tracks: Pick<Track, "id" | "slug" | "name" | "city" | "region" | "published"> }[]>();
  const tracks = (data ?? []).map((m) => m.tracks).filter(Boolean);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="display text-4xl sm:text-5xl">Your tracks</h1>
        <Link href="/admin/tracks/new" className="display bg-neutral-950 px-4 py-3 text-lg text-white hover:bg-neutral-800">
          + New track
        </Link>
      </div>

      {tracks.length === 0 ? (
        <div className="mt-8 border-2 border-dashed border-neutral-400 bg-white p-8 text-center">
          <p className="text-lg">You haven&rsquo;t set up a track yet.</p>
          <Link href="/admin/tracks/new" className="display mt-4 inline-block text-xl underline underline-offset-4">
            Create your track →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {tracks.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 border-2 border-neutral-950 bg-white p-4">
              <Link href={`/admin/t/${t.id}`} className="min-w-0 flex-1">
                <span className="display block truncate text-2xl">{t.name}</span>
                <span className="block truncate text-sm text-neutral-500">
                  {tenantSiteUrl(t.slug).replace(/^https?:\/\//, "")}
                  {t.city ? ` · ${[t.city, t.region].filter(Boolean).join(", ")}` : ""}
                </span>
              </Link>
              <span
                className={`display shrink-0 px-2 py-1 text-xs tracking-widest ${
                  t.published ? "bg-black text-white" : "border-2 border-dashed border-neutral-400 text-neutral-500"
                }`}
              >
                {t.published ? "Live" : "Not live"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
