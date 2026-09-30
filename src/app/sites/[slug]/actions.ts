"use server";

import { createPublicClient } from "@/lib/supabase/public";

export type SubscribeState = { status: "idle" | "ok" } | { status: "error"; message: string };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function subscribe(trackId: string, _prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  // Bots fill every field; pretend it worked.
  if (String(formData.get("company") ?? "")) return { status: "ok" };

  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL.test(email) || email.length > 254) {
    return { status: "error", message: "That email address doesn’t look right." };
  }

  // RLS only accepts sign-ups for published tracks.
  const { error } = await createPublicClient()
    .from("subscribers")
    .insert({ track_id: trackId, email, source: "website" });

  // 23505 = already subscribed. Don't reveal whether an address is on the list.
  if (error && error.code !== "23505") {
    return { status: "error", message: "Couldn’t sign you up just now. Please try again." };
  }
  return { status: "ok" };
}
