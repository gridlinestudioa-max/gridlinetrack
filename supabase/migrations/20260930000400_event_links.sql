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
