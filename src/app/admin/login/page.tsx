import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in — Gridline Track" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next, error } = await searchParams;
  if (isSupabaseConfigured() && (await getUser())) redirect("/admin");

  return (
    <main className="min-h-dvh bg-neutral-100">
      <div className="mx-auto max-w-md px-4 py-12">
        <p className="display text-sm tracking-[0.3em] text-black">Gridline Track</p>
        <h1 className="display mt-2 text-5xl">Track admin</h1>
        {!isSupabaseConfigured() ? (
          <p className="mt-6 border-l-4 border-black bg-neutral-100 p-3 text-sm">
            Supabase isn&rsquo;t configured. Copy <code>.env.example</code> to <code>.env.local</code> and fill it in.
          </p>
        ) : (
          <div className="mt-8 border-2 border-neutral-950 bg-white p-5">
            {error ? (
              <p role="alert" className="mb-4 border-l-4 border-black bg-neutral-100 px-3 py-2 text-sm text-black">
                That sign-in link didn&rsquo;t work. Try signing in again.
              </p>
            ) : null}
            <LoginForm next={typeof next === "string" ? next : undefined} />
          </div>
        )}
      </div>
    </main>
  );
}
