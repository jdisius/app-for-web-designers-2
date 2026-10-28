begin;
select plan(9);

-- Sign-up trigger
select throws_ok(
  $$insert into auth.users (id, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000a1', '{"role":"admin","name":"X"}')$$,
  'P0001', 'invalid_role', 'sign-up with an unknown role fails');
select throws_ok(
  $$insert into auth.users (id, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000a2', '{"name":"X"}')$$,
  'P0001', 'invalid_role', 'sign-up without a role fails');

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', '{"role":"designer","name":"Dana"}'),
  ('00000000-0000-0000-0000-0000000000c1', '{"role":"customer","name":"Cyril"}');

select is((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000d1'),
  'designer', 'profile is created with the chosen role');

-- Bad values are rejected (as the table owner; CHECKs apply to everyone)
select throws_ok(
  $$insert into public.briefs (customer_id, image_url, deadline, budget, description)
    values ('00000000-0000-0000-0000-0000000000c1', 'p', current_date, 0, 'x')$$,
  '23514', null, 'budget 0 is rejected');
insert into public.briefs (id, customer_id, image_url, deadline, budget, description)
  values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1', 'p', current_date, 1500, 'x');
insert into public.selections (id, brief_id, designer_id)
  values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d1');
select throws_ok(
  $$insert into public.messages (selection_id, sender_id, body)
    values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c1', '')$$,
  '23514', null, 'empty message is rejected');
select throws_ok(
  $$insert into public.messages (selection_id, sender_id, body)
    values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c1', repeat('a', 1001))$$,
  '23514', null, 'message over 1000 characters is rejected');

-- Grants: authenticated cannot change role or brief status; anon has nothing
set local role authenticated;
select throws_ok(
  $$update public.profiles set role = 'customer' where id = '00000000-0000-0000-0000-0000000000d1'$$,
  '42501', null, 'role cannot be changed');
select throws_ok(
  $$update public.briefs set status = 'taken'$$,
  '42501', null, 'brief status cannot be changed directly');
reset role;
set local role anon;
select throws_ok($$select * from public.profiles$$, '42501', null, 'anon has no access');

select * from finish();
rollback;
