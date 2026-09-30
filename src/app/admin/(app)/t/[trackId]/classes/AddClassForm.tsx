"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton, inputClass } from "@/components/admin/ui";
import type { ActionState } from "@/lib/admin";
import { addClass } from "../actions";

export function AddClassForm({ trackId }: { trackId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(addClass.bind(null, trackId), {});
  return (
    <form
      action={action}
      className="grid gap-3 border-2 border-neutral-950 bg-white p-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
    >
      <Field label="Class name" htmlFor="new-name" error={state.fieldErrors?.name}>
        <input id="new-name" name="name" required maxLength={80} placeholder="Late Models" className={inputClass} />
      </Field>
      <Field label="Short" htmlFor="new-short" error={state.fieldErrors?.short_name}>
        <input id="new-short" name="short_name" maxLength={16} placeholder="LM" className={`${inputClass} uppercase`} />
      </Field>
      <SubmitButton pendingText="Adding…">Add class</SubmitButton>
      <div className="sm:col-span-3">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
