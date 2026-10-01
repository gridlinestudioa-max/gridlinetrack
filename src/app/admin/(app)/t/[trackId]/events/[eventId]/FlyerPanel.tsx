import type { RaceEvent } from "@/lib/types";

/** Flyer preview + downloads for an event card. Always reflects the last saved version. */
export function FlyerPanel({ trackId, event }: { trackId: string; event: Pick<RaceEvent, "id" | "updated_at"> }) {
  const base = `/admin/t/${trackId}/events/${event.id}/flyer`;
  // updated_at busts the browser cache after each save.
  const v = encodeURIComponent(event.updated_at);
  return (
    <section className="grid gap-4 border-2 border-black bg-white p-4 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-start">
      <a href={`${base}?format=png&v=${v}`} target="_blank" rel="noopener" className="block border-2 border-neutral-300">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated per request */}
        <img src={`${base}?format=png&v=${v}`} alt="Flyer preview" width={1080} height={1350} className="h-auto w-full" />
      </a>
      <div className="grid content-start gap-3">
        <h3 className="display text-2xl">Flyer</h3>
        <p className="text-sm text-neutral-600">
          Made from this event card. Save your changes first, then download.
        </p>
        <a
          href={`${base}?format=png&download=1&v=${v}`}
          className="display flex min-h-12 items-center justify-center bg-black px-5 text-lg text-white hover:bg-neutral-800"
        >
          Download image for social (PNG)
        </a>
        <a
          href={`${base}?format=pdf&download=1&v=${v}`}
          className="display flex min-h-12 items-center justify-center border-2 border-black px-5 text-lg hover:bg-neutral-100"
        >
          Download for printing (PDF, letter)
        </a>
        <p className="text-xs text-neutral-500">
          Image: 1080 × 1350, sized for Instagram and Facebook posts. PDF: 8.5 × 11 in at 300 dpi.
        </p>
      </div>
    </section>
  );
}
