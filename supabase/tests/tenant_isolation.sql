-- Tenant isolation test: data from track A never reaches track B (and vice versa).
--
-- Pass/fail: any failed check raises an exception, psql stops (ON_ERROR_STOP)
-- and exits non-zero. Run via scripts/test-db.sh (locally or in GitHub Actions)
-- against a throwaway database with supabase/tests/stub_supabase.sql + migrations.
--
-- Two owners each create a track and fill it with every kind of tenant data.
-- Then, as each owner, as a stranger and as an anonymous visitor, we try to read
-- and write the other track's data every way the API allows.

\set ON_ERROR_STOP 1
\set QUIET 1

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function pg_temp.act_as(p_user uuid) returns void language plpgsql as $$
begin
  if p_user is null then
    perform set_config('role', 'anon', false);
    perform set_config('request.jwt.claims', '', false);
  else
    perform set_config('role', 'authenticated', false);
    perform set_config('request.jwt.claims', json_build_object('sub', p_user)::text, false);
  end if;
end $$;

create or replace function pg_temp.pass(p_label text) returns void language plpgsql as $$
begin
  raise notice 'PASS  %', p_label;
end $$;

-- Row count a query returns for the current role.
create or replace function pg_temp.check_count(p_label text, p_sql text, p_expected bigint) returns void
language plpgsql as $$
declare n bigint;
begin
  execute format('select count(*) from (%s) q', p_sql) into n;
  if n <> p_expected then
    raise exception 'FAIL  % (expected % rows, got %)', p_label, p_expected, n;
  end if;
  perform pg_temp.pass(p_label);
end $$;

-- A write that must be rejected by the security rules. Only permission,
-- cross-track foreign key and not-found errors count: a typo in the test
-- (syntax error, unknown column...) fails the test instead of passing it.
create or replace function pg_temp.check_rejected(p_label text, p_sql text) returns void
language plpgsql as $$
declare state text;
begin
  begin
    execute p_sql;
  exception when others then
    state := sqlstate;
  end;
  if state is null then
    raise exception 'FAIL  % (statement succeeded but should have been rejected)', p_label;
  end if;
  -- 42501 permission / RLS, 23503 cross-track foreign key, P0002 not found (save_event_card)
  if state not in ('42501', '23503', 'P0002') then
    raise exception 'FAIL  % (rejected for the wrong reason: SQLSTATE %)', p_label, state;
  end if;
  perform pg_temp.pass(p_label);
end $$;

-- An UPDATE/DELETE that must silently affect nothing (RLS hides the rows).
create or replace function pg_temp.check_no_rows_changed(p_label text, p_sql text) returns void
language plpgsql as $$
declare n bigint;
begin
  execute p_sql;
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'FAIL  % (changed % rows, expected 0)', p_label, n;
  end if;
  perform pg_temp.pass(p_label);
end $$;

-- A write that must succeed.
create or replace function pg_temp.check_allowed(p_label text, p_sql text) returns void
language plpgsql as $$
begin
  execute p_sql;
  perform pg_temp.pass(p_label);
end $$;

-- ---------------------------------------------------------------------------
-- Fixtures: owner A, owner B, and a signed-in stranger who owns nothing.
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-00000000000a', 'owner-a@example.com'),
  ('b0000000-0000-4000-8000-00000000000b', 'owner-b@example.com'),
  ('c0000000-0000-4000-8000-00000000000c', 'stranger@example.com');

create temp table fx (name text primary key, id uuid);
grant select on fx to anon, authenticated;

-- Build one fully populated track as its owner (so member writes are tested too).
create or replace function pg_temp.build_track(p_owner uuid, p_tag text) returns void
language plpgsql as $$
declare t uuid; c uuid; e_pub uuid; e_draft uuid; m uuid;
begin
  perform pg_temp.act_as(p_owner);
  t := public.create_track('iso-' || p_tag, 'Isolation ' || upper(p_tag));
  insert into public.classes (track_id, name, short_name) values (t, 'Class ' || p_tag, upper(p_tag)) returning id into c;
  e_pub := public.save_event_card(t, null,
    jsonb_build_object('slug', 'public-' || p_tag, 'title', 'Public ' || p_tag, 'event_date', '2027-05-01', 'status', 'scheduled'),
    jsonb_build_array(jsonb_build_object('class_id', c, 'purse', '$100')),
    '[{"title":"Special"}]');
  e_draft := public.save_event_card(t, null,
    jsonb_build_object('slug', 'draft-' || p_tag, 'title', 'Draft ' || p_tag, 'event_date', '2027-05-08', 'status', 'draft'),
    jsonb_build_array(jsonb_build_object('class_id', c)),
    '[{"title":"Secret special"}]');
  insert into storage.objects (bucket_id, name) values ('track-media', t || '/logo.png');
  insert into public.media (track_id, path, kind) values (t, t || '/logo.png', 'logo') returning id into m;
  update public.brand_kits set logo_media_id = m where track_id = t;
  insert into public.sponsors (track_id, name) values (t, 'Sponsor ' || p_tag);
  insert into public.subscribers (track_id, email, source) values (t, 'fan-' || p_tag || '@example.com', 'admin');

  perform set_config('role', 'postgres', false);
  insert into fx values
    ('track_' || p_tag, t), ('class_' || p_tag, c), ('event_' || p_tag, e_pub),
    ('draft_' || p_tag, e_draft), ('media_' || p_tag, m);
end $$;

select pg_temp.build_track('a0000000-0000-4000-8000-00000000000a', 'a');
select pg_temp.build_track('b0000000-0000-4000-8000-00000000000b', 'b');
reset role;

-- ---------------------------------------------------------------------------
-- The checks, run once in each direction: `me` tries to reach `other`'s track.
-- ---------------------------------------------------------------------------
create or replace function pg_temp.check_isolation(p_me uuid, p_mine text, p_other text) returns void
language plpgsql as $$
declare
  me_track uuid := (select id from fx where name = 'track_' || p_mine);
  track uuid := (select id from fx where name = 'track_' || p_other);
  class uuid := (select id from fx where name = 'class_' || p_other);
  event uuid := (select id from fx where name = 'event_' || p_other);
  draft uuid := (select id from fx where name = 'draft_' || p_other);
  media uuid := (select id from fx where name = 'media_' || p_other);
  my_event uuid := (select id from fx where name = 'event_' || p_mine);
  who text := format('[%s -> %s]', p_mine, p_other);
begin
  perform pg_temp.act_as(p_me);

  -- Sanity: I still see my own data.
  perform pg_temp.check_count(who || ' sees own track', format('select 1 from tracks where id = %L', me_track), 1);
  perform pg_temp.check_count(who || ' sees own draft events', format('select 1 from events where track_id = %L and status = ''draft''', me_track), 1);
  perform pg_temp.check_count(who || ' sees own subscribers', format('select 1 from subscribers where track_id = %L', me_track), 1);

  -- Reads: the other track is unpublished, so nothing of it is visible.
  perform pg_temp.check_count(who || ' cannot read track', format('select 1 from tracks where id = %L', track), 0);
  perform pg_temp.check_count(who || ' cannot read brand kit', format('select 1 from brand_kits where track_id = %L', track), 0);
  perform pg_temp.check_count(who || ' cannot read classes', format('select 1 from classes where track_id = %L', track), 0);
  perform pg_temp.check_count(who || ' cannot read events', format('select 1 from events where track_id = %L', track), 0);
  perform pg_temp.check_count(who || ' cannot read event classes', format('select 1 from event_classes where track_id = %L', track), 0);
  perform pg_temp.check_count(who || ' cannot read specials', format('select 1 from event_specials where track_id = %L', track), 0);
  perform pg_temp.check_count(who || ' cannot read media', format('select 1 from media where track_id = %L', track), 0);
  perform pg_temp.check_count(who || ' cannot read sponsors', format('select 1 from sponsors where track_id = %L', track), 0);
  perform pg_temp.check_count(who || ' cannot read subscribers', format('select 1 from subscribers where track_id = %L', track), 0);
  perform pg_temp.check_count(who || ' cannot read members', format('select 1 from track_members where track_id = %L', track), 0);
  perform pg_temp.check_count(who || ' cannot list storage objects', format('select 1 from storage.objects where name like %L', track || '/%'), 0);

  -- Writes into the other track are rejected.
  perform pg_temp.check_rejected(who || ' cannot add class', format('insert into classes (track_id, name) values (%L, ''Sneaky'')', track));
  perform pg_temp.check_rejected(who || ' cannot add event', format('insert into events (track_id, slug, title, event_date) values (%L, ''x'', ''Sneaky'', ''2027-01-01'')', track));
  perform pg_temp.check_rejected(who || ' cannot add special', format('insert into event_specials (event_id, track_id, title) values (%L, %L, ''Sneaky'')', event, track));
  perform pg_temp.check_rejected(who || ' cannot add sponsor', format('insert into sponsors (track_id, name) values (%L, ''Sneaky'')', track));
  perform pg_temp.check_rejected(who || ' cannot add media row', format('insert into media (track_id, path) values (%L, %L)', track, track || '/x.png'));
  perform pg_temp.check_rejected(who || ' cannot add subscriber via admin', format('insert into subscribers (track_id, email, source) values (%L, ''x@example.com'', ''admin'')', track));
  perform pg_temp.check_rejected(who || ' cannot join as member', format('insert into track_members (track_id, user_id, role) values (%L, %L, ''owner'')', track, p_me));
  perform pg_temp.check_rejected(who || ' cannot upload to storage folder', format('insert into storage.objects (bucket_id, name) values (''track-media'', %L)', track || '/evil.png'));
  perform pg_temp.check_rejected(who || ' cannot save event card (new)', format(
    'select save_event_card(%L, null, ''{"slug":"x","title":"Sneaky","event_date":"2027-01-01"}'')', track));
  perform pg_temp.check_rejected(who || ' cannot save event card (edit)', format(
    'select save_event_card(%L, %L, ''{"slug":"x","title":"Hijacked","event_date":"2027-01-01"}'')', track, event));

  -- Cross-links from my own track to the other track's rows are rejected.
  perform pg_temp.check_rejected(who || ' cannot put their class on my event', format(
    'insert into event_classes (event_id, class_id, track_id) values (%L, %L, %L)', my_event, class, me_track));
  perform pg_temp.check_rejected(who || ' cannot put their class on my card via RPC', format(
    'select save_event_card(%L, %L, ''{"slug":"x","title":"Mine","event_date":"2027-01-01","status":"scheduled"}'', %L)',
    me_track, my_event, jsonb_build_array(jsonb_build_object('class_id', class))));
  perform pg_temp.check_rejected(who || ' cannot use their logo in my brand kit', format(
    'update brand_kits set logo_media_id = %L where track_id = %L', media, me_track));
  perform pg_temp.check_rejected(who || ' cannot edit their event by claiming my track', format(
    'select save_event_card(%L, %L, ''{"slug":"x","title":"Hijacked","event_date":"2027-01-01"}'')', me_track, event));

  -- Updates/deletes against the other track touch nothing.
  perform pg_temp.check_no_rows_changed(who || ' cannot rename track', format('update tracks set name = ''Hijacked'' where id = %L', track));
  perform pg_temp.check_no_rows_changed(who || ' cannot publish track', format('update tracks set published = true where id = %L', track));
  perform pg_temp.check_no_rows_changed(who || ' cannot change brand kit', format('update brand_kits set primary_color = ''#000000'' where track_id = %L', track));
  perform pg_temp.check_no_rows_changed(who || ' cannot edit event', format('update events set title = ''Hijacked'' where track_id = %L', track));
  perform pg_temp.check_no_rows_changed(who || ' cannot delete events', format('delete from events where track_id = %L', track));
  perform pg_temp.check_no_rows_changed(who || ' cannot delete classes', format('delete from classes where track_id = %L', track));
  perform pg_temp.check_no_rows_changed(who || ' cannot delete subscribers', format('delete from subscribers where track_id = %L', track));
  perform pg_temp.check_no_rows_changed(who || ' cannot delete track', format('delete from tracks where id = %L', track));
  perform pg_temp.check_no_rows_changed(who || ' cannot delete storage objects', format('delete from storage.objects where name like %L', track || '/%'));

  -- Published: the other track's public content becomes visible, private data does not.
  perform set_config('role', 'postgres', false);
  update public.tracks set published = true where id = track;
  perform pg_temp.act_as(p_me);
  perform pg_temp.check_count(who || ' (published) reads track', format('select 1 from tracks where id = %L', track), 1);
  perform pg_temp.check_count(who || ' (published) reads only non-draft events', format('select 1 from events where track_id = %L', track), 1);
  perform pg_temp.check_count(who || ' (published) cannot read draft event', format('select 1 from events where id = %L', draft), 0);
  perform pg_temp.check_count(who || ' (published) cannot read draft card classes', format('select 1 from event_classes where event_id = %L', draft), 0);
  perform pg_temp.check_count(who || ' (published) cannot read draft specials', format('select 1 from event_specials where event_id = %L', draft), 0);
  perform pg_temp.check_count(who || ' (published) still cannot read subscribers', format('select 1 from subscribers where track_id = %L', track), 0);
  perform pg_temp.check_count(who || ' (published) still cannot read members', format('select 1 from track_members where track_id = %L', track), 0);
  perform pg_temp.check_no_rows_changed(who || ' (published) still cannot edit event', format('update events set title = ''Hijacked'' where track_id = %L', track));
  perform pg_temp.check_rejected(who || ' (published) still cannot add class', format('insert into classes (track_id, name) values (%L, ''Sneaky'')', track));

  perform set_config('role', 'postgres', false);
  update public.tracks set published = false where id = track;
end $$;

select pg_temp.check_isolation('a0000000-0000-4000-8000-00000000000a', 'a', 'b');
reset role;
select pg_temp.check_isolation('b0000000-0000-4000-8000-00000000000b', 'b', 'a');
reset role;

-- ---------------------------------------------------------------------------
-- A signed-in user with no tracks, and an anonymous visitor.
-- ---------------------------------------------------------------------------
create or replace function pg_temp.check_outsiders() returns void language plpgsql as $$
declare
  ta uuid := (select id from fx where name = 'track_a');
  tb uuid := (select id from fx where name = 'track_b');
begin
  -- Stranger (signed in, owns nothing)
  perform pg_temp.act_as('c0000000-0000-4000-8000-00000000000c');
  perform pg_temp.check_count('[stranger] sees no unpublished tracks', format('select 1 from tracks where id in (%L, %L)', ta, tb), 0);
  perform pg_temp.check_count('[stranger] sees no subscribers', 'select 1 from subscribers', 0);
  perform pg_temp.check_count('[stranger] sees no memberships', 'select 1 from track_members', 0);
  perform pg_temp.check_rejected('[stranger] cannot join track A', format(
    'insert into track_members (track_id, user_id, role) values (%L, ''c0000000-0000-4000-8000-00000000000c'', ''owner'')', ta));
  perform pg_temp.check_rejected('[stranger] cannot create a track directly', 'insert into tracks (slug, name) values (''sneaky'', ''Sneaky'')');

  -- Anonymous visitor
  perform pg_temp.act_as(null);
  perform pg_temp.check_count('[anon] sees no unpublished tracks', format('select 1 from tracks where id in (%L, %L)', ta, tb), 0);
  perform pg_temp.check_count('[anon] sees no subscribers', 'select 1 from subscribers', 0);
  perform pg_temp.check_rejected('[anon] cannot create tracks', 'select create_track(''anon-track'', ''Anon'')');
  perform pg_temp.check_rejected('[anon] cannot save event cards', format(
    'select save_event_card(%L, null, ''{"slug":"x","title":"Anon","event_date":"2027-01-01"}'')', ta));
  perform pg_temp.check_rejected('[anon] cannot sign up to unpublished track', format(
    'insert into subscribers (track_id, email) values (%L, ''fan@example.com'')', ta));

  perform set_config('role', 'postgres', false);
  update public.tracks set published = true where id = ta;
  perform pg_temp.act_as(null);
  perform pg_temp.check_count('[anon] reads published track', format('select 1 from tracks where id = %L', ta), 1);
  perform pg_temp.check_count('[anon] reads only non-draft events', format('select 1 from events where track_id = %L', ta), 1);
  perform pg_temp.check_allowed('[anon] can sign up to published track', format(
    'insert into subscribers (track_id, email) values (%L, ''new-fan@example.com'')', ta));
  perform pg_temp.check_rejected('[anon] cannot sign up as already-unsubscribed', format(
    'insert into subscribers (track_id, email, status) values (%L, ''x@example.com'', ''unsubscribed'')', ta));
  perform pg_temp.check_count('[anon] still cannot read subscribers after signing up', 'select 1 from subscribers', 0);
  perform pg_temp.check_no_rows_changed('[anon] cannot edit published events', format('update events set title = ''Hijacked'' where track_id = %L', ta));

  perform set_config('role', 'postgres', false);
end $$;

select pg_temp.check_outsiders();
reset role;

-- Nothing in either track was changed by the attempts above.
do $$
begin
  if exists (select 1 from public.tracks where name = 'Hijacked')
     or exists (select 1 from public.events where title in ('Hijacked', 'Sneaky', 'Anon'))
     or exists (select 1 from public.classes where name = 'Sneaky')
     or (select count(*) from public.track_members) <> 2 then
    raise exception 'FAIL  data was modified by a cross-tenant attempt';
  end if;
  raise notice 'PASS  final state untouched';
  raise notice 'ALL TENANT ISOLATION CHECKS PASSED';
end $$;
