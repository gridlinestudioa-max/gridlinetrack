/* eslint-disable @next/next/no-img-element -- rendered by satori (next/og), not the browser */
import type { ReactNode } from "react";
import { STATUS_LABELS } from "@/lib/brand";
import { dateParts, longDate, shortTime } from "@/lib/dates";
import type { FlyerData } from "@/lib/flyer/data";

/**
 * Social graphics generated from the event card. PLACEHOLDER templates (plain
 * black and white, see DECISIONS.md): real templates replace this file; the
 * data, sizes and routes stay the same.
 */

export const GRAPHIC_KINDS = ["announcement", "cancellation", "thanks"] as const;
export type GraphicKind = (typeof GRAPHIC_KINDS)[number];

export const GRAPHIC_SIZES = {
  /** Feed post. */
  square: { width: 1080, height: 1080 },
  /** Instagram/Facebook story. Their UI covers ~250px at the top and ~340px at the bottom. */
  story: { width: 1080, height: 1920 },
} as const;
export type GraphicSize = keyof typeof GRAPHIC_SIZES;

/** Statuses a cancellation notice can be made for. */
export const NOTICE_STATUSES = new Set(["postponed", "rained_out", "cancelled"]);

const flex = { display: "flex" } as const;
const col = { display: "flex", flexDirection: "column" } as const;
const kicker = { ...flex, fontSize: 30, fontWeight: 800, letterSpacing: 4 } as const;

export function Graphic({ kind, size, data }: { kind: GraphicKind; size: GraphicSize; data: FlyerData }) {
  const story = size === "story";
  const body =
    kind === "announcement" ? <Announcement data={data} story={story} /> : kind === "cancellation" ? <Notice data={data} story={story} /> : <Thanks data={data} story={story} />;

  return (
    <div
      style={{
        ...col,
        width: "100%",
        height: "100%",
        background: "#fff",
        color: "#000",
        fontFamily: "Inter",
        // Story: keep content inside the area platform UI doesn't cover.
        padding: story ? "260px 72px 360px" : "64px",
      }}
    >
      <TrackLine data={data} />
      <div style={{ ...col, flex: 1, justifyContent: "center", overflow: "hidden" }}>{body}</div>
      <div style={{ ...flex, flexShrink: 0, borderTop: "6px solid #000", paddingTop: 18, fontSize: 30, fontWeight: 800 }}>
        {data.siteAddress}
      </div>
    </div>
  );
}

function TrackLine({ data }: { data: FlyerData }) {
  return (
    <div style={{ ...flex, flexShrink: 0, alignItems: "center", gap: 20 }}>
      {data.logo ? <img src={data.logo} alt="" height={76} style={{ maxWidth: 240, objectFit: "contain" }} /> : null}
      <div style={{ ...flex, fontSize: 36, fontWeight: 800, lineHeight: 1.1 }}>{data.track.name}</div>
    </div>
  );
}

function Title({ text, story }: { text: string; story: boolean }) {
  const size = text.length <= 14 ? 112 : text.length <= 26 ? 88 : text.length <= 44 ? 68 : 54;
  return <div style={{ ...flex, fontSize: story ? Math.round(size * 1.1) : size, fontWeight: 800, lineHeight: 1.02 }}>{text}</div>;
}

function DateBlock({ date, story }: { date: string; story: boolean }) {
  const d = dateParts(date);
  return (
    <div
      style={{
        ...col,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        color: "#fff",
        width: story ? 240 : 200,
        padding: "14px 0",
      }}
    >
      <div style={{ ...flex, fontSize: 40, fontWeight: 800 }}>{d.dow}</div>
      <div style={{ ...flex, fontSize: story ? 136 : 116, fontWeight: 800, lineHeight: 1 }}>{d.day}</div>
      <div style={{ ...flex, fontSize: 40, fontWeight: 800 }}>{d.mon}</div>
    </div>
  );
}

function Stack({ story, children }: { story: boolean; children: ReactNode }) {
  return <div style={{ ...col, gap: story ? 44 : 30 }}>{children}</div>;
}

function Announcement({ data, story }: { data: FlyerData; story: boolean }) {
  const { event } = data;
  const feature = event.event_classes.find((c) => c.is_feature) ?? event.event_classes[0];
  const others = event.event_classes.filter((c) => c !== feature && c.classes).map((c) => c.classes!.short_name || c.classes!.name);
  const times = [
    ["GATES", event.gates_open],
    ["RACING", event.racing_starts],
  ].filter((t): t is [string, string] => Boolean(t[1]));

  return (
    <Stack story={story}>
      <div style={kicker}>RACE NIGHT</div>
      <div style={{ ...flex, gap: 32, alignItems: "center" }}>
        <DateBlock date={event.event_date} story={story} />
        <div style={{ ...col, flex: 1 }}>
          <Title text={event.title} story={story} />
          {event.subtitle ? <div style={{ ...flex, fontSize: 30, marginTop: 10 }}>{event.subtitle}</div> : null}
        </div>
      </div>
      {times.length ? (
        <div style={{ ...flex, border: "5px solid #000" }}>
          {times.map(([label, value], i) => (
            <div key={label} style={{ ...col, flex: 1, padding: "12px 20px", borderLeft: i ? "5px solid #000" : "none" }}>
              <div style={{ ...flex, fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>{label}</div>
              <div style={{ ...flex, fontSize: 56, fontWeight: 800 }}>{shortTime(value)}</div>
            </div>
          ))}
        </div>
      ) : null}
      {feature?.classes ? (
        <div style={{ ...col }}>
          <div style={{ ...flex, fontSize: 40, fontWeight: 800 }}>
            ★ {feature.classes.name}
            {feature.purse ? ` — ${feature.purse}` : ""}
          </div>
          {others.length ? <div style={{ ...flex, fontSize: 30, marginTop: 8 }}>+ {others.join(" · ")}</div> : null}
        </div>
      ) : null}
      {event.event_specials.length ? (
        <div style={{ ...flex, flexWrap: "wrap", gap: 12 }}>
          {event.event_specials.slice(0, story ? 4 : 3).map((s) => (
            <div key={s.id} style={{ ...flex, border: "4px solid #000", padding: "8px 16px", fontSize: 28, fontWeight: 800 }}>
              {s.title}
            </div>
          ))}
        </div>
      ) : null}
    </Stack>
  );
}

function Notice({ data, story }: { data: FlyerData; story: boolean }) {
  const { event } = data;
  const label = (NOTICE_STATUSES.has(event.status) ? STATUS_LABELS[event.status] : "Schedule change").toUpperCase();
  return (
    <Stack story={story}>
      <div style={{ ...flex, background: "#000", color: "#fff", padding: "20px 28px", fontSize: story ? 120 : 104, fontWeight: 800, lineHeight: 1 }}>
        {label}
      </div>
      <Title text={event.title} story={story} />
      <div style={{ ...flex, fontSize: 40, textDecoration: "line-through" }}>{longDate(event.event_date)}</div>
      {event.rain_date ? (
        <div style={{ ...col }}>
          <div style={kicker}>NEW DATE</div>
          <div style={{ ...flex, fontSize: 64, fontWeight: 800 }}>{longDate(event.rain_date)}</div>
        </div>
      ) : (
        <div style={{ ...flex, fontSize: 36 }}>Watch our site and socials for updates.</div>
      )}
    </Stack>
  );
}

function Thanks({ data, story }: { data: FlyerData; story: boolean }) {
  const { event } = data;
  return (
    <Stack story={story}>
      <div style={{ ...flex, fontSize: story ? 150 : 128, fontWeight: 800, lineHeight: 0.95 }}>Thanks for coming!</div>
      <div style={{ ...flex, borderTop: "6px solid #000", paddingTop: 24 }}>
        <div style={{ ...col }}>
          <Title text={event.title} story={story} />
          <div style={{ ...flex, fontSize: 36, marginTop: 10 }}>{longDate(event.event_date)}</div>
        </div>
      </div>
      <div style={{ ...flex, fontSize: 40, fontWeight: 800 }}>Results on our site</div>
    </Stack>
  );
}
