"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

export async function authenticate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const intent = formData.get("intent") === "signup" ? "signup" : "signin";
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Enter your email and a password." };
  if (intent === "signup" && password.length < 8) {
    return { fieldErrors: { password: "Use at least 8 characters." } };
  }

  const supabase = await createClient();

  if (intent === "signin") {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "Email or password is incorrect." };
    redirect(next);
  }

  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: error.message };
  // With email confirmation off (the local Supabase default) we get a session immediately.
  if (data.session) redirect(next);
  return { ok: true, message: "Check your email for a confirmation link, then sign in." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
