"use client";

import { useFormStatus } from "react-dom";

export const inputClass =
  "block w-full min-h-12 rounded-none border-2 border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 focus:border-neutral-900 focus:outline-none";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-neutral-800">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm font-medium text-black" id={`${htmlFor}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "bg-neutral-950 text-white hover:bg-neutral-800",
    secondary: "border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-100",
    danger: "border-2 border-black text-black hover:bg-neutral-100",
  }[variant];
  return (
    <button
      type="submit"
      disabled={pending}
      className={`display min-h-12 px-5 text-lg disabled:opacity-60 ${styles} ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: { ok?: boolean; message?: string; error?: string } }) {
  if (state.error) {
    return (
      <p role="alert" className="border-l-4 border-black bg-neutral-100 px-3 py-2 text-sm text-black">
        {state.error}
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p role="status" className="border-l-4 border-black bg-neutral-100 px-3 py-2 text-sm text-black">
        {state.message}
      </p>
    );
  }
  return null;
}

/** Submit button that asks for confirmation first (for destructive actions). */
export function ConfirmButton({
  message,
  children,
  className = "",
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
