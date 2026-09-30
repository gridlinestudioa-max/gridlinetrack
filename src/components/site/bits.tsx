import { STATUS_LABELS } from "@/lib/brand";
import { dateParts, timeParts } from "@/lib/dates";
import type { EventStatus } from "@/lib/types";

/** Stacked date: SAT / 12 / OCT — the pit board's signature element. */
export function DateBlock({ date, size = "lg" }: { date: string; size?: "sm" | "lg" }) {
  const p = dateParts(date);
  const big = size === "lg";
  return (
    <div
      className={`display flex flex-col items-center justify-center bg-brand text-on-brand ${
        big ? "w-24 shrink-0 py-3 sm:w-36 sm:py-4" : "w-16 shrink-0 py-2"
      }`}
    >
      <span className={big ? "text-xl sm:text-2xl" : "text-sm"}>{p.dow}</span>
      <span className={big ? "text-5xl sm:text-7xl" : "text-4xl"}>{p.day}</span>
      <span className={big ? "text-xl sm:text-2xl" : "text-sm"}>{p.mon}</span>
    </div>
  );
}

/** GATES 4:00 PM | HOT LAPS 6:00 PM | RACING 7:00 PM */
export function TimeBoard({
  times,
}: {
  times: { label: string; value: string | null }[];
}) {
  const shown = times.filter((t) => t.value);
  if (shown.length === 0) return null;
  return (
    <dl className="grid grid-cols-3 border-2 border-ink">
      {shown.map((t, i) => {
        const tp = timeParts(t.value)!;
        return (
          <div key={t.label} className={`p-3 sm:p-4 ${i > 0 ? "border-l-2 border-ink" : ""}`}>
            <dt className="display text-xs opacity-70 sm:text-sm">{t.label}</dt>
            <dd className="display mt-1 text-2xl sm:text-4xl">
              {tp.time}
              <span className="ml-1 text-base text-accent-text sm:text-xl">{tp.period}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

const FLAG_STYLES: Record<EventStatus, string> = {
  draft: "border-2 border-dashed border-current",
  scheduled: "border-2 border-current",
  postponed: "border-2 border-current",
  rained_out: "border-2 border-current",
  cancelled: "bg-ink text-paper",
  completed: "bg-ink text-paper",
};

export function StatusFlag({ status }: { status: EventStatus }) {
  return (
    <span className={`display inline-block px-2 py-1 text-xs ${FLAG_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function SectionHeading({ kicker, children }: { kicker?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end gap-3 border-b-4 border-ink pb-2">
      <h2 className="display text-4xl sm:text-5xl">{children}</h2>
      {kicker ? <span className="display mb-1 text-sm text-brand-text">{kicker}</span> : null}
    </div>
  );
}

export function ExternalButton({
  href,
  children,
  variant = "brand",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "brand" | "outline";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`display inline-flex min-h-12 items-center gap-2 px-5 py-3 text-lg ${
        variant === "brand"
          ? "bg-brand text-on-brand hover:brightness-110"
          : "border-2 border-ink hover:bg-ink hover:text-paper"
      }`}
    >
      {children}
      <span aria-hidden>↗</span>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function countdownLabel(days: number) {
  if (days === 0) return "Tonight";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

/** Only allow http(s) links out; anything else is dropped. */
export function safeHref(url: string | null | undefined) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
