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
