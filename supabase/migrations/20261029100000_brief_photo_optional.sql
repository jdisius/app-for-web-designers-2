-- The reference photo on a brief is optional.
alter table public.briefs alter column image_url drop not null;
