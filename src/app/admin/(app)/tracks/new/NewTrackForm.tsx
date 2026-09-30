"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton, inputClass } from "@/components/admin/ui";
import type { ActionState } from "@/lib/admin";
import { slugify } from "@/lib/tenant";
import { US_TIMEZONES } from "@/lib/timezones";
import { createTrack } from "./actions";


export function NewTrackForm({ rootDomain }: { rootDomain: string }) {
  const [state, action] = useActionState<ActionState, FormData>(createTrack, {});
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const shownSlug = slugTouched ? slug : slugify(name, 32);

  return (
    <form action={action} className="grid gap-5">
      <Field label="Track name" htmlFor="name" error={state.fieldErrors?.name}>
        <input
          id="name"
          name="name"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Eagle Raceway"
          className={inputClass}
        />
      </Field>
      <Field
        label="Web address"
        htmlFor="slug"
        error={state.fieldErrors?.slug}
        hint="Lowercase letters, numbers and hyphens. You can add a custom domain later."
      >
        <div className="flex items-stretch">
          <input
            id="slug"
            name="slug"
            required
            value={shownSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            pattern="[a-z0-9][a-z0-9\-]{1,30}[a-z0-9]"
            className={`${inputClass} min-w-0 flex-1`}
          />
          <span className="flex items-center border-2 border-l-0 border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-600">
            .{rootDomain}
          </span>
        </div>
      </Field>
      <Field label="Time zone" htmlFor="timezone" hint="Race times are shown in this zone.">
        <select id="timezone" name="timezone" defaultValue="America/Chicago" className={inputClass}>
          {US_TIMEZONES.map(([tz, label]) => (
            <option key={tz} value={tz}>
              {label} — {tz}
            </option>
          ))}
        </select>
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingText="Creating…">Create track</SubmitButton>
    </form>
  );
}
