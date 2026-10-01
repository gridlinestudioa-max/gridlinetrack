/* eslint-disable @next/next/no-img-element -- rendered by satori (next/og), not the browser */
import { STATUS_LABELS } from "@/lib/brand";
import { dateParts, shortTime } from "@/lib/dates";
import type { FlyerData } from "./data";

/**
 * The event flyer, laid out for next/og (satori): flexbox only, inline styles.
 * All sizes are in design units on a 1080-unit-wide page and multiplied by `u`,
 * so the same layout renders the 1080px social image and the 300dpi print page.
 *
 * Plain black and white for now (see DECISIONS.md); the brand kit's colours
 * and fonts come in with the design pass.
 */
export function Flyer({ data, u }: { data: FlyerData; u: number }) {
  const { track, event, logo, siteAddress } = data;
  const px = (n: number) => Math.round(n * u);
  const d = dateParts(event.event_date);

  const titleSize = event.title.length <= 14 ? 112 : event.title.length <= 26 ? 88 : event.title.length <= 44 ? 66 : 52;
  const classes = event.event_classes.filter((c) => c.classes);
  const twoCols = classes.length > 4;
  const classSize = classes.length <= 4 ? 36 : classes.length <= 8 ? 30 : 25;
  const specials = event.event_specials.slice(0, 4);
  const admission = event.admission.slice(0, 6);
  const times = [
    ["GATES", event.gates_open],
    ["HOT LAPS", event.hot_laps],
    ["RACING", event.racing_starts],
  ].filter((t): t is [string, string] => Boolean(t[1]));
  const banner = event.status === "postponed" || event.status === "rained_out" || event.status === "cancelled";
  const where = track.address ?? [track.city, track.region].filter(Boolean).join(", ");

  const label = { fontSize: px(22), fontWeight: 800, letterSpacing: px(3) } as const;
  const rule = { borderTop: `${px(6)}px solid #000` } as const;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        color: "#000",
        fontFamily: "Inter",
        padding: px(64),
      }}
    >
      {/* Track */}
      <div style={{ display: "flex", flexShrink: 0, alignItems: "center", gap: px(20) }}>
        {logo ? <img src={logo} alt="" height={px(84)} style={{ maxWidth: px(260), objectFit: "contain" }} /> : null}
        <div style={{ display: "flex", fontSize: px(40), fontWeight: 800, lineHeight: 1.1 }}>{track.name}</div>
      </div>

      {/* Middle: everything here may be trimmed on extreme cards; the footer never is. */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {banner ? (
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            marginTop: px(28),
            background: "#000",
            color: "#fff",
            padding: `${px(14)}px ${px(24)}px`,
            fontSize: px(44),
            fontWeight: 800,
          }}
        >
          {STATUS_LABELS[event.status].toUpperCase()}
          {event.rain_date ? ` — NEW DATE ${dateParts(event.rain_date).dow} ${dateParts(event.rain_date).month}.${dateParts(event.rain_date).day}` : ""}
        </div>
      ) : null}

      {/* Date + title */}
      <div style={{ display: "flex", flexShrink: 0, gap: px(32), marginTop: px(28), ...rule, paddingTop: px(28) }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
            color: "#fff",
            width: px(200),
            minWidth: px(200),
            padding: `${px(14)}px 0`,
          }}
        >
          <div style={{ fontSize: px(40), fontWeight: 800 }}>{d.dow}</div>
          <div style={{ fontSize: px(116), fontWeight: 800, lineHeight: 1 }}>{d.day}</div>
          <div style={{ fontSize: px(40), fontWeight: 800 }}>{d.mon}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <div style={{ display: "flex", fontSize: px(titleSize), fontWeight: 800, lineHeight: 1.02 }}>{event.title}</div>
          {event.subtitle ? (
            <div style={{ display: "flex", fontSize: px(30), marginTop: px(12) }}>{event.subtitle}</div>
          ) : null}
        </div>
      </div>

      {/* Times */}
      {times.length ? (
        <div style={{ display: "flex", flexShrink: 0, marginTop: px(28), border: `${px(5)}px solid #000` }}>
          {times.map(([name, value], i) => (
            <div
              key={name}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: `${px(12)}px ${px(20)}px`,
                borderLeft: i ? `${px(5)}px solid #000` : "none",
              }}
            >
              <div style={label}>{name}</div>
              <div style={{ display: "flex", fontSize: px(54), fontWeight: 800, lineHeight: 1.1 }}>{shortTime(value)}</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Classes */}
      {classes.length ? (
        <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, marginTop: px(28) }}>
          <div style={label}>ON THE CARD</div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: px(10) }}>
            {classes.map((c) => (
              <div
                key={c.class_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  width: twoCols ? "50%" : "100%",
                  paddingRight: twoCols ? px(24) : 0,
                  paddingTop: px(classSize * 0.22),
                  paddingBottom: px(classSize * 0.22),
                  borderBottom: `${px(2)}px solid #000`,
                }}
              >
                <div style={{ display: "flex", fontSize: px(classSize), fontWeight: 800 }}>
                  {c.classes!.name}
                  {c.is_feature ? " ★" : ""}
                </div>
                {c.purse ? <div style={{ display: "flex", fontSize: px(classSize * 0.8) }}>{c.purse}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Specials: titles only; details live on the event page. */}
      {specials.length ? (
        <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, marginTop: px(28) }}>
          <div style={label}>SPECIALS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: px(12), marginTop: px(12) }}>
            {specials.map((s) => (
              <div key={s.id} style={{ display: "flex", border: `${px(4)}px solid #000`, padding: `${px(8)}px ${px(16)}px`, fontSize: px(28), fontWeight: 800 }}>
                {s.title}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      </div>

      {/* Footer: always shown. Admission on one wrapped line, then where to find us. */}
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, ...rule, paddingTop: px(20), marginTop: px(20) }}>
        {admission.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: px(28), columnGap: px(28), rowGap: px(4) }}>
            {admission.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: px(10) }}>
                <div style={{ display: "flex" }}>{a.label}</div>
                <div style={{ display: "flex", fontWeight: 800 }}>{a.price}</div>
              </div>
            ))}
          </div>
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: px(24), marginTop: px(12) }}>
          <div style={{ display: "flex", fontSize: px(24), flex: 1 }}>{where}</div>
          <div style={{ display: "flex", fontSize: px(26), fontWeight: 800 }}>{siteAddress}</div>
        </div>
      </div>
    </div>
  );
}
