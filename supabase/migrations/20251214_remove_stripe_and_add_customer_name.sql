-- Remove Stripe remnants and store customer name for non-payment orders.

-- Orders: store the customer's name (email is already stored in orders.email)
alter table public.orders
  add column if not exists customer_name text;

-- Orders: store customer phone number for order updates/coordination
alter table public.orders
  add column if not exists customer_phone text;

-- Remove Stripe columns/indexes/tables if they exist (safe for already-migrated DBs).
drop index if exists public.orders_stripe_session_id_unique;

alter table public.orders
  drop column if exists stripe_session_id;

drop table if exists public.stripe_webhook_events;


