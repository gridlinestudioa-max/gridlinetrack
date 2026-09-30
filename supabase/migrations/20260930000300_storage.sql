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
