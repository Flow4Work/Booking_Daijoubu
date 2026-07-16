# Booking Daijoubu

Japanese-first booking concierge for travelers who need help reserving restaurants and beauty services in Korea.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` — required for automatic receipt emails
- `BOOKING_FROM_EMAIL` — verified sender, for example `Booking Daijoubu <booking@example.com>`
- `BOOKING_REPLY_TO` — address that receives customer replies
- `BOOKING_ADMIN_EMAIL` — optional BCC for new requests

A verified sender domain is required to send receipt emails to real customers. Without `RESEND_API_KEY`, requests are still stored and the UI tells the customer to keep the request code.

## Database

Run the SQL files in `supabase/migrations` in order before accepting requests.

The first request collects only the customer's email. `customer_name` remains empty until the venue confirms availability. At that point, the operator asks for the booking name and prepayment by email.

The API writes to a `booking_requests` table with these columns:

`request_code`, `language`, `category`, `place_name`, `place_address`, `place_url`, `preferred_date`, `preferred_time`, `alternative_date`, `alternative_time`, `party_size`, `request_details`, `customer_name`, `customer_email`, `customer_country`, `status`, `payment_method`, `payment_status`, `confirmation_email_sent_at`.
