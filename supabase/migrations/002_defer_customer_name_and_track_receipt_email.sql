alter table public.booking_requests
  alter column customer_name drop not null;

alter table public.booking_requests
  add column if not exists confirmation_email_sent_at timestamptz;

comment on column public.booking_requests.customer_name is
  'Collected only after the venue confirms availability.';

comment on column public.booking_requests.confirmation_email_sent_at is
  'Timestamp of the automatic customer receipt email.';
