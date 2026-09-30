-- RLS smoke test. Run via scripts/test-db.sh; read the output: lines marked 'expect' should error or affect 0 rows.
\set ON_ERROR_STOP 0
insert into auth.users (id, email) values ('aaaaaaaa-0000-4000-8000-000000000001','a@x.com'),('bbbbbbbb-0000-4000-8000-000000000002','b@x.com');

create or replace function pg_temp.as_user(u text) returns void language plpgsql as $$
begin
  if u is null then perform set_config('role','anon',false); perform set_config('request.jwt.claims','',false);
  else perform set_config('role','authenticated',false); perform set_config('request.jwt.claims', json_build_object('sub',u)::text, false); end if;
end $$;

\echo '--- 1. anon on seeded published track'
select pg_temp.as_user(null);
select slug from tracks;
select slug, status from events order by event_date;
select count(*) as event_classes_visible from event_classes;
update events set title='hacked';           -- expect UPDATE 0
select count(*) as anon_subscribers_visible from subscribers;
insert into subscribers (track_id, email) values ('00000000-0000-4000-8000-000000000001','fan@example.com'); -- ok
insert into subscribers (track_id, email, status) values ('00000000-0000-4000-8000-000000000001','x@example.com','unsubscribed'); -- expect RLS error
select create_track('nope','Nope'); -- expect permission denied

\echo '--- 2. user A creates a track'
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select create_track('eagle-raceway','Eagle Raceway','America/Chicago') as a_track \gset
select create_track('admin','Bad') ; -- reserved: expect check violation
select create_track('Eagle Raceway!','Bad'); -- bad format
insert into tracks (slug,name) values ('direct-insert','X'); -- expect RLS error
select slug, published from tracks order by slug;
select role from track_members;
insert into classes (track_id,name) values (:'a_track','Late Models') returning id as a_class \gset
select save_event_card(:'a_track', null,
  '{"slug":"opener","title":"Season Opener","event_date":"2027-04-10","gates_open":"16:00","status":"draft","admission":[{"label":"Adults","price":"$10"}]}',
  json_build_array(json_build_object('class_id', :'a_class', 'purse','$500 to win','is_feature',true))::jsonb,
  '[{"title":"Fireworks","details":"after feature"},{"title":"  "}]') as a_event \gset
select title, status, gates_open, admission from events where id = :'a_event';
select purse, is_feature, sort_order from event_classes where event_id = :'a_event';
select title from event_specials where event_id = :'a_event';
-- try to link the seeded track's class into A's event: expect FK violation
insert into event_classes (event_id,class_id,track_id) values (:'a_event','00000000-0000-4000-8000-0000000000c2',:'a_track');
-- try to write into seeded (not-member) track: expect RLS error
insert into classes (track_id,name) values ('00000000-0000-4000-8000-000000000001','Sneaky');
update tracks set name='Mine now' where id='00000000-0000-4000-8000-000000000001'; -- expect UPDATE 0
-- storage
insert into storage.objects (bucket_id,name) values ('track-media', :'a_track' || '/logo.png'); -- ok
insert into storage.objects (bucket_id,name) values ('track-media', '00000000-0000-4000-8000-000000000001/logo.png'); -- expect RLS error
insert into storage.objects (bucket_id,name) values ('track-media', 'logo.png'); -- expect RLS error
-- media row path must be in track folder
insert into media (track_id,path,kind) values (:'a_track','elsewhere/logo.png','logo'); -- expect check violation
insert into media (track_id,path,kind) values (:'a_track', :'a_track' || '/logo.png','logo') returning id as a_media \gset
update brand_kits set logo_media_id = :'a_media', primary_color='#123456' where track_id = :'a_track';
update brand_kits set primary_color='red' where track_id = :'a_track'; -- expect check violation

\echo '--- 3. user B cannot see or touch A'
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select slug from tracks order by slug;   -- only thunder-valley
select count(*) as b_sees_a_events from events where track_id = :'a_track';
select save_event_card(:'a_track', :'a_event', '{"slug":"x","title":"Hijack","event_date":"2027-01-01"}'); -- expect not a member
update brand_kits set primary_color='#000000' where track_id = :'a_track'; -- UPDATE 0
insert into track_members (track_id,user_id,role) values (:'a_track','bbbbbbbb-0000-4000-8000-000000000002','owner'); -- expect RLS error
select count(*) as b_sees_seed_subscribers from subscribers;

\echo '--- 4. anon cannot see unpublished A; after publish sees only non-draft'
select pg_temp.as_user(null);
select count(*) as anon_sees_a from tracks where id = :'a_track';
insert into subscribers (track_id,email) values (:'a_track','fan@example.com'); -- expect RLS error (unpublished)
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
update tracks set published = true where id = :'a_track';
select pg_temp.as_user(null);
select count(*) as anon_sees_a from tracks where id = :'a_track';
select count(*) as anon_sees_a_draft_events from events where track_id = :'a_track';
select count(*) as anon_sees_a_draft_classes from event_classes where track_id = :'a_track';
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select save_event_card(:'a_track', :'a_event', '{"slug":"opener","title":"Season Opener","event_date":"2027-04-10","status":"scheduled"}', '[]', '[]');
select pg_temp.as_user(null);
select count(*) as anon_sees_a_sched_events from events where track_id = :'a_track';
select count(*) as a_classes_after_replace from event_classes where event_id = :'a_event';

\echo '--- 5. event card links (registration/results) round-trip through save_event_card'
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select save_event_card(:'a_track', :'a_event', '{"slug":"opener","title":"Season Opener","event_date":"2027-04-10","status":"scheduled","registration_url":"https://example.com/register","results_url":"https://example.com/results"}', '[]', '[]');
select registration_url, results_url from events where id = :'a_event';
