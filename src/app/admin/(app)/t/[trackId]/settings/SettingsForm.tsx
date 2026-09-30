"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton, inputClass } from "@/components/admin/ui";
import type { ActionState } from "@/lib/admin";
import { US_TIMEZONES } from "@/lib/timezones";
import type { Track } from "@/lib/types";
import { updateSettings } from "../actions";

const LINKS = [
  ["tickets_url", "Tickets", "Your ticketing provider’s page for the track."],
  ["registration_url", "Driver registration", "Where drivers pre-register. Used when an event has no link of its own."],
  ["livestream_url", "Livestream", "Where fans watch online."],
  ["results_url", "Results", "Where you post results and points. Used when an event has no link of its own."],
  ["facebook_url", "Facebook", ""],
  ["instagram_url", "Instagram", ""],
  ["tiktok_url", "TikTok", ""],
  ["youtube_url", "YouTube", ""],
] as const;

export function SettingsForm({ track, siteUrl }: { track: Track; siteUrl: string }) {
  const [state, action] = useActionState<ActionState, FormData>(updateSettings.bind(null, track.id), {});
  const err = state.fieldErrors ?? {};
  const timezones = US_TIMEZONES.some(([tz]) => tz === track.timezone)
    ? US_TIMEZONES
    : ([[track.timezone, track.timezone], ...US_TIMEZONES] as const);

  return (
    <form action={action} className="grid gap-6">
      <fieldset className="grid gap-3 border-2 border-neutral-950 bg-white p-4 sm:p-5">
        <legend className="display bg-neutral-950 px-2 text-lg tracking-wider text-white">Site status</legend>
        <label className="flex min-h-12 cursor-pointer items-center gap-3">
          <input type="checkbox" name="published" defaultChecked={track.published} className="size-6 accent-black" />
          <span>
            <span className="block font-semibold">Site is live</span>
            <span className="block text-sm text-neutral-500">
              Visible at <span className="font-mono">{siteUrl.replace(/^https?:\/\//, "")}</span>. Draft events stay hidden.
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset className="grid gap-4 border-2 border-neutral-950 bg-white p-4 sm:p-5">
        <legend className="display bg-neutral-950 px-2 text-lg tracking-wider text-white">Track</legend>
        <Field label="Track name" htmlFor="name" error={err.name}>
          <input id="name" name="name" required maxLength={120} defaultValue={track.name} className={inputClass} />
        </Field>
        <Field label="Tagline" htmlFor="tagline" error={err.tagline} hint="e.g. “3/8-mile high-banked clay. Saturday nights since 1968.”">
          <input id="tagline" name="tagline" maxLength={160} defaultValue={track.tagline ?? ""} className={inputClass} />
        </Field>
        <Field label="Street address" htmlFor="address" hint="Used for the Directions link.">
          <input id="address" name="address" defaultValue={track.address ?? ""} autoComplete="street-address" className={inputClass} />
        </Field>
        <div className="grid grid-cols-[1fr_6rem] gap-4">
          <Field label="City" htmlFor="city">
            <input id="city" name="city" defaultValue={track.city ?? ""} className={inputClass} />
          </Field>
          <Field label="State" htmlFor="region">
            <input id="region" name="region" maxLength={40} defaultValue={track.region ?? ""} className={inputClass} />
          </Field>
        </div>
        <Field label="Time zone" htmlFor="timezone" error={err.timezone}>
          <select id="timezone" name="timezone" defaultValue={track.timezone} className={inputClass}>
            {timezones.map(([tz, label]) => (
              <option key={tz} value={tz}>
                {label} — {tz}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" htmlFor="phone">
            <input id="phone" name="phone" type="tel" defaultValue={track.phone ?? ""} className={inputClass} />
          </Field>
          <Field label="Public email" htmlFor="email" error={err.email}>
            <input id="email" name="email" type="email" defaultValue={track.email ?? ""} className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 border-2 border-neutral-950 bg-white p-4 sm:p-5">
        <legend className="display bg-neutral-950 px-2 text-lg tracking-wider text-white">Links</legend>
        <p className="-mt-2 text-sm text-neutral-500">
          We link out to these; we never copy data from other platforms.
        </p>
        {LINKS.map(([name, label, hint]) => (
          <Field key={name} label={label} htmlFor={name} hint={hint || undefined} error={err[name]}>
            <input
              id={name}
              name={name}
              type="url"
              inputMode="url"
              placeholder="https://"
              defaultValue={track[name] ?? ""}
              className={inputClass}
            />
          </Field>
        ))}
      </fieldset>

      <p className="text-sm text-neutral-500">
        Web address: <span className="font-mono">{track.slug}</span> (can&rsquo;t be changed here yet).
      </p>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-neutral-950 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl gap-2 px-4 py-3">
          <FormMessage state={state} />
          <SubmitButton>Save settings</SubmitButton>
        </div>
      </div>
    </form>
  );
}
