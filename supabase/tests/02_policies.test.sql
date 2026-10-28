begin;
select plan(27);

create function pg_temp.act_as(p_uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true),
         set_config('role', 'authenticated', true);
$$;

-- Seed as the table owner: designers d1, d2; customers c1, c2.
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', '{"role":"designer","name":"Dana1"}'),
  ('00000000-0000-0000-0000-0000000000d2', '{"role":"designer","name":"Dana2"}'),
  ('00000000-0000-0000-0000-0000000000c1', '{"role":"customer","name":"Cyril1"}'),
  ('00000000-0000-0000-0000-0000000000c2', '{"role":"customer","name":"Cyril2"}');
insert into public.briefs (id, customer_id, image_url, deadline, budget, description, status) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1', 'p', current_date, 1000, 'one', 'open'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000c2', 'p', current_date, 2000, 'two', 'open'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000c1', 'p', current_date, 3000, 'three', 'taken');
insert into public.swipes (designer_id, brief_id, liked) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', true),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b1', true),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b2', false);

-- Designer d1
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select is((select count(*) from public.briefs), 2::bigint, 'designer sees only open briefs');
select throws_ok(
  $$insert into public.swipes (designer_id, brief_id, liked)
    values ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b2', true)$$,
  '42501', null, 'designer cannot swipe for another designer');
select throws_ok(
  $$insert into public.briefs (customer_id, image_url, deadline, budget, description)
    values ('00000000-0000-0000-0000-0000000000d1', 'p', current_date, 1, 'x')$$,
  '42501', null, 'designer cannot create a brief');
select throws_ok($$delete from public.swipes$$, '42501', null, 'swipes cannot be deleted');
select lives_ok($$update public.profiles set name = 'hacked' where id = '00000000-0000-0000-0000-0000000000d2'$$,
  'updating another profile is allowed to run (changes 0 rows)');

-- Designer d2
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d2');
select lives_ok(
  $$insert into public.swipes (designer_id, brief_id, liked)
    values ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b2', true)$$,
  'designer can swipe on an open brief');
select throws_ok(
  $$insert into public.swipes (designer_id, brief_id, liked)
    values ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b3', true)$$,
  '42501', null, 'designer cannot swipe on a taken brief');

-- Customer c2 (owns b2 only)
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c2');
select is((select count(*) from public.briefs where id = '00000000-0000-0000-0000-0000000000b1'), 0::bigint,
  'customer cannot see another customer''s brief');
select is((select count(*) from public.swipes where brief_id = '00000000-0000-0000-0000-0000000000b1'), 0::bigint,
  'customer cannot see swipes on another customer''s brief');
select lives_ok($$update public.briefs set description = 'hacked' where id = '00000000-0000-0000-0000-0000000000b1'$$,
  'updating another customer''s brief runs (changes 0 rows)');
select throws_ok(
  $$insert into public.selections (brief_id, designer_id)
    values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000d2')$$,
  '42501', null, 'no direct insert on selections');
select throws_ok(
  $$select public.select_designer('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d1')$$,
  'P0001', 'not_brief_owner', 'RPC rejects a caller who is not the brief author');
select throws_ok(
  $$select public.select_designer('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000d1')$$,
  'P0001', 'designer_not_interested', 'RPC rejects a designer who skipped the brief');

-- Customer c1
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select is((select count(*) from public.swipes where brief_id = '00000000-0000-0000-0000-0000000000b1'), 2::bigint,
  'customer sees likes on own brief');
select lives_ok(
  $$select public.select_designer('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d1')$$,
  'author can select a designer who liked the brief');
select throws_ok(
  $$select public.select_designer('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d2')$$,
  'P0001', 'brief_taken', 'RPC rejects a brief that is already taken');
select lives_ok(
  $$insert into public.messages (selection_id, sender_id, body)
    values ((select id from public.selections where brief_id = '00000000-0000-0000-0000-0000000000b1'),
            '00000000-0000-0000-0000-0000000000c1', 'ahoj')$$,
  'customer can write in own chat');

-- Designer d1 (selected)
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select lives_ok(
  $$insert into public.messages (selection_id, sender_id, body)
    values ((select id from public.selections where brief_id = '00000000-0000-0000-0000-0000000000b1'),
            '00000000-0000-0000-0000-0000000000d1', 'cau')$$,
  'selected designer can write in the chat');
select is((select count(*) from public.messages), 2::bigint, 'selected designer reads the chat');

-- Designer d2 (liked, not selected)
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d2');
select is((select count(*) from public.messages), 0::bigint, 'third user reads no messages');
select throws_ok(
  $$insert into public.messages (selection_id, sender_id, body)
    values ((select id from public.selections where brief_id = '00000000-0000-0000-0000-0000000000b1'),
            '00000000-0000-0000-0000-0000000000d2', 'hi')$$,
  '42501', null, 'third user cannot write in the chat');
select is((select count(*) from public.briefs where id = '00000000-0000-0000-0000-0000000000b1'), 1::bigint,
  'designer still sees a liked brief after it is taken');
select is((select status::text from public.briefs where id = '00000000-0000-0000-0000-0000000000b1'), 'taken',
  'liked brief shows as taken');

-- Customer c2 and anon
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c2');
select is((select count(*) from public.messages), 0::bigint, 'other customer reads no messages');
reset role;
set local role anon;
select throws_ok(
  $$select public.select_designer('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d1')$$,
  '42501', null, 'anon cannot execute the RPC');

-- Back as owner: denied changes really changed nothing
reset role;
select is((select name from public.profiles where id = '00000000-0000-0000-0000-0000000000d2'), 'Dana2',
  'foreign profile update changed 0 rows');
select isnt((select description from public.briefs where id = '00000000-0000-0000-0000-0000000000b1'), 'hacked',
  'foreign brief update changed 0 rows');

select * from finish();
rollback;
