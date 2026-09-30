"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton, inputClass } from "@/components/admin/ui";
import type { ActionState } from "@/lib/admin";
import { FONT_PAIRS, TEMPLATES } from "@/lib/brand";
import type { BrandKit } from "@/lib/types";
import { updateBrand } from "../actions";

const COLORS = [
  ["primary_color", "Primary colour", "Main brand colour."],
  ["secondary_color", "Background colour", "Page background."],
  ["accent_color", "Accent colour", "Highlights."],
] as const;

export function BrandForm({ trackId, brand, logoUrl }: { trackId: string; brand: BrandKit; logoUrl: string | null }) {
  const [state, action] = useActionState<ActionState, FormData>(updateBrand.bind(null, trackId), {});
  const err = state.fieldErrors ?? {};
  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrl);
  const [removeLogo, setRemoveLogo] = useState(false);

  return (
    <form action={action} className="grid gap-6">
      <p className="border-l-4 border-black bg-white px-3 py-2 text-sm">
        Colours, fonts and template are saved for the design phase. The public site is plain black and white for now;
        only the logo is shown.
      </p>

      <fieldset className="grid gap-4 border-2 border-black bg-white p-4">
        <legend className="px-1 font-bold">Logo</legend>
        {logoPreview && !removeLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoPreview} alt="Current logo" className="max-h-24 max-w-48 object-contain" />
        ) : (
          <p className="text-sm text-neutral-500">No logo yet.</p>
        )}
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
          className="text-sm"
        />
        <p className="text-sm text-neutral-500">PNG, JPG or WebP, up to 5 MB.</p>
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
        {err.logo ? <p className="text-sm font-bold">{err.logo}</p> : null}
      </fieldset>

      <fieldset className="grid gap-4 border-2 border-black bg-white p-4">
        <legend className="px-1 font-bold">Colours</legend>
        {COLORS.map(([name, label, hint]) => (
          <Field key={name} label={label} htmlFor={name} hint={hint} error={err[name]}>
            <input
              id={name}
              name={name}
              type="color"
              defaultValue={brand[name]}
              className="h-12 w-24 cursor-pointer border-2 border-neutral-300 bg-white p-1"
            />
          </Field>
        ))}
      </fieldset>

      <fieldset className="grid gap-4 border-2 border-black bg-white p-4">
        <legend className="px-1 font-bold">Fonts and template</legend>
        <Field label="Font pair" htmlFor="font_pair" error={err.font_pair}>
          <select id="font_pair" name="font_pair" defaultValue={brand.font_pair} className={inputClass}>
            {FONT_PAIRS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Template" htmlFor="template" error={err.template}>
          <select id="template" name="template" defaultValue={brand.template} className={inputClass}>
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-black bg-white">
        <div className="mx-auto grid max-w-5xl gap-2 px-4 py-3">
          <FormMessage state={state} />
          <SubmitButton>Save brand kit</SubmitButton>
        </div>
      </div>
    </form>
  );
}
