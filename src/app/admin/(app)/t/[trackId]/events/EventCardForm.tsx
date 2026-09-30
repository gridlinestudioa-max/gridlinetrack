"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton, inputClass } from "@/components/admin/ui";
import type { ActionState } from "@/lib/admin";
import { STATUS_LABELS } from "@/lib/brand";
import { slugify } from "@/lib/tenant";
import type { AdmissionLine, EventCard, EventStatus, RaceClass } from "@/lib/types";
import { saveEvent } from "../actions";

type Special = { key: number; title: string; details: string };
type Admission = AdmissionLine & { key: number };

const DEFAULT_ADMISSION: AdmissionLine[] = [
  { label: "Adults", price: "" },
  { label: "Kids 12 & under", price: "" },
  { label: "Pit pass", price: "" },
];

// Outbound links on the card. Each falls back to the track's default when blank.
const LINK_FIELDS = [
  ["tickets_url", "Tickets link"],
  ["registration_url", "Driver registration link"],
  ["results_url", "Results link"],
  ["livestream_url", "Livestream link"],
] as const;

let nextKey = 0;
const key = () => ++nextKey;

function Section({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4 border-2 border-neutral-950 bg-white p-4 sm:p-5">
      <legend className="display bg-neutral-950 px-2 text-lg tracking-wider text-white">{title}</legend>
      {hint ? <p className="-mt-2 text-sm text-neutral-500">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

export function EventCardForm({
  trackId,
  event,
  classes,
  trackBase,
}: {
  trackId: string;
  event: EventCard | null;
  classes: RaceClass[];
  trackBase: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(
    saveEvent.bind(null, trackId, event?.id ?? null),
    {},
  );
  const err = state.fieldErrors ?? {};

  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.event_date ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(event));
  const shownSlug = slugTouched ? slug : slugify(`${title}-${date}`, 80);

  const onCard = new Map(event?.event_classes.map((c) => [c.class_id, c]) ?? []);
  const [selected, setSelected] = useState<Set<string>>(new Set(onCard.keys()));
  const [feature, setFeature] = useState(event?.event_classes.find((c) => c.is_feature)?.class_id ?? "");

  const [specials, setSpecials] = useState<Special[]>(
    (event?.event_specials ?? []).map((s) => ({ key: key(), title: s.title, details: s.details ?? "" })),
  );
  const [admission, setAdmission] = useState<Admission[]>(
    (event?.admission.length ? event.admission : DEFAULT_ADMISSION).map((a) => ({ ...a, key: key() })),
  );

  // Put classes already on the card first, in their card order.
  const orderedClasses = [...classes].sort((a, b) => {
    const ai = onCard.get(a.id)?.sort_order ?? 1000 + a.sort_order;
    const bi = onCard.get(b.id)?.sort_order ?? 1000 + b.sort_order;
    return ai - bi;
  });

  return (
    <form action={action} className="grid gap-6">
      <Section title="The basics">
        <Field label="Event name" htmlFor="title" error={err.title}>
          <input
            id="title"
            name="title"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Fan Appreciation Night"
            className={inputClass}
          />
        </Field>
        <Field label="Tagline" htmlFor="subtitle" hint="Optional. e.g. “Season points night 18”">
          <input id="subtitle" name="subtitle" maxLength={160} defaultValue={event?.subtitle ?? ""} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="event_date" error={err.event_date}>
            <input
              id="event_date"
              name="event_date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Status" htmlFor="status" error={err.status}>
            <select id="status" name="status" defaultValue={event?.status ?? "draft"} className={inputClass}>
              {(Object.keys(STATUS_LABELS) as EventStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s === "draft" ? "Draft (hidden from site)" : STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Times" hint="Local to the track.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              ["gates_open", "Gates open"],
              ["hot_laps", "Hot laps"],
              ["racing_starts", "Racing starts"],
            ] as const
          ).map(([name, label]) => (
            <Field key={name} label={label} htmlFor={name} error={err[name]}>
              <input
                id={name}
                name={name}
                type="time"
                step={300}
                defaultValue={event?.[name]?.slice(0, 5) ?? ""}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
        <Field label="Rain date" htmlFor="rain_date" hint="Optional. Shown if the event is postponed or rained out." error={err.rain_date}>
          <input id="rain_date" name="rain_date" type="date" defaultValue={event?.rain_date ?? ""} className={inputClass} />
        </Field>
      </Section>

      <Section title="On the card" hint="Tick the classes racing. Mark one as the feature.">
        {classes.length === 0 ? (
          <p className="text-sm">
            No classes yet.{" "}
            <Link href={`${trackBase}/classes`} className="font-semibold underline">
              Add your classes
            </Link>{" "}
            and they&rsquo;ll show up here.
          </p>
        ) : (
          <ul className="grid gap-2">
            {orderedClasses.map((c) => {
              const checked = selected.has(c.id);
              return (
                <li key={c.id} className={`border-2 p-3 ${checked ? "border-neutral-950" : "border-neutral-200"}`}>
                  <label className="flex min-h-10 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      name="class_id"
                      value={c.id}
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(c.id);
                        else {
                          next.delete(c.id);
                          if (feature === c.id) setFeature("");
                        }
                        setSelected(next);
                      }}
                      className="size-5 accent-neutral-950"
                    />
                    <span className="display text-xl">{c.name}</span>
                    {c.short_name ? <span className="text-sm text-neutral-500">{c.short_name}</span> : null}
                  </label>
                  {checked ? (
                    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                      <input
                        name={`purse_${c.id}`}
                        aria-label={`${c.name} purse`}
                        defaultValue={onCard.get(c.id)?.purse ?? ""}
                        maxLength={80}
                        placeholder="Purse, e.g. $1,000 to win (optional)"
                        className={inputClass}
                      />
                      <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
                        <input
                          type="radio"
                          name="feature"
                          value={c.id}
                          checked={feature === c.id}
                          onChange={() => setFeature(c.id)}
                          className="size-5 accent-black"
                        />
                        Feature
                      </label>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Specials" hint="Promos for the night: fireworks, kids ride free, $2 hot dogs…">
        {specials.map((s, i) => (
          <div key={s.key} className="grid gap-2 border-l-4 border-black pl-3">
            <div className="flex gap-2">
              <input
                name="special_title"
                aria-label={`Special ${i + 1} title`}
                value={s.title}
                maxLength={100}
                onChange={(e) => setSpecials(specials.map((x) => (x.key === s.key ? { ...x, title: e.target.value } : x)))}
                placeholder="Fireworks"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setSpecials(specials.filter((x) => x.key !== s.key))}
                className="min-h-12 shrink-0 border-2 border-neutral-300 px-3 text-sm font-semibold hover:border-black hover:text-black"
                aria-label={`Remove special ${i + 1}`}
              >
                Remove
              </button>
            </div>
            <input
              name="special_details"
              aria-label={`Special ${i + 1} details`}
              value={s.details}
              maxLength={500}
              onChange={(e) => setSpecials(specials.map((x) => (x.key === s.key ? { ...x, details: e.target.value } : x)))}
              placeholder="Details (optional)"
              className={inputClass}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSpecials([...specials, { key: key(), title: "", details: "" }])}
          className="min-h-12 border-2 border-dashed border-neutral-400 font-semibold hover:border-neutral-950"
        >
          + Add a special
        </button>
      </Section>

      <Section title="Admission" hint="Leave a price blank to hide that line. Prices are free text, so “FREE” works.">
        {admission.map((a, i) => (
          <div key={a.key} className="grid grid-cols-[1fr_7rem_auto] gap-2">
            <input
              name="admission_label"
              aria-label={`Admission ${i + 1} label`}
              value={a.label}
              maxLength={60}
              onChange={(e) => setAdmission(admission.map((x) => (x.key === a.key ? { ...x, label: e.target.value } : x)))}
              placeholder="Adults"
              className={inputClass}
            />
            <input
              name="admission_price"
              aria-label={`Admission ${i + 1} price`}
              value={a.price}
              maxLength={20}
              onChange={(e) => setAdmission(admission.map((x) => (x.key === a.key ? { ...x, price: e.target.value } : x)))}
              placeholder="$15"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setAdmission(admission.filter((x) => x.key !== a.key))}
              className="min-h-12 border-2 border-neutral-300 px-3 text-sm font-semibold hover:border-black hover:text-black"
              aria-label={`Remove admission line ${i + 1}`}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setAdmission([...admission, { key: key(), label: "", price: "" }])}
          className="min-h-12 border-2 border-dashed border-neutral-400 font-semibold hover:border-neutral-950"
        >
          + Add a price
        </button>
      </Section>

      <Section title="Details & links" hint="Links go out to your ticketing, registration, results or streaming provider.">
        <Field label="Description" htmlFor="description" hint="Blank lines start a new paragraph.">
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={event?.description ?? ""}
            className={`${inputClass} py-2`}
          />
        </Field>
        {LINK_FIELDS.map(([name, label]) => (
          <Field key={name} label={label} htmlFor={name} error={err[name]} hint="Leave blank to use the track’s default.">
            <input
              id={name}
              name={name}
              type="url"
              inputMode="url"
              defaultValue={event?.[name] ?? ""}
              placeholder="https://"
              className={inputClass}
            />
          </Field>
        ))}
        <Field label="Page address" htmlFor="slug" error={err.slug} hint={`…/events/${shownSlug || "event-name"}`}>
          <input
            id="slug"
            name="slug"
            value={shownSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            className={inputClass}
          />
        </Field>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-neutral-950 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl gap-2 px-4 py-3">
          <FormMessage state={state} />
          <SubmitButton pendingText="Saving…">{event ? "Save event card" : "Create event card"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
