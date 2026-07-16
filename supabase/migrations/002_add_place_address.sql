alter table if exists public.booking_requests
  add column if not exists place_address text;
