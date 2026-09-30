import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Track } from "@/lib/types";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/admin/login");
  return user;
}

/**
 * The track the signed-in user manages, or 404. Membership is checked
 * explicitly: RLS also lets anyone read *published* tracks, so "can select the
 * row" is not the same as "can manage it".
 */
export const requireTrack = cache(async (trackId: string) => {
  const user = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(trackId)) notFound();
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("track_members")
    .select("role, tracks(*)")
    .eq("track_id", trackId)
    .eq("user_id", user.id)
    .maybeSingle<{ role: "owner" | "editor"; tracks: Track }>();
  if (!membership?.tracks) notFound();
  return { supabase, user, track: membership.tracks, role: membership.role };
});

export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/** Friendlier text for the Postgres errors users can actually trigger. */
export function dbErrorMessage(error: { code?: string; message?: string } | null, fallback = "Something went wrong.") {
  if (!error) return fallback;
  if (error.code === "23505") return "That’s already taken.";
  if (error.code === "23514") return "One of the values isn’t allowed.";
  if (error.code === "42501") return "You don’t have permission to do that.";
  return fallback;
}
