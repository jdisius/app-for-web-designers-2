-- RLS policies, private helper functions, the selection RPC and the realtime publication.

-- Helpers live in a non-exposed schema and run as definer, so policies on one table can
-- look at another without triggering RLS recursion.
create schema private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create function private.is_role(p_role public.user_role)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = p_role);
$$;

create function private.is_brief_owner(p_brief_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.briefs where id = p_brief_id and customer_id = (select auth.uid()));
$$;

create function private.is_brief_open(p_brief_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.briefs where id = p_brief_id and status = 'open');
$$;

create function private.has_liked_brief(p_brief_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.swipes
    where brief_id = p_brief_id and designer_id = (select auth.uid()) and liked
  );
$$;

create function private.is_selection_party(p_selection_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.selections s
    join public.briefs b on b.id = s.brief_id
    where s.id = p_selection_id
      and ((select auth.uid()) = s.designer_id or (select auth.uid()) = b.customer_id)
  );
$$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- profiles: readable by logged-in users (demo decision); own row only for updates.
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- portfolio_items: readable by logged-in users; only designers manage their own.
create policy portfolio_items_select on public.portfolio_items
  for select to authenticated using (true);
create policy portfolio_items_insert on public.portfolio_items
  for insert to authenticated
  with check (designer_id = (select auth.uid()) and (select private.is_role('designer')));
create policy portfolio_items_delete on public.portfolio_items
  for delete to authenticated using (designer_id = (select auth.uid()));

-- briefs: customers see/edit their own; designers see open briefs plus the ones they liked.
create policy briefs_select on public.briefs
  for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (
      (select private.is_role('designer'))
      and (status = 'open' or (select private.has_liked_brief(id)))
    )
  );
create policy briefs_insert on public.briefs
  for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and status = 'open'
    and (select private.is_role('customer'))
  );
create policy briefs_update on public.briefs
  for update to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

-- swipes: designers write their own, on open briefs only; customers read only likes on their briefs.
create policy swipes_select on public.swipes
  for select to authenticated
  using (
    designer_id = (select auth.uid())
    or (liked and (select private.is_brief_owner(brief_id)))
  );
create policy swipes_insert on public.swipes
  for insert to authenticated
  with check (
    designer_id = (select auth.uid())
    and (select private.is_role('designer'))
    and (select private.is_brief_open(brief_id))
  );

-- selections: readable by the two parties; created only by select_designer().
create policy selections_select on public.selections
  for select to authenticated
  using (designer_id = (select auth.uid()) or (select private.is_brief_owner(brief_id)));

-- messages: only the two parties read and write; no updates or deletes.
create policy messages_select on public.messages
  for select to authenticated using ((select private.is_selection_party(selection_id)));
create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select private.is_selection_party(selection_id))
  );

-- Selection RPC: all checks live here because a definer function bypasses RLS.
-- Error messages are stable; the UI maps them to Czech text.
create function public.select_designer(p_brief_id uuid, p_designer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_brief public.briefs;
  v_selection_id uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_brief from public.briefs where id = p_brief_id for update;
  if not found then
    raise exception 'brief_not_found';
  end if;
  if v_brief.customer_id <> v_user then
    raise exception 'not_brief_owner';
  end if;
  if v_brief.status <> 'open' then
    raise exception 'brief_taken';
  end if;
  if not exists (
    select 1 from public.swipes
    where brief_id = p_brief_id and designer_id = p_designer_id and liked
  ) then
    raise exception 'designer_not_interested';
  end if;

  insert into public.selections (brief_id, designer_id)
  values (p_brief_id, p_designer_id)
  returning id into v_selection_id;

  update public.briefs set status = 'taken' where id = p_brief_id;

  return v_selection_id;
end;
$$;

revoke execute on function public.select_designer(uuid, uuid) from public, anon;
grant execute on function public.select_designer(uuid, uuid) to authenticated;

alter publication supabase_realtime add table public.messages;
