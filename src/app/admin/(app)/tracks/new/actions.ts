"use server";

import { redirect } from "next/navigation";
import { dbErrorMessage, requireUser, type ActionState } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { isValidSlug } from "@/lib/tenant";

export async function createTrack(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const timezone = String(formData.get("timezone") ?? "America/Chicago");

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2 || name.length > 120) fieldErrors.name = "Enter the track’s name.";
  if (!isValidSlug(slug)) {
    fieldErrors.slug = "3–32 characters: lowercase letters, numbers and hyphens. Some words are reserved.";
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_track", {
    p_slug: slug,
    p_name: name,
    p_timezone: timezone,
  });
  if (error) {
    if (error.code === "23505") return { fieldErrors: { slug: "That web address is taken." } };
    if (error.message.includes("track limit")) return { error: "You’ve reached the track limit for one account." };
    return { error: dbErrorMessage(error, "Couldn’t create the track.") };
  }
  redirect(`/admin/t/${data as string}/brand?welcome=1`);
}
