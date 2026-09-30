"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton, inputClass } from "@/components/admin/ui";
import type { ActionState } from "@/lib/admin";
import { FONT_PAIRS, HEX_PATTERN, TEMPLATES, brandVars, contrastRatio } from "@/lib/brand";
import type { BrandKit, FontPairId } from "@/lib/types";
import { updateBrand } from "../actions";

type Fonts = Record<FontPairId, Record<string, string>>;

function ColorField({
  name,
  label,
  hint,
  value,
  onChange,
  error,
}: {
  name: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint} error={error}>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={HEX_PATTERN.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-12 w-14 shrink-0 cursor-pointer border-2 border-neutral-300 bg-white p-1"
        />
        <input
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          pattern="#[0-9A-Fa-f]{6}"
          maxLength={7}
          className={`${inputClass} font-mono uppercase`}
        />
      </div>
    </Field>
  );
}

export function BrandForm({
  trackId,
  trackName,
  brand,
  logoUrl,
  fonts,
}: {
  trackId: string;
  trackName: string;
  brand: BrandKit;
  logoUrl: string | null;
  fonts: Fonts;
}) {
  const [state, action] = useActionState<ActionState, FormData>(updateBrand.bind(null, trackId), {});
  const err = state.fieldErrors ?? {};
  const [primary, setPrimary] = useState(brand.primary_color);
  const [secondary, setSecondary] = useState(brand.secondary_color);
  const [accent, setAccent] = useState(brand.accent_color);
  const [fontPair, setFontPair] = useState<FontPairId>(brand.font_pair);
  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrl);
  const [removeLogo, setRemoveLogo] = useState(false);

  const valid = [primary, secondary, accent].every((c) => HEX_PATTERN.test(c));
  const vars = valid ? brandVars({ primary_color: primary, secondary_color: secondary, accent_color: accent }) : {};
  const checks = valid
    ? [
        ["Primary vs background", contrastRatio(primary, secondary)],
        ["Accent vs background", contrastRatio(accent, secondary)],
      ]
    : [];

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="grid gap-6">
        <fieldset className="grid gap-4 border-2 border-neutral-950 bg-white p-4 sm:p-5">
          <legend className="display bg-neutral-950 px-2 text-lg tracking-wider text-white">Logo</legend>
          <div className="flex items-center gap-4">
            <div className="grid size-24 shrink-0 place-items-center border-2 border-dashed border-neutral-300 bg-neutral-50">
              {logoPreview && !removeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Current logo" className="max-h-20 max-w-20 object-contain" />
              ) : (
                <span className="text-xs text-neutral-400">No logo</span>
              )}
            </div>
            <div className="grid min-w-0 gap-2">
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Upload logo"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setRemoveLogo(false);
                    setLogoPreview(URL.createObjectURL(file));
                  }
                }}
                className="text-sm file:mr-3 file:min-h-10 file:border-2 file:border-neutral-950 file:bg-white file:px-3 file:font-semibold"
              />
              <p className="text-sm text-neutral-500">PNG, JPG or WebP, up to 5 MB. Transparent PNG works best.</p>
              {logoUrl ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="remove_logo"
                    checked={removeLogo}
                    onChange={(e) => setRemoveLogo(e.target.checked)}
                    className="size-4"
                  />
                  Remove logo
                </label>
              ) : null}
            </div>
          </div>
          {err.logo ? <p className="text-sm font-medium text-red-700">{err.logo}</p> : null}
        </fieldset>

        <fieldset className="grid gap-4 border-2 border-neutral-950 bg-white p-4 sm:p-5">
          <legend className="display bg-neutral-950 px-2 text-lg tracking-wider text-white">Colours</legend>
          <ColorField name="primary_color" label="Primary" hint="Date blocks, buttons, stripes." value={primary} onChange={setPrimary} error={err.primary_color} />
          <ColorField name="secondary_color" label="Background" hint="Page background. Dark reads like a broadcast graphic." value={secondary} onChange={setSecondary} error={err.secondary_color} />
          <ColorField name="accent_color" label="Accent" hint="Ticker bar, numbers, highlights." value={accent} onChange={setAccent} error={err.accent_color} />
          {checks.length ? (
            <ul className="grid gap-1 text-sm">
              {checks.map(([label, ratio]) => (
                <li key={label as string} className={Number(ratio) >= 3 ? "text-green-800" : "text-amber-800"}>
                  {label}: {(ratio as number).toFixed(1)}:1{" "}
                  {Number(ratio) >= 3 ? "✓" : "— low contrast; we’ll use plain text colour where it needs to be read"}
                </li>
              ))}
            </ul>
          ) : null}
        </fieldset>

        <fieldset className="grid gap-3 border-2 border-neutral-950 bg-white p-4 sm:p-5">
          <legend className="display bg-neutral-950 px-2 text-lg tracking-wider text-white">Font pair</legend>
          {FONT_PAIRS.map((p) => (
            <label
              key={p.id}
              style={fonts[p.id]}
              className={`flex cursor-pointer items-center gap-3 border-2 p-3 ${
                fontPair === p.id ? "border-neutral-950 bg-neutral-50" : "border-neutral-200"
              }`}
            >
              <input
                type="radio"
                name="font_pair"
                value={p.id}
                checked={fontPair === p.id}
                onChange={() => setFontPair(p.id)}
                className="size-5 accent-neutral-950"
              />
              <span className="min-w-0">
                <span className="display block text-3xl">Sat 10.12 Feature</span>
                <span className="block text-sm text-neutral-600" style={{ fontFamily: "var(--site-body)" }}>
                  {p.label} — gates open at 4:00 PM
                </span>
              </span>
            </label>
          ))}
          {err.font_pair ? <p className="text-sm font-medium text-red-700">{err.font_pair}</p> : null}
        </fieldset>

        <fieldset className="grid gap-3 border-2 border-neutral-950 bg-white p-4 sm:p-5">
          <legend className="display bg-neutral-950 px-2 text-lg tracking-wider text-white">Template</legend>
          {TEMPLATES.map((t) => (
            <label key={t.id} className="flex cursor-pointer items-center gap-3 border-2 border-neutral-950 bg-neutral-50 p-3">
              <input type="radio" name="template" value={t.id} defaultChecked={brand.template === t.id} className="size-5 accent-neutral-950" />
              <span>
                <span className="display block text-2xl">{t.label}</span>
                <span className="block text-sm text-neutral-600">{t.description}</span>
              </span>
            </label>
          ))}
          <p className="text-sm text-neutral-500">More templates are on the way.</p>
        </fieldset>
      </div>

      {/* Live sample, sticky on desktop */}
      <div className="grid gap-3 lg:sticky lg:top-4">
        <p className="display text-sm tracking-[0.2em] text-neutral-500">Sample</p>
        <div style={{ ...vars, ...fonts[fontPair] }} className="border-2 border-neutral-950 bg-paper text-ink">
          <div className="stripe h-2" />
          <div className="flex items-center gap-2 border-b-4 border-ink p-3">
            {logoPreview && !removeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="" className="h-8 w-auto max-w-16 object-contain" />
            ) : null}
            <span className="display truncate text-xl">{trackName}</span>
          </div>
          <p className="display truncate bg-accent px-3 py-1 text-sm tracking-widest text-on-accent">Next race ▸ Sat 10.12 ▸ Gates 4:00 PM</p>
          <div className="flex gap-3 p-3">
            <div className="display flex w-16 flex-col items-center bg-brand py-2 text-on-brand">
              <span className="text-sm">Sat</span>
              <span className="text-4xl">12</span>
              <span className="text-sm">Oct</span>
            </div>
            <div className="self-center">
              <p className="display text-3xl">Fan Night</p>
              <p className="display text-sm text-accent-text">Feature · Late Models</p>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t-2 border-ink">
            {["Gates", "Laps", "Race"].map((l, i) => (
              <div key={l} className={`p-2 ${i ? "border-l-2 border-ink" : ""}`}>
                <p className="display text-[10px] tracking-widest opacity-70">{l}</p>
                <p className="display text-xl">
                  {4 + i * 2}:00<span className="text-xs text-accent-text">PM</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-neutral-950 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl gap-2 px-4 py-3">
          <FormMessage state={state} />
          <SubmitButton>Save brand kit</SubmitButton>
        </div>
      </div>
    </form>
  );
}
