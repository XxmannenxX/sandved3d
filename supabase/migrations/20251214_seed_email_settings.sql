-- Seed default email settings + Vipps details.
-- Assumes public.settings has a unique constraint or unique index on (key),
-- since the app uses upsert on `key`.

insert into public.settings (key, value, updated_at)
values
  -- Vipps details (used in order confirmation emails)
  ('vipps_recipient_name', 'Andreas Lundevik', now()),
  ('vipps_number', '94067616', now()),

  -- Order confirmation email templates
  ('email_order_confirmation_subject', 'Bestilling mottatt #{{orderNo}}', now()),
  ('email_order_confirmation_delivery_note', 'Hvis du heller vil betale ved levering, går det fint – men bestillingen blir nedprioritert når den er ubetalt.', now()),

  -- Order status update email templates
  ('email_order_status_update_subject', 'Oppdatering på bestilling #{{orderNo}}', now()),
  ('email_order_status_update_line', 'Statusen på bestillingen din er oppdatert til: {{status}}.', now())
on conflict (key) do update
set value = excluded.value,
    updated_at = now();


