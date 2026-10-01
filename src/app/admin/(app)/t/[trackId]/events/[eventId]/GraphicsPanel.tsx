import { NOTICE_STATUSES, type GraphicKind } from "@/lib/graphics/Graphic";
import type { RaceEvent } from "@/lib/types";

const CARDS: { kind: GraphicKind; title: string; when: string }[] = [
  { kind: "announcement", title: "Announcement", when: "Post in the days before race night." },
  { kind: "cancellation", title: "Rain-out / cancellation", when: "Post when plans change." },
  { kind: "thanks", title: "Thanks for coming", when: "Post after race night." },
];

/** Social graphics for an event card: preview + square/story downloads. Reflects the last saved version. */
export function GraphicsPanel({ trackId, event }: { trackId: string; event: Pick<RaceEvent, "id" | "status" | "updated_at"> }) {
  const base = `/admin/t/${trackId}/events/${event.id}/graphic`;
  const v = encodeURIComponent(event.updated_at);
  const href = (kind: GraphicKind, size: "square" | "story", download = false) =>
    `${base}?kind=${kind}&size=${size}${download ? "&download=1" : ""}&v=${v}`;

  return (
    <section className="grid gap-4 border-2 border-black bg-white p-4">
      <div>
        <h3 className="display text-2xl">Social graphics</h3>
        <p className="text-sm text-neutral-600">Square for feed posts, story for Instagram and Facebook stories.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {CARDS.map(({ kind, title, when }) => {
          const available = kind !== "cancellation" || NOTICE_STATUSES.has(event.status);
          return (
            <li key={kind} className="grid content-start gap-2">
              <p className="font-bold">{title}</p>
              {available ? (
                <>
                  <a href={href(kind, "square")} target="_blank" rel="noopener" className="block border-2 border-neutral-300">
                    {/* eslint-disable-next-line @next/next/no-img-element -- generated per request */}
                    <img src={href(kind, "square")} alt={`${title} preview`} width={1080} height={1080} loading="lazy" className="h-auto w-full" />
                  </a>
                  <p className="text-xs text-neutral-500">{when}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={href(kind, "square", true)} className="flex min-h-12 items-center justify-center bg-black px-2 text-sm font-bold text-white hover:bg-neutral-800">
                      Square
                    </a>
                    <a href={href(kind, "story", true)} className="flex min-h-12 items-center justify-center border-2 border-black px-2 text-sm font-bold hover:bg-neutral-100">
                      Story
                    </a>
                  </div>
                </>
              ) : (
                <p className="border-2 border-dashed border-neutral-300 p-4 text-sm text-neutral-600">
                  Set this event&rsquo;s status to Postponed, Rained out or Cancelled (and add a rain date if there is one), save,
                  and this graphic appears here.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
