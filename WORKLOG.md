# Worklog

Newest first. Start each session with a one-line goal; end with done / broke / next.

## 2026-09-30

**Goal:** Phase 1 foundation, deployed without any local installs.

**Done**
- Next.js 16 (App Router, TS, Tailwind) scaffold; deps: next, react, @supabase/ssr, @supabase/supabase-js.
- SQL migrations: tracks, track_members, brand_kits, media, classes, events, event_classes,
  event_specials, sponsors, subscribers. RLS keyed by track_id; composite FKs block cross-track links.
  `create_track()` and `save_event_card()` RPCs. `track-media` storage bucket.
- Tenant routing in `src/proxy.ts` (Next 16's renamed middleware): `<slug>.<root>` and `/sites/<slug>` fallback.
- Admin: sign-in, create track, logo upload, brand kit, classes, event card form, settings/publish, preview.
- Public site: home, schedule, event detail. Built in pit-board style, then stripped to plain
  black-and-white at the owner's request (design comes after backend).
- Supabase project created (SQL run via `supabase/setup_all.sql`); Vercel project `gridlinetrack`
  deployed from GitHub; live at https://gridlinetrack.vercel.app.
- Added SPEC.md, DEV_GUIDE.md, CLAUDE.md, WORKLOG.md, DECISIONS.md, PARKING_LOT.md.

**Broke / open**
- Admin flows not yet verified end-to-end on the live site by the owner.
- Tenant isolation test is a SQL script whose output must be read by eye; not a pass/fail test yet.
- Fan signup form is live but has no consent language, unsubscribe or privacy policy (Phase 2 items).

**Next**
- Owner runs the Phase 1 gate: create a fake track and publish an event page in < 10 minutes.
- Close the Phase 1 gaps listed at the bottom of DECISIONS.md / in chat.
