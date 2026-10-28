-- Private buckets for portfolio images and brief photos; limits are enforced by Storage itself.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolio', 'portfolio', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('briefs', 'briefs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- Any logged-in user reads (kept broad for the demo); only the owner of the {user_id}/ folder writes.
-- No UPDATE policy: uploads use upsert: false.
create policy portfolio_select on storage.objects
  for select to authenticated using (bucket_id = 'portfolio');
create policy portfolio_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy portfolio_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy briefs_select on storage.objects
  for select to authenticated using (bucket_id = 'briefs');
create policy briefs_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'briefs' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy briefs_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'briefs' and (storage.foldername(name))[1] = (select auth.uid()::text));
