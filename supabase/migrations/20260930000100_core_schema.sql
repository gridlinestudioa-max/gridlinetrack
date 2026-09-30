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
