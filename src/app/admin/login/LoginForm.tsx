"use client";

import { useActionState } from "react";
import { Field, FormMessage, inputClass } from "@/components/admin/ui";
import type { ActionState } from "@/lib/admin";
import { authenticate } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(authenticate, {});
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next ?? "/admin"} />
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password" error={state.fieldErrors?.password}>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </Field>
      <FormMessage state={state} />
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="submit" name="intent" value="signin" className="display min-h-12 bg-neutral-950 px-5 text-lg text-white hover:bg-neutral-800">
          Sign in
        </button>
        <button type="submit" name="intent" value="signup" className="display min-h-12 border-2 border-neutral-950 px-5 text-lg hover:bg-neutral-100">
          Create account
        </button>
      </div>
    </form>
  );
}
