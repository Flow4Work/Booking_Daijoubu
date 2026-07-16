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

## Database

The API writes to a `booking_requests` table with these columns:

`request_code`, `language`, `category`, `place_name`, `place_url`, `preferred_date`, `preferred_time`, `alternative_date`, `alternative_time`, `party_size`, `request_details`, `customer_name`, `customer_email`, `customer_country`, `status`, `payment_method`, `payment_status`.
