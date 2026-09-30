-- Gridline Track: one-shot setup for the Supabase SQL Editor.
-- = all files in supabase/migrations (in order) + supabase/seed.sql (demo track).
-- Generated for convenience; the migrations folder is the source of truth.
-- Run it ONCE on a fresh project. Running it again fails with "already exists" errors.

-- ====================================================================
-- supabase/migrations/20260930000100_core_schema.sql
-- ====================================================================
-- Gridline Track — core schema (Phase 1)
--
-- Every tenant-owned row carries track_id. Child tables (event_classes,
-- event_specials) denormalise track_id and use composite foreign keys so a row
-- can never point at an event or class belonging to a different track.

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- tracks (the tenant)
-- ---------------------------------------------------------------------------
create table public.tracks (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null check (char_length(name) between 2 and 120),
  tagline         text check (char_length(tagline) <= 160),
  city            text,
  region          text,          -- state / province
  address         text,
  timezone        text not null default 'America/Chicago',
  phone           text,
  email           text,
  -- External links only. We never pull data from third-party platforms.
  tickets_url     text,
  livestream_url  text,
  results_url     text,
  facebook_url    text,
  instagram_url   text,
  tiktok_url      text,
  youtube_url     text,
  published       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Subdomain-safe slug: 3–32 chars, lowercase letters, digits, inner hyphens.
  constraint tracks_slug_format check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,30})[a-z0-9]$'),
  constraint tracks_slug_reserved check (slug not in (
    'www', 'app', 'admin', 'api', 'auth', 'sites', 'static', 'assets', 'cdn',
    'mail', 'email', 'smtp', 'dev', 'staging', 'preview', 'status', 'help',
    'support', 'docs', 'blog', 'dashboard', 'login', 'signup', 'gridline'
  ))
);

create trigger tracks_updated_at before update on public.tracks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- track_members: which auth users can manage which track.
-- (Needed so RLS can be keyed by track_id.)
-- ---------------------------------------------------------------------------
create table public.track_members (
  track_id   uuid not null references public.tracks (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  primary key (track_id, user_id)
);

create index track_members_user_idx on public.track_members (user_id);

-- ---------------------------------------------------------------------------
-- media: every file a track uploads (logo, photos, sponsor logos, flyers…)
-- ---------------------------------------------------------------------------
create table public.media (
  id          uuid primary key default gen_random_uuid(),
  track_id    uuid not null references public.tracks (id) on delete cascade,
  bucket      text not null default 'track-media',
  path        text not null,
  kind        text not null default 'photo'
                check (kind in ('logo', 'photo', 'sponsor_logo', 'flyer', 'social', 'other')),
  mime_type   text,
  size_bytes  integer check (size_bytes >= 0),
  width       integer,
  height      integer,
  alt         text,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (bucket, path),
  unique (id, track_id),
  -- Storage objects must live under the owning track's folder.
  constraint media_path_in_track_folder check (path like track_id::text || '/%')
);

create index media_track_idx on public.media (track_id, kind);

-- ---------------------------------------------------------------------------
-- brand_kits: one per track
-- ---------------------------------------------------------------------------
create table public.brand_kits (
  track_id        uuid primary key references public.tracks (id) on delete cascade,
  logo_media_id   uuid,
  primary_color   text not null default '#E10600',
  secondary_color text not null default '#111111',
  accent_color    text not null default '#FFD400',
  font_pair       text not null default 'oswald-inter'
                    check (font_pair in ('oswald-inter', 'bebas-barlow', 'barlowcond-plex', 'anton-sourcesans')),
  template        text not null default 'pitboard' check (template in ('pitboard')),
  updated_at      timestamptz not null default now(),
  constraint brand_kits_colors_hex check (
    primary_color   ~ '^#[0-9A-Fa-f]{6}$' and
    secondary_color ~ '^#[0-9A-Fa-f]{6}$' and
    accent_color    ~ '^#[0-9A-Fa-f]{6}$'
  ),
  -- Logo must be media owned by the same track.
  foreign key (logo_media_id, track_id) references public.media (id, track_id)
    on delete set null (logo_media_id)
);

create trigger brand_kits_updated_at before update on public.brand_kits
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- classes: the divisions a track runs (Late Models, Modifieds, Hornets…)
-- ---------------------------------------------------------------------------
create table public.classes (
  id          uuid primary key default gen_random_uuid(),
  track_id    uuid not null references public.tracks (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  short_name  text check (char_length(short_name) <= 16),
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (id, track_id),
  unique (track_id, name)
);

create index classes_track_idx on public.classes (track_id, sort_order);

-- ---------------------------------------------------------------------------
-- events: the "event card" — the single source every output is generated from
-- ---------------------------------------------------------------------------
create table public.events (
  id               uuid primary key default gen_random_uuid(),
  track_id         uuid not null references public.tracks (id) on delete cascade,
  slug             text not null,
  title            text not null check (char_length(title) between 2 and 120),
  subtitle         text check (char_length(subtitle) <= 160),
  event_date       date not null,
  gates_open       time,
  hot_laps         time,
  racing_starts    time,
  status           text not null default 'draft'
                     check (status in ('draft', 'scheduled', 'postponed', 'rained_out', 'cancelled', 'completed')),
  rain_date        date,
  description      text,
  -- [{ "label": "Adults", "price": "$15" }, …] — free text so tracks can say "FREE"
  admission        jsonb not null default '[]'::jsonb
                     check (jsonb_typeof(admission) = 'array'),
  tickets_url      text,
  livestream_url   text,
  hero_media_id    uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (id, track_id),
  unique (track_id, slug),
  constraint events_slug_format check (slug ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$'),
  foreign key (hero_media_id, track_id) references public.media (id, track_id)
    on delete set null (hero_media_id)
);

create index events_track_date_idx on public.events (track_id, event_date);

create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- event_classes: which classes race on an event, and what they race for
-- ---------------------------------------------------------------------------
create table public.event_classes (
  event_id    uuid not null,
  class_id    uuid not null,
  track_id    uuid not null,
  purse       text check (char_length(purse) <= 80),   -- e.g. "$2,000 to win"
  is_feature  boolean not null default false,
  sort_order  integer not null default 0,
  primary key (event_id, class_id),
  foreign key (event_id, track_id) references public.events (id, track_id) on delete cascade,
  foreign key (class_id, track_id) references public.classes (id, track_id) on delete cascade
);

create index event_classes_track_idx on public.event_classes (track_id);

-- ---------------------------------------------------------------------------
-- event_specials: promos on the card (kids ride free, fireworks, $1 hot dogs…)
-- ---------------------------------------------------------------------------
create table public.event_specials (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null,
  track_id    uuid not null,
  title       text not null check (char_length(title) between 1 and 100),
  details     text check (char_length(details) <= 500),
  sort_order  integer not null default 0,
  foreign key (event_id, track_id) references public.events (id, track_id) on delete cascade
);

create index event_specials_event_idx on public.event_specials (event_id, sort_order);
create index event_specials_track_idx on public.event_specials (track_id);

-- ---------------------------------------------------------------------------
-- sponsors
-- ---------------------------------------------------------------------------
create table public.sponsors (
  id             uuid primary key default gen_random_uuid(),
  track_id       uuid not null references public.tracks (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 120),
  url            text,
  logo_media_id  uuid,
  tier           text not null default 'supporting'
                   check (tier in ('title', 'presenting', 'associate', 'supporting')),
  active         boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  foreign key (logo_media_id, track_id) references public.media (id, track_id)
    on delete set null (logo_media_id)
);

create index sponsors_track_idx on public.sponsors (track_id, sort_order);

-- ---------------------------------------------------------------------------
-- subscribers: the track's own email list (for email blasts in a later phase)
-- ---------------------------------------------------------------------------
create table public.subscribers (
  id               uuid primary key default gen_random_uuid(),
  track_id         uuid not null references public.tracks (id) on delete cascade,
  email            extensions.citext not null
                     check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  name             text check (char_length(name) <= 120),
  source           text not null default 'website' check (source in ('website', 'import', 'admin')),
  status           text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  consented_at     timestamptz not null default now(),
  unsubscribed_at  timestamptz,
  created_at       timestamptz not null default now(),
  unique (track_id, email)
);

-- ====================================================================
-- supabase/migrations/20260930000200_rls.sql
-- ====================================================================
-- Gridline Track — row-level security, keyed by track_id.
--
-- Model:
--   * A user can manage a track only if they have a row in track_members.
--   * Anonymous visitors can read a track's public content once the track is
--     published; draft events are never public.
--   * Tracks are created through public.create_track() (security definer), which
--     also makes the caller the owner. There is no direct INSERT policy on tracks.

-- ---------------------------------------------------------------------------
-- Helpers (security definer so they can read track_members/tracks without
-- recursing into those tables' own policies).
-- ---------------------------------------------------------------------------
create or replace function public.is_track_member(p_track_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.track_members m
    where m.track_id = p_track_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_track_owner(p_track_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.track_members m
    where m.track_id = p_track_id
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;

create or replace function public.is_track_published(p_track_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select t.published from public.tracks t where t.id = p_track_id), false);
$$;

revoke all on function public.is_track_member(uuid) from public;
revoke all on function public.is_track_owner(uuid) from public;
revoke all on function public.is_track_published(uuid) from public;
grant execute on function public.is_track_member(uuid) to anon, authenticated;
grant execute on function public.is_track_owner(uuid) to anon, authenticated;
grant execute on function public.is_track_published(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.tracks          enable row level security;
alter table public.track_members   enable row level security;
alter table public.brand_kits      enable row level security;
alter table public.media           enable row level security;
alter table public.classes         enable row level security;
alter table public.events          enable row level security;
alter table public.event_classes   enable row level security;
alter table public.event_specials  enable row level security;
alter table public.sponsors        enable row level security;
alter table public.subscribers     enable row level security;

-- ---------------------------------------------------------------------------
-- tracks
-- ---------------------------------------------------------------------------
create policy tracks_select on public.tracks
  for select to anon, authenticated
  using (published or public.is_track_member(id));

create policy tracks_update on public.tracks
  for update to authenticated
  using (public.is_track_member(id))
  with check (public.is_track_member(id));

create policy tracks_delete on public.tracks
  for delete to authenticated
  using (public.is_track_owner(id));

-- ---------------------------------------------------------------------------
-- track_members
-- ---------------------------------------------------------------------------
create policy track_members_select on public.track_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_track_member(track_id));

create policy track_members_owner_write on public.track_members
  for all to authenticated
  using (public.is_track_owner(track_id))
  with check (public.is_track_owner(track_id));

-- ---------------------------------------------------------------------------
-- Tenant content: public read when published, members write.
-- ---------------------------------------------------------------------------
create policy brand_kits_select on public.brand_kits
  for select to anon, authenticated
  using (public.is_track_published(track_id) or public.is_track_member(track_id));
create policy brand_kits_write on public.brand_kits
  for all to authenticated
  using (public.is_track_member(track_id))
  with check (public.is_track_member(track_id));

create policy media_select on public.media
  for select to anon, authenticated
  using (public.is_track_published(track_id) or public.is_track_member(track_id));
create policy media_write on public.media
  for all to authenticated
  using (public.is_track_member(track_id))
  with check (public.is_track_member(track_id));

create policy classes_select on public.classes
  for select to anon, authenticated
  using (public.is_track_published(track_id) or public.is_track_member(track_id));
create policy classes_write on public.classes
  for all to authenticated
  using (public.is_track_member(track_id))
  with check (public.is_track_member(track_id));

create policy sponsors_select on public.sponsors
  for select to anon, authenticated
  using ((active and public.is_track_published(track_id)) or public.is_track_member(track_id));
create policy sponsors_write on public.sponsors
  for all to authenticated
  using (public.is_track_member(track_id))
  with check (public.is_track_member(track_id));

-- Events: drafts are visible to members only.
create policy events_select on public.events
  for select to anon, authenticated
  using (
    (status <> 'draft' and public.is_track_published(track_id))
    or public.is_track_member(track_id)
  );
create policy events_write on public.events
  for all to authenticated
  using (public.is_track_member(track_id))
  with check (public.is_track_member(track_id));

create policy event_classes_select on public.event_classes
  for select to anon, authenticated
  using (
    public.is_track_member(track_id)
    or exists (
      select 1 from public.events e
      where e.id = event_id and e.status <> 'draft' and public.is_track_published(e.track_id)
    )
  );
create policy event_classes_write on public.event_classes
  for all to authenticated
  using (public.is_track_member(track_id))
  with check (public.is_track_member(track_id));

create policy event_specials_select on public.event_specials
  for select to anon, authenticated
  using (
    public.is_track_member(track_id)
    or exists (
      select 1 from public.events e
      where e.id = event_id and e.status <> 'draft' and public.is_track_published(e.track_id)
    )
  );
create policy event_specials_write on public.event_specials
  for all to authenticated
  using (public.is_track_member(track_id))
  with check (public.is_track_member(track_id));

-- ---------------------------------------------------------------------------
-- subscribers: the public can sign up to a published track's list; only
-- members can read or change the list.
-- ---------------------------------------------------------------------------
create policy subscribers_public_signup on public.subscribers
  for insert to anon, authenticated
  with check (
    status = 'subscribed'
    and source = 'website'
    and unsubscribed_at is null
    and public.is_track_published(track_id)
  );
create policy subscribers_member_all on public.subscribers
  for all to authenticated
  using (public.is_track_member(track_id))
  with check (public.is_track_member(track_id));

-- ---------------------------------------------------------------------------
-- create_track(): the only way to create a tenant. Makes the caller owner and
-- seeds a default brand kit.
-- ---------------------------------------------------------------------------
create or replace function public.create_track(
  p_slug text,
  p_name text,
  p_timezone text default 'America/Chicago'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_track_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Light abuse guard: a single account can own a handful of tracks.
  if (select count(*) from public.track_members where user_id = v_uid and role = 'owner') >= 10 then
    raise exception 'track limit reached' using errcode = 'P0001';
  end if;

  if p_timezone is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'invalid timezone' using errcode = '22023';
  end if;

  insert into public.tracks (slug, name, timezone)
  values (lower(trim(p_slug)), trim(p_name), p_timezone)
  returning id into v_track_id;

  insert into public.track_members (track_id, user_id, role)
  values (v_track_id, v_uid, 'owner');

  insert into public.brand_kits (track_id) values (v_track_id);

  return v_track_id;
end;
$$;

revoke all on function public.create_track(text, text, text) from public, anon;
grant execute on function public.create_track(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- save_event_card(): atomically upsert an event with its classes and specials.
-- SECURITY INVOKER, so every statement is still subject to RLS above.
--
--   p_event    : { slug, title, subtitle, event_date, gates_open, hot_laps,
--                  racing_starts, status, rain_date, description, admission,
--                  tickets_url, livestream_url }
--   p_classes  : [{ class_id, purse, is_feature }]
--   p_specials : [{ title, details }]
-- ---------------------------------------------------------------------------
create or replace function public.save_event_card(
  p_track_id uuid,
  p_event_id uuid,
  p_event jsonb,
  p_classes jsonb default '[]'::jsonb,
  p_specials jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event_id uuid;
begin
  if not public.is_track_member(p_track_id) then
    raise exception 'not a member of this track' using errcode = '42501';
  end if;

  if p_event_id is null then
    insert into public.events (
      track_id, slug, title, subtitle, event_date, gates_open, hot_laps,
      racing_starts, status, rain_date, description, admission,
      tickets_url, livestream_url
    ) values (
      p_track_id,
      p_event->>'slug',
      p_event->>'title',
      nullif(p_event->>'subtitle', ''),
      (p_event->>'event_date')::date,
      nullif(p_event->>'gates_open', '')::time,
      nullif(p_event->>'hot_laps', '')::time,
      nullif(p_event->>'racing_starts', '')::time,
      coalesce(nullif(p_event->>'status', ''), 'draft'),
      nullif(p_event->>'rain_date', '')::date,
      nullif(p_event->>'description', ''),
      coalesce(p_event->'admission', '[]'::jsonb),
      nullif(p_event->>'tickets_url', ''),
      nullif(p_event->>'livestream_url', '')
    )
    returning id into v_event_id;
  else
    update public.events set
      slug           = p_event->>'slug',
      title          = p_event->>'title',
      subtitle       = nullif(p_event->>'subtitle', ''),
      event_date     = (p_event->>'event_date')::date,
      gates_open     = nullif(p_event->>'gates_open', '')::time,
      hot_laps       = nullif(p_event->>'hot_laps', '')::time,
      racing_starts  = nullif(p_event->>'racing_starts', '')::time,
      status         = coalesce(nullif(p_event->>'status', ''), 'draft'),
      rain_date      = nullif(p_event->>'rain_date', '')::date,
      description    = nullif(p_event->>'description', ''),
      admission      = coalesce(p_event->'admission', '[]'::jsonb),
      tickets_url    = nullif(p_event->>'tickets_url', ''),
      livestream_url = nullif(p_event->>'livestream_url', '')
    where id = p_event_id and track_id = p_track_id
    returning id into v_event_id;

    if v_event_id is null then
      raise exception 'event not found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.event_classes where event_id = v_event_id;
  insert into public.event_classes (event_id, class_id, track_id, purse, is_feature, sort_order)
  select v_event_id, (x.item->>'class_id')::uuid, p_track_id,
         nullif(trim(x.item->>'purse'), ''),
         coalesce((x.item->>'is_feature')::boolean, false),
         (x.ord - 1)::int
  from jsonb_array_elements(coalesce(p_classes, '[]'::jsonb)) with ordinality as x(item, ord);

  delete from public.event_specials where event_id = v_event_id;
  insert into public.event_specials (event_id, track_id, title, details, sort_order)
  select v_event_id, p_track_id, trim(x.item->>'title'),
         nullif(trim(x.item->>'details'), ''), (x.ord - 1)::int
  from jsonb_array_elements(coalesce(p_specials, '[]'::jsonb)) with ordinality as x(item, ord)
  where coalesce(trim(x.item->>'title'), '') <> '';

  return v_event_id;
end;
$$;

revoke all on function public.save_event_card(uuid, uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_event_card(uuid, uuid, jsonb, jsonb, jsonb) to authenticated;

-- ====================================================================
-- supabase/migrations/20260930000300_storage.sql
-- ====================================================================
-- Gridline Track — storage bucket for track media.
--
-- Objects are stored as  track-media/<track_id>/<file>.
-- The bucket is public-read (logos and photos appear on public sites), but only
-- members of the track in the first path segment can write, replace or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'track-media',
  'track-media',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- True when the first folder of an object path is a track the caller belongs to.
create or replace function public.can_write_track_object(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.track_members m
    where m.user_id = (select auth.uid())
      and m.track_id::text = (storage.foldername(p_name))[1]
  );
$$;

revoke all on function public.can_write_track_object(text) from public;
grant execute on function public.can_write_track_object(text) to authenticated;

create policy "track media: members list"
  on storage.objects for select to authenticated
  using (bucket_id = 'track-media' and public.can_write_track_object(name));

create policy "track media: members upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'track-media' and public.can_write_track_object(name));

create policy "track media: members update"
  on storage.objects for update to authenticated
  using (bucket_id = 'track-media' and public.can_write_track_object(name))
  with check (bucket_id = 'track-media' and public.can_write_track_object(name));

create policy "track media: members delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'track-media' and public.can_write_track_object(name));

-- ====================================================================
-- supabase/migrations/20260930000400_event_links.sql
-- ====================================================================
-- Event card: registration and results links (SPEC section 6, events).
-- Outbound links only; we never pull data from the platforms they point to.
--
-- events.registration_url / results_url: per-event links.
-- tracks.registration_url: track-wide default, used when an event has none
-- (tracks.results_url already exists and serves the same purpose for results).

alter table public.events
  add column if not exists registration_url text,
  add column if not exists results_url text;

alter table public.tracks
  add column if not exists registration_url text;

-- save_event_card(): same as in 0200, now also writing registration_url and results_url.
create or replace function public.save_event_card(
  p_track_id uuid,
  p_event_id uuid,
  p_event jsonb,
  p_classes jsonb default '[]'::jsonb,
  p_specials jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event_id uuid;
begin
  if not public.is_track_member(p_track_id) then
    raise exception 'not a member of this track' using errcode = '42501';
  end if;

  if p_event_id is null then
    insert into public.events (
      track_id, slug, title, subtitle, event_date, gates_open, hot_laps,
      racing_starts, status, rain_date, description, admission,
      tickets_url, livestream_url, registration_url, results_url
    ) values (
      p_track_id,
      p_event->>'slug',
      p_event->>'title',
      nullif(p_event->>'subtitle', ''),
      (p_event->>'event_date')::date,
      nullif(p_event->>'gates_open', '')::time,
      nullif(p_event->>'hot_laps', '')::time,
      nullif(p_event->>'racing_starts', '')::time,
      coalesce(nullif(p_event->>'status', ''), 'draft'),
      nullif(p_event->>'rain_date', '')::date,
      nullif(p_event->>'description', ''),
      coalesce(p_event->'admission', '[]'::jsonb),
      nullif(p_event->>'tickets_url', ''),
      nullif(p_event->>'livestream_url', ''),
      nullif(p_event->>'registration_url', ''),
      nullif(p_event->>'results_url', '')
    )
    returning id into v_event_id;
  else
    update public.events set
      slug           = p_event->>'slug',
      title          = p_event->>'title',
      subtitle       = nullif(p_event->>'subtitle', ''),
      event_date     = (p_event->>'event_date')::date,
      gates_open     = nullif(p_event->>'gates_open', '')::time,
      hot_laps       = nullif(p_event->>'hot_laps', '')::time,
      racing_starts  = nullif(p_event->>'racing_starts', '')::time,
      status         = coalesce(nullif(p_event->>'status', ''), 'draft'),
      rain_date      = nullif(p_event->>'rain_date', '')::date,
      description    = nullif(p_event->>'description', ''),
      admission      = coalesce(p_event->'admission', '[]'::jsonb),
      tickets_url    = nullif(p_event->>'tickets_url', ''),
      livestream_url = nullif(p_event->>'livestream_url', ''),
      registration_url = nullif(p_event->>'registration_url', ''),
      results_url    = nullif(p_event->>'results_url', '')
    where id = p_event_id and track_id = p_track_id
    returning id into v_event_id;

    if v_event_id is null then
      raise exception 'event not found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.event_classes where event_id = v_event_id;
  insert into public.event_classes (event_id, class_id, track_id, purse, is_feature, sort_order)
  select v_event_id, (x.item->>'class_id')::uuid, p_track_id,
         nullif(trim(x.item->>'purse'), ''),
         coalesce((x.item->>'is_feature')::boolean, false),
         (x.ord - 1)::int
  from jsonb_array_elements(coalesce(p_classes, '[]'::jsonb)) with ordinality as x(item, ord);

  delete from public.event_specials where event_id = v_event_id;
  insert into public.event_specials (event_id, track_id, title, details, sort_order)
  select v_event_id, p_track_id, trim(x.item->>'title'),
         nullif(trim(x.item->>'details'), ''), (x.ord - 1)::int
  from jsonb_array_elements(coalesce(p_specials, '[]'::jsonb)) with ordinality as x(item, ord)
  where coalesce(trim(x.item->>'title'), '') <> '';

  return v_event_id;
end;
$$;

-- ====================================================================
-- supabase/seed.sql
-- ====================================================================
-- Demo data for local development: a published track you can view at
--   http://thunder-valley.localhost:3000
-- It has no owner. To manage it from /admin, sign up, then run:
--   insert into public.track_members (track_id, user_id, role)
--   select '00000000-0000-4000-8000-000000000001', id, 'owner'
--   from auth.users where email = 'you@example.com';
--
-- Event dates are relative to the day you seed, so there is always an upcoming race.

insert into public.tracks (id, slug, name, tagline, city, region, address, timezone,
                           tickets_url, facebook_url, instagram_url, published)
values (
  '00000000-0000-4000-8000-000000000001',
  'thunder-valley',
  'Thunder Valley Speedway',
  '3/8-mile high-banked clay. Saturday nights since 1968.',
  'Millbrook', 'IA', '4410 County Road 12, Millbrook, IA',
  'America/Chicago',
  'https://example.com/tickets',
  'https://facebook.com/',
  'https://instagram.com/',
  true
)
on conflict (id) do nothing;

insert into public.brand_kits (track_id, primary_color, secondary_color, accent_color, font_pair, template)
values ('00000000-0000-4000-8000-000000000001', '#E10600', '#0B0B0C', '#FFD400', 'oswald-inter', 'pitboard')
on conflict (track_id) do nothing;

insert into public.classes (id, track_id, name, short_name, sort_order) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001', 'Late Models',     'LM',   0),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-000000000001', 'Modifieds',       'MOD',  1),
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-4000-8000-000000000001', 'Street Stocks',   'SS',   2),
  ('00000000-0000-4000-8000-0000000000c4', '00000000-0000-4000-8000-000000000001', 'Hobby Stocks',    'HS',   3),
  ('00000000-0000-4000-8000-0000000000c5', '00000000-0000-4000-8000-000000000001', 'Sport Compacts',  'SC',   4)
on conflict do nothing;

insert into public.events (id, track_id, slug, title, subtitle, event_date, gates_open, hot_laps,
                           racing_starts, status, description, admission, tickets_url)
values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000001',
   'fan-appreciation-night', 'Fan Appreciation Night', 'Season points night 18',
   current_date + 3, '16:00', '18:00', '19:00', 'scheduled',
   'Our biggest night of the summer. Autograph session on the front stretch at intermission, fireworks after the Late Model feature.',
   '[{"label":"Adults","price":"$15"},{"label":"Seniors / Military","price":"$12"},{"label":"Kids 12 & under","price":"FREE"},{"label":"Pit pass","price":"$35"}]',
   'https://example.com/tickets'),
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-000000000001',
   'harvest-100', 'Harvest 100', 'Late Model special — 100 laps',
   current_date + 10, '15:30', '17:30', '18:30', 'scheduled',
   'One hundred laps for the Late Models with a $5,000 top prize.',
   '[{"label":"Adults","price":"$25"},{"label":"Kids 12 & under","price":"$5"},{"label":"Pit pass","price":"$40"}]',
   null),
  ('00000000-0000-4000-8000-0000000000e3', '00000000-0000-4000-8000-000000000001',
   'season-championship', 'Season Championship', 'Points finale',
   current_date + 17, '16:00', '18:00', '19:00', 'scheduled',
   null,
   '[{"label":"Adults","price":"$15"},{"label":"Kids 12 & under","price":"FREE"}]',
   null),
  ('00000000-0000-4000-8000-0000000000e4', '00000000-0000-4000-8000-000000000001',
   'kids-night', 'Kids Night', null,
   current_date - 4, '16:00', '18:00', '19:00', 'completed',
   null, '[]', null)
on conflict do nothing;

insert into public.event_classes (event_id, class_id, track_id, purse, is_feature, sort_order) values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001', '$1,500 to win', true,  0),
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-000000000001', '$800 to win',   false, 1),
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c3', '00000000-0000-4000-8000-000000000001', '$400 to win',   false, 2),
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c4', '00000000-0000-4000-8000-000000000001', null,            false, 3),
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001', '$5,000 to win', true,  0),
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000c5', '00000000-0000-4000-8000-000000000001', null,            false, 1),
  ('00000000-0000-4000-8000-0000000000e3', '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001', null,            true,  0),
  ('00000000-0000-4000-8000-0000000000e3', '00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-000000000001', null,            false, 1),
  ('00000000-0000-4000-8000-0000000000e3', '00000000-0000-4000-8000-0000000000c3', '00000000-0000-4000-8000-000000000001', null,            false, 2)
on conflict do nothing;

insert into public.event_specials (event_id, track_id, title, details, sort_order) values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000001', 'Fireworks', 'Right after the Late Model feature.', 0),
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000001', '$2 hot dogs', 'All night at the main concession stand.', 1),
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-000000000001', 'Pit party', 'Fans on the track 5:00–5:45 PM.', 0);

insert into public.sponsors (track_id, name, url, tier, sort_order) values
  ('00000000-0000-4000-8000-000000000001', 'Millbrook Tire & Auto', 'https://example.com', 'title', 0),
  ('00000000-0000-4000-8000-000000000001', 'County Line Coop', 'https://example.com', 'presenting', 1);
