-- FlowPub — invitaciones infinitas para admins (idempotente). SQL Editor.
-- Mecánica: cuando se canjea una invitación de un admin, se le acuña un
-- código nuevo al instante — el admin nunca baja de 6 disponibles.

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

  -- La casa invita: a los admins se les repone el código gastado.
  if exists (
    select 1 from public.profiles where id = inv.inviter_id and role = 'admin'
  ) then
    insert into public.invites (code, inviter_id)
    values (substr(replace(gen_random_uuid()::text, '-', ''), 1, 8), inv.inviter_id);
  end if;

  return true;
end; $$;
revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;
