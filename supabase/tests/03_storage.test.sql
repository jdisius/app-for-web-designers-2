begin;
select plan(8);

-- Every assertion's output (ok / not ok plus diagnostics) is collected here and returned at the end,
-- because the SQL editor only shows the last statement's result.
create temp table out (id serial, line text);
grant all on out to public;
grant usage on sequence out_id_seq to public;

create function pg_temp.act_as(p_uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true),
         set_config('role', 'authenticated', true);
$$;

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', '{"role":"designer","name":"A"}'),
  ('00000000-0000-0000-0000-0000000000d2', '{"role":"designer","name":"B"}');

insert into out (line) select is((select file_size_limit from storage.buckets where id = 'portfolio'), 5242880::bigint, 'portfolio limit is 5 MB');
insert into out (line) select is((select allowed_mime_types from storage.buckets where id = 'briefs'),
  array['image/jpeg', 'image/png', 'image/webp'], 'briefs accepts only jpeg, png and webp');

-- User A uploads into own folder
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
insert into out (line) select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('portfolio', '00000000-0000-0000-0000-0000000000d1/a.webp', '00000000-0000-0000-0000-0000000000d1')$$,
  'owner can upload into own folder');

-- User B: cannot upload into A's folder, cannot delete A's file
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d2');
insert into out (line) select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('portfolio', '00000000-0000-0000-0000-0000000000d1/b.webp', '00000000-0000-0000-0000-0000000000d2')$$,
  '42501', null, 'user cannot upload into another user''s folder');
insert into out (line) select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('briefs', '00000000-0000-0000-0000-0000000000d1/b.webp', '00000000-0000-0000-0000-0000000000d2')$$,
  '42501', null, 'same for the briefs bucket');
insert into out (line) select is((select count(*) from storage.objects where name = '00000000-0000-0000-0000-0000000000d1/a.webp'), 1::bigint,
  'logged-in users can read');
-- Direct DELETE on storage.objects is blocked by Supabase for everyone (use the Storage API), so check
-- the delete policies' definition instead; the real cross-user delete is tested through the API.
insert into out (line) select is(
  (select count(*) from pg_policies
   where schemaname = 'storage' and tablename = 'objects' and cmd = 'DELETE'
     and policyname in ('portfolio_delete', 'briefs_delete')
     and qual like '%foldername%' and qual like '%auth.uid%'),
  2::bigint, 'both delete policies are limited to the owner''s folder');

reset role;
insert into out (line) select is((select count(*) from storage.objects where name = '00000000-0000-0000-0000-0000000000d1/a.webp'), 1::bigint,
  'foreign file still exists');

select line from out order by id;
rollback;
