-- Enums, tables, constraints, grants and the sign-up trigger.
-- RLS is enabled on every table here; policies follow in the next migration (default deny until then).

create type public.user_role as enum ('designer', 'customer');
create type public.brief_status as enum ('open', 'taken');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  name text not null check (char_length(btrim(name)) > 0),
  bio text not null default '',
  created_at timestamptz not null default now()
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  designer_id uuid not null references public.profiles (id) on delete cascade,
  image_url text not null,
  title text,
  created_at timestamptz not null default now()
);

create table public.briefs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  image_url text not null,
  deadline date not null,
  budget integer not null check (budget > 0), -- whole crowns
  description text not null check (char_length(btrim(description)) > 0),
  status public.brief_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.swipes (
  designer_id uuid not null references public.profiles (id) on delete cascade,
  brief_id uuid not null references public.briefs (id) on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  unique (designer_id, brief_id)
);

create table public.selections (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null unique references public.briefs (id) on delete cascade,
  designer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  selection_id uuid not null references public.selections (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- Indexes on columns that policies and lists filter on (unique constraints already cover
-- swipes.designer_id and selections.brief_id).
create index portfolio_items_designer_id_idx on public.portfolio_items (designer_id);
create index briefs_customer_id_idx on public.briefs (customer_id);
create index briefs_status_idx on public.briefs (status);
create index swipes_brief_id_idx on public.swipes (brief_id);
create index selections_designer_id_idx on public.selections (designer_id);
create index messages_selection_id_idx on public.messages (selection_id, created_at);
create index messages_sender_id_idx on public.messages (sender_id);

alter table public.profiles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.briefs enable row level security;
alter table public.swipes enable row level security;
alter table public.selections enable row level security;
alter table public.messages enable row level security;

-- Grants: nothing to anon; authenticated gets only what the rules allow.
revoke all on public.profiles, public.portfolio_items, public.briefs,
  public.swipes, public.selections, public.messages from public, anon, authenticated;

grant select on public.profiles to authenticated;
grant update (name, bio) on public.profiles to authenticated; -- role cannot change

grant select, insert, delete on public.portfolio_items to authenticated;

grant select, insert on public.briefs to authenticated;
grant update (image_url, deadline, budget, description) on public.briefs to authenticated; -- not status

grant select, insert on public.swipes to authenticated; -- swipes are final

grant select on public.selections to authenticated; -- rows are created only by the selection RPC

grant select, insert on public.messages to authenticated; -- no updates or deletes

-- Sign-up trigger: creates the profile; only designer or customer is accepted.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_role text := new.raw_user_meta_data ->> 'role';
begin
  if new_role is null or new_role not in ('designer', 'customer') then
    raise exception 'invalid_role';
  end if;

  insert into public.profiles (id, role, name)
  values (new.id, new_role::public.user_role, coalesce(new.raw_user_meta_data ->> 'name', ''));

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
