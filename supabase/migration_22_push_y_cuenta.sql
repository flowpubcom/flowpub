-- migration_22_push_y_cuenta.sql
-- Notificaciones push (Web Push) + preferencias por usuario + borrar la cuenta.
-- Idempotente. El envío real lo hace un Edge Function (send-push) disparado por
-- webhooks de BD sobre `notifications` y `messages` — ver supabase/functions/send-push.

-- ── suscripciones push del navegador (una por endpoint) ──────────────────────
create table if not exists public.push_subscriptions (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- El dueño gestiona SUS suscripciones. El Edge Function las lee con service_role
-- (salta RLS), así que no hace falta política de lectura para otros.
drop policy if exists push_subs_own on public.push_subscriptions;
create policy push_subs_own on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.push_subscriptions from anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- ── preferencias de push por usuario (qué eventos quiere recibir) ────────────
alter table public.profiles
  add column if not exists push_prefs jsonb not null
  default '{"messages":true,"follows":true,"comments":true}'::jsonb;
grant update (push_prefs) on public.profiles to authenticated;

-- ── borrar mi propia cuenta ──────────────────────────────────────────────────
-- Elimina el usuario de auth.users; la cascada (profiles.id → auth.users on
-- delete cascade, y de ahí todo lo suyo) borra el resto. Solo sobre uno mismo.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'sin sesión';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- Verificación: select public.delete_my_account();  -- (¡borra tu cuenta! usar con cuidado)
