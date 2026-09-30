# Gridline Track

Multi-tenant websites for small racetracks, plus (in later phases) a race-night
engine that turns one **event card** into an event page, flyer, social graphics
and an email blast.

This is **Phase 1**: tenancy, data model, admin, and a plain black-and-white
public site (home, schedule, event pages). Visual design comes later. Brand
settings (colours, font pair, template) are already stored, but only the logo
is shown for now.

- **Stack:** Next.js 16 (App Router, TypeScript, Tailwind v4) + Supabase (Auth, Postgres, Storage).
- **Runtime dependencies:** `next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`. That's all.
- **Hosting:** Supabase (free tier) plus Vercel (Hobby tier). Nothing needs to be installed on your computer. Images use plain `<img>`, so there's no metered image optimisation.
- **No third-party racing data.** Tickets, livestream, results and social links are plain outbound links.

---

## Setup in the browser (nothing to install)

1. **Supabase:** create a project at supabase.com. In **SQL Editor**, run each file in `supabase/migrations/` in filename order, then optionally `supabase/seed.sql` (once) for the demo track.
2. **Supabase → Authentication → Sign In / Providers → Email:** turn off *Confirm email* while testing.
3. **Supabase → Project Settings → API Keys:** copy the Project URL and the anon/publishable key.
4. **Vercel:** import this GitHub repo as a project and set these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, from step 3
   - `NEXT_PUBLIC_ROOT_DOMAIN`, set to your project's domain, e.g. `gridlinetrack.vercel.app`
   - `ALLOW_PATH_TENANTS=true`, because `*.vercel.app` has no wildcard subdomains
5. Deploy. The admin is at `https://<project>.vercel.app/admin`. Track sites are at `https://<project>.vercel.app/sites/<slug>` until a custom domain with wildcard subdomains is added.

## Local development (optional)

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase

**Option A — local (Docker + [Supabase CLI](https://supabase.com/docs/guides/cli))**

```bash
npx supabase init        # creates supabase/config.toml; keeps the existing migrations and seed
npx supabase start       # prints the API URL and anon key
npx supabase db reset    # applies supabase/migrations/* then supabase/seed.sql
```

Put the printed `API URL` and `anon key` into `.env.local`. Local Supabase has
email confirmation off, so "Create account" signs you straight in.

**Option B — hosted project**

1. Create a project at supabase.com (the free tier is fine).
2. Apply the migrations, either with `npx supabase link --project-ref <ref> && npx supabase db push`,
   or by pasting each file in `supabase/migrations/` into the SQL editor, in order.
3. Optionally run `supabase/seed.sql` for the demo track.
4. **Auth → URL Configuration:** set Site URL to your app's root URL and add
   `http://localhost:3000/auth/confirm` (and your production `/auth/confirm`) to the redirect URLs.
5. Copy the project URL and anon/publishable key into `.env.local`.

No service-role key is needed. The app always acts as either the anonymous
visitor or the signed-in user, and RLS decides what each can do.

### 3. Run

```bash
npm run dev
```

| URL | What |
| --- | --- |
| http://localhost:3000 | Root landing page |
| http://localhost:3000/admin | Admin (sign up / sign in) |
| http://thunder-valley.localhost:3000 | Seeded demo track's public site |
| http://localhost:3000/sites/thunder-valley | Same site by path (dev fallback) |

---

## Multi-tenancy

`src/proxy.ts` (Next 16's replacement for `middleware.ts`) reads the `Host` header:

- `<slug>.<ROOT_DOMAIN>` → rewritten internally to `/sites/<slug>/…`.
- `ROOT_DOMAIN/admin/…` → admin. The Supabase session is refreshed here, and signed-out users are redirected to `/admin/login`.
- `ROOT_DOMAIN/sites/<slug>/…` → path-based access. Allowed in development, or anywhere with `ALLOW_PATH_TENANTS=true` (handy for Vercel preview URLs, which have no wildcard subdomains). Otherwise 404.
- Admin paths on a tenant host return 404, so admin cookies never live on tenant subdomains.

The proxy passes the site's link prefix to the page in an `x-site-base` header
(`""` on a subdomain, `/sites/<slug>` on the fallback). It always overwrites any
client-supplied value.

### Local subdomains

`ROOT_DOMAIN=localhost:3000` works in Chrome, Edge and Firefox, which resolve
`*.localhost` to 127.0.0.1. If your browser doesn't (e.g. Safari), either:

- set `NEXT_PUBLIC_ROOT_DOMAIN=lvh.me:3000` (a public wildcard DNS name that points to 127.0.0.1) and use `http://thunder-valley.lvh.me:3000`, or
- use the path fallback `http://localhost:3000/sites/<slug>`.

### Production

Point `*.yourdomain.com` and `yourdomain.com` at the app (on Vercel: add both as
domains), and set `NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com`. Custom domains per
track are not part of Phase 1.

---

## Data model (`supabase/migrations`)

| File | Contents |
| --- | --- |
| `…0100_core_schema.sql` | `tracks`, `track_members`, `brand_kits`, `media`, `classes`, `events`, `event_classes`, `event_specials`, `sponsors`, `subscribers` |
| `…0200_rls.sql` | RLS on every table, keyed by `track_id`; `create_track()` and `save_event_card()` RPCs |
| `…0300_storage.sql` | Public `track-media` bucket; writes restricted to `<track_id>/…` for that track's members |

Key rules:

- **`track_members`** (user ↔ track, `owner`/`editor`) is what RLS keys on. It's an addition to the table list in the brief: something has to map auth users to tracks.
- **Public reads** apply only when `tracks.published = true`. Draft events are never public.
- **Tracks are created only through `create_track()`**, which makes the caller the owner and seeds a brand kit. There's no direct insert policy.
- **Cross-tenant links are impossible.** Child tables carry `track_id`, with composite foreign keys (`(event_id, track_id)`, `(class_id, track_id)`, `(logo_media_id, track_id)`).
- **`save_event_card()`** writes an event plus its classes and specials atomically, as `SECURITY INVOKER`, so RLS still applies.
- **The public can join a published track's `subscribers` list** (insert only) but can't read it.

### Tenant isolation test

`supabase/tests/tenant_isolation.sql` proves one track's data never reaches
another. It creates two tracks with separate owners, fills both with every kind
of data, then tries each read and write path across tracks, as the other owner,
as a signed-in stranger and as an anonymous visitor. There are about 100
checks; any failure stops the run with `FAIL …` and a non-zero exit.

It runs automatically on every push (GitHub → **Actions** → *Tenant isolation*).
To run it by hand against any disposable Postgres 15+:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres scripts/test-db.sh
```

Supabase's `auth` and `storage` schemas are stubbed by
`supabase/tests/stub_supabase.sql`; never run that file against a real project.

---

## Code map

```
src/proxy.ts                         tenant routing + admin session refresh
src/lib/tenant.ts                    host → tenant parsing, slug rules
src/lib/site-data.ts                 loads a site through any Supabase client
src/lib/brand.ts, fonts.ts           brand kit → CSS variables, font pairs, contrast checks
src/components/site/*                Pit Board template (server components)
src/app/sites/[slug]/[[...path]]     public site: /, /schedule, /events/<slug>
src/app/admin/(app)/…                admin: tracks, events, classes, brand, settings
src/app/admin/preview/[trackId]/…    private preview of the site (includes drafts)
supabase/migrations, seed.sql        schema, RLS, storage, demo data
```

Scripts: `npm run dev | build | lint | typecheck`.

---

## Phase 1 notes and limits

- One template (`pitboard`). `brand_kits.template` is a checked enum, ready for more.
- `sponsors` has a table and RLS, but no admin UI or public display yet.
- A track's web address (slug) is set at creation and not editable in the UI.
- Logos: PNG, JPG or WebP up to 5 MB. SVG is rejected on purpose, because it can carry script.
- Public pages render dynamically on each request. Caching and revalidation come with the generation engine.
- Subscribers are single opt-in, with a honeypot field. Double opt-in and unsubscribe links belong with email blasts (Phase 2+), along with whichever email provider the spec picks.
