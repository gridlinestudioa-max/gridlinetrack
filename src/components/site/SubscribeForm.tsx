"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/app/sites/[slug]/actions";

export function SubscribeForm({ trackId, trackName }: { trackId: string; trackName: string }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe.bind(null, trackId), {
    status: "idle",
  });

  return (
    <div className="grid gap-4 border-4 border-ink p-6 sm:grid-cols-[1fr_1.2fr] sm:items-center sm:p-8">
      <div>
        <h2 className="display text-4xl sm:text-5xl">Race night alerts</h2>
        <p className="mt-2 opacity-80">Schedule changes, rain-outs and specials from {trackName}. No spam.</p>
      </div>
      {state.status === "ok" ? (
        <p className="display text-2xl" role="status">
          You&rsquo;re on the list. See you at the track.
        </p>
      ) : (
        <form action={action} className="grid gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="subscribe-email" className="sr-only">
              Email address
            </label>
            <input
              id="subscribe-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="min-h-12 flex-1 border-2 border-ink bg-paper px-3 text-lg text-ink"
            />
            {/* Honeypot: real people never see or fill this. */}
            <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <button
              disabled={pending}
              className="display min-h-12 bg-ink px-6 text-xl text-paper hover:opacity-80 disabled:opacity-60"
            >
              {pending ? "Adding…" : "Sign me up"}
            </button>
          </div>
          {state.status === "error" ? (
            <p className="text-sm font-bold" role="alert">
              {state.message}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
