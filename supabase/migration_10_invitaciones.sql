-- FlowPub — sistema de invitaciones (idempotente). Correr en el SQL Editor.
-- Cada usuario recibe 6 códigos al nacer su perfil (trigger) y los comparte
-- por URL (/i/CODIGO). El canje enlaza invitado↔anfitrión y los auto-sigue
-- (lo que además dispara la notificación de follow ya existente).

-- ── 1) Tabla ─────────────────────────────────────────────────────────────────
create table if not exists public.invites (
  code       text primary key,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at    timestamptz
);
create index if not exists invites_inviter_idx on public.invites (inviter_id);

alter table public.invites enable row level security;
-- El anfitrión ve SOLO las suyas; el alta/canje van por triggers y RPCs
-- (security definer) — ningún cliente inserta ni actualiza directo.
drop policy if exists invites_own_read on public.invites;
create policy invites_own_read on public.invites for select
  using (inviter_id = auth.uid());

-- ── 2) 6 códigos por perfil nuevo ────────────────────────────────────────────
create or replace function public.grant_invites()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.invites (code, inviter_id)
  select substr(replace(gen_random_uuid()::text, '-', ''), 1, 8), new.id
  from generate_series(1, 6);
  return new;
end; $$;
drop trigger if exists trg_grant_invites on public.profiles;
create trigger trg_grant_invites after insert on public.profiles
  for each row execute function public.grant_invites();

-- Backfill: completa hasta 6 a los perfiles que existían antes del trigger.
insert into public.invites (code, inviter_id)
select substr(replace(gen_random_uuid()::text, '-', ''), 1, 8), p.id
from public.profiles p
join lateral generate_series(
  1, 6 - (select count(*)::int from public.invites i where i.inviter_id = p.id)
) as faltan on true;

-- ── 3) Info pública de un código (landing /i/[code], sin sesión) ─────────────
create or replace function public.get_invite_info(invite_code text)
returns json language plpgsql security definer stable set search_path = public as $$
declare
  r record;
begin
  select i.used_at, p.username, p.display_name, p.avatar_url
    into r
  from public.invites i
  join public.profiles p on p.id = i.inviter_id
  where i.code = invite_code;
  if not found then return null; end if;
  return json_build_object(
    'username', r.username,
    'displayName', coalesce(nullif(r.display_name, ''), r.username),
    'avatarUrl', r.avatar_url,
    'available', r.used_at is null
  );
end; $$;
revoke all on function public.get_invite_info(text) from public;
grant execute on function public.get_invite_info(text) to anon, authenticated;

-- ── 4) Canje (tras crear la cuenta): enlaza y auto-sigue en ambos sentidos ───
create or replace function public.redeem_invite(invite_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  me  uuid := auth.uid();
  inv record;
begin
  if me is null then return false; end if;
  -- Un usuario canjea a lo más UNA invitación en su vida.
  if exists (select 1 from public.invites where invitee_id = me) then
    return false;
  end if;

  update public.invites
     set invitee_id = me, used_at = now()
   where code = invite_code
     and used_at is null
     and inviter_id <> me
  returning inviter_id into inv;
  if not found then return false; end if;

  -- Se siguen mutuamente (dispara la notificación de follow existente).
  insert into public.follows (follower_id, followee_id)
    values (me, inv.inviter_id), (inv.inviter_id, me)
  on conflict do nothing;
  return true;
end; $$;
revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;
