-- Admin audit logging
-- Logs admin actions (updates/inserts/deletes) on selected tables, linked to the executing Supabase user when available.

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- May be null for service-role/background operations
  admin_user_id uuid null,

  action text not null, -- INSERT | UPDATE | DELETE
  table_name text not null,
  record_id text null,

  -- Optional structured details (e.g. order status before/after)
  metadata jsonb not null default '{}'::jsonb,

  old_data jsonb null,
  new_data jsonb null
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_admin_user_id_idx
  on public.admin_audit_logs (admin_user_id);

create index if not exists admin_audit_logs_table_name_idx
  on public.admin_audit_logs (table_name);

alter table public.admin_audit_logs enable row level security;

-- Any authenticated admin session may read logs (your app treats "logged in" == "admin")
drop policy if exists "authenticated_can_read_admin_audit_logs" on public.admin_audit_logs;
create policy "authenticated_can_read_admin_audit_logs"
  on public.admin_audit_logs
  for select
  to authenticated
  using (true);

-- No direct client writes to audit logs (they are written by trigger functions).
drop policy if exists "no_client_writes_admin_audit_logs" on public.admin_audit_logs;
create policy "no_client_writes_admin_audit_logs"
  on public.admin_audit_logs
  for all
  to authenticated
  using (false)
  with check (false);

-- Generic admin audit trigger (products/settings)
create or replace function public.audit_log_generic()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_user_id uuid := auth.uid();
  v_admin_email text := nullif((current_setting('request.jwt.claims', true)::jsonb ->> 'email'), '');
  v_action text := tg_op;
  v_table text := tg_table_name;
  v_record_id text;
  v_old jsonb;
  v_new jsonb;
begin
  if (tg_op = 'INSERT') then
    v_old := null;
    v_new := to_jsonb(new);
  elsif (tg_op = 'UPDATE') then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
  else
    v_old := to_jsonb(old);
    v_new := null;
  end if;

  v_record_id := coalesce(
    (v_new ->> 'id'),
    (v_old ->> 'id'),
    (v_new ->> 'key'),
    (v_old ->> 'key')
  );

  insert into public.admin_audit_logs (
    admin_user_id,
    action,
    table_name,
    record_id,
    metadata,
    old_data,
    new_data
  ) values (
    v_admin_user_id,
    v_action,
    v_table,
    v_record_id,
    jsonb_build_object('admin_email', v_admin_email),
    v_old,
    v_new
  );

  return coalesce(new, old);
end;
$$;

-- Focused audit trigger for order status changes only (avoid logging customer order creation etc.)
create or replace function public.audit_log_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_user_id uuid := auth.uid();
  v_admin_email text := nullif((current_setting('request.jwt.claims', true)::jsonb ->> 'email'), '');
begin
  if (new.status is not distinct from old.status) then
    return new;
  end if;

  insert into public.admin_audit_logs (
    admin_user_id,
    action,
    table_name,
    record_id,
    metadata,
    old_data,
    new_data
  ) values (
    v_admin_user_id,
    'UPDATE',
    'orders',
    coalesce(new.id::text, old.id::text),
    jsonb_build_object(
      'admin_email', v_admin_email,
      'customer_email', new.email,
      'field', 'status',
      'from', old.status,
      'to', new.status
    ),
    jsonb_build_object('status', old.status),
    jsonb_build_object('status', new.status)
  );

  return new;
end;
$$;

-- Triggers
drop trigger if exists trg_audit_products on public.products;
create trigger trg_audit_products
after insert or update or delete on public.products
for each row execute function public.audit_log_generic();

drop trigger if exists trg_audit_settings on public.settings;
create trigger trg_audit_settings
after insert or update or delete on public.settings
for each row execute function public.audit_log_generic();

drop trigger if exists trg_audit_orders_status on public.orders;
create trigger trg_audit_orders_status
after update of status on public.orders
for each row execute function public.audit_log_order_status();


