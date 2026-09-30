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
