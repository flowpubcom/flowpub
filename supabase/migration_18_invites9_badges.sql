-- FlowPub — invitaciones a 9 + badges OG (idempotente). Correr en el SQL Editor.
-- Sube el acuñado de invitaciones de 6 a 9 por usuario (respeta el re-acuñado
-- infinito de admins de migration_11, que no se toca aquí) y agrega una
-- función pública de solo-lectura para pintar la badge «OG» en cualquier
-- perfil sin depender de la RLS `invites_own_read` (que solo deja ver las
-- invitaciones propias).

-- ── 1) 9 códigos por perfil nuevo (antes 6) ──────────────────────────────────
create or replace function public.grant_invites()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.invites (code, inviter_id)
  select substr(replace(gen_random_uuid()::text, '-', ''), 1, 8), new.id
  from generate_series(1, 9);
  return new;
end; $$;
-- El trigger ya existe (migration_10); reapuntarlo a la función nueva no
-- requiere recrearlo, pero se deja el create-or-replace por si acaso.
drop trigger if exists trg_grant_invites on public.profiles;
create trigger trg_grant_invites after insert on public.profiles
  for each row execute function public.grant_invites();

-- Backfill: a cada perfil existente le completa el faltante hasta que el
-- TOTAL de invitaciones emitidas (canjeadas + sin canjear) llegue a 9. No
-- toca las ya canjeadas ni el mecanismo de re-acuñado de admins (migration_11
-- sigue reponiendo códigos gastados vía `redeem_invite`, independiente de
-- este backfill inicial).
insert into public.invites (code, inviter_id)
select substr(replace(gen_random_uuid()::text, '-', ''), 1, 8), p.id
from public.profiles p
join lateral generate_series(
  1, 9 - (select count(*)::int from public.invites i where i.inviter_id = p.id)
) as faltan on true;

-- ── 2) Badge OG: invitaciones canjeadas de un perfil (público, solo cuenta) ──
-- Expone únicamente un entero — no filas de `invites` — para que cualquier
-- visitante pueda pintar la badge «OG» en un perfil ajeno (donde
-- `invites_own_read` no deja contar directo sobre la tabla).
create or replace function public.invite_redemptions(profile uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::integer
  from public.invites
  where inviter_id = profile
    and invitee_id is not null;
$$;
revoke all on function public.invite_redemptions(uuid) from public;
grant execute on function public.invite_redemptions(uuid) to anon, authenticated;
