-- ─────────────────────────────────────────────────────────────────────────────
-- migration_23_guard_flow_status.sql — candado de moderación sobre flows.status
--
-- Qué: trigger BEFORE INSERT OR UPDATE en public.flows que reserva los estados
-- curados ('featured' y 'reported') al admin.
--
-- Por qué: la política flows_update (author_id = auth.uid() or is_admin()) más
-- el grant de columna `status` (schema.sql, re-afirmado en migration_15 y
-- migration_17) dejaban que cualquier autor hiciera PATCH REST con
-- status='featured' y se auto-otorgara la colocación destacada que en /admin
-- alterna el botón «Destacar». El INSERT tenía el mismo hueco (flows_insert
-- solo valida author_id), así que el trigger cubre ambos.
--
-- Decisión sobre 'reported': hoy NINGÚN flujo legítimo de usuarios lo setea
-- (FlowModStatus en src/data/adminClient.ts es published|featured|hidden;
-- en AdminView solo se pinta como badge). Es un flag de moderación, así que
-- para no-admins se bloquea tanto ENTRAR a 'reported' como SALIR de él (que
-- el autor no se auto-limpie la marca). Si algún día se agrega un botón
-- «Reportar» para usuarios, debe ir por el servidor (service_role) o por su
-- propia tabla de reportes — este trigger no estorba esos caminos.
--
-- Las transiciones normales del autor (draft ↔ published ↔ hidden) siguen
-- libres. El candado aplica solo a los roles de la API pública
-- (anon/authenticated): postgres (SQL Editor), service_role (Edge/servidor)
-- y jobs internos pasan sin restricción.
--
-- Idempotente: create or replace + drop trigger if exists.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.guard_flow_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Si el status no cambia realmente, no hay nada que vigilar.
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  -- Solo vigilamos a los roles de la API pública; el servidor y el SQL
  -- Editor (postgres / service_role) quedan exentos a propósito.
  -- OJO: la función es SECURITY INVOKER (default) para que current_user
  -- refleje el rol real del request de PostgREST.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  -- Nadie que no sea admin entra a un estado curado…
  if new.status in ('featured', 'reported') then
    raise exception 'Solo un admin puede marcar un Flow como "%".', new.status
      using errcode = '42501'; -- insufficient_privilege
  end if;

  -- …ni saca un Flow de 'reported' (es una marca de moderación).
  if tg_op = 'UPDATE' and old.status = 'reported' then
    raise exception 'Solo un admin puede cambiar el status de un Flow reportado.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_flow_status on public.flows;
create trigger guard_flow_status
  before insert or update of status on public.flows
  for each row execute function public.guard_flow_status();
