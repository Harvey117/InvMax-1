-- InvMax Web Supabase Schema
-- Paste this into Supabase SQL Editor, then click Run.

create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  demand      numeric not null default 0,
  order_cost  numeric not null default 0,
  holding     numeric not null default 0,
  cost_price  numeric not null default 0,
  selling_price numeric not null default 0,
  price       numeric not null default 0,
  stock       integer not null default 0,
  added_at    timestamptz not null default now()
);

-- Add these columns when updating an older InvMax database.
alter table products add column if not exists cost_price numeric not null default 0;
alter table products add column if not exists selling_price numeric not null default 0;

-- Backfill older rows where the previous Unit Price should be treated as Cost Price.
update products
set cost_price = price
where cost_price = 0 and price > 0;

alter table products enable row level security;

create policy "Users own their products"
  on products for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists profiles (
  id      uuid primary key references auth.users(id) on delete cascade,
  name    text,
  phone   text,
  dob     date
);

-- Optional teacher requirement: prevent the same full name from being used
-- by different accounts. Comment this out if your instructor allows duplicate
-- real names, because two real people can naturally share one name.
create unique index if not exists profiles_unique_lower_name
  on profiles (lower(trim(name)))
  where name is not null and trim(name) <> '';

alter table profiles enable row level security;

create policy "Users own their profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles(id, name, phone, dob)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone',
    nullif(new.raw_user_meta_data->>'dob', '')::date
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
