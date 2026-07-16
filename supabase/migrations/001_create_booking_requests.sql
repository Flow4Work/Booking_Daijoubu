create extension if not exists pgcrypto;

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  language text not null check (language in ('ja', 'en')),
  category text not null check (category in ('restaurant', 'hair', 'nail', 'beauty')),
  place_name text not null,
  place_url text,
  preferred_date date not null,
  preferred_time time not null,
  alternative_date date,
  alternative_time time,
  party_size integer not null check (party_size between 1 and 20),
  request_details text,
  customer_name text not null,
  customer_email text not null,
  customer_country text not null default 'JP',
  status text not null default 'new',
  payment_method text not null default 'paypal',
  payment_status text not null default 'not_requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alternative_booking_pair check (
    (alternative_date is null and alternative_time is null)
    or (alternative_date is not null and alternative_time is not null)
  )
);

alter table public.booking_requests enable row level security;

revoke all on table public.booking_requests from anon, authenticated;

create index if not exists booking_requests_created_at_idx
  on public.booking_requests (created_at desc);

create index if not exists booking_requests_status_idx
  on public.booking_requests (status, created_at desc);

create or replace function public.set_booking_requests_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists booking_requests_set_updated_at on public.booking_requests;
create trigger booking_requests_set_updated_at
before update on public.booking_requests
for each row execute function public.set_booking_requests_updated_at();
