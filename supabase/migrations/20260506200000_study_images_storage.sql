-- Storage bucket for blog-style study post images.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'study-images',
  'study-images',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Study images are publicly readable" on storage.objects;
create policy "Study images are publicly readable"
on storage.objects
for select
using (bucket_id = 'study-images');

drop policy if exists "Active members can upload study images" on storage.objects;
create policy "Active members can upload study images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'study-images'
  and public.current_user_is_active_member()
);
