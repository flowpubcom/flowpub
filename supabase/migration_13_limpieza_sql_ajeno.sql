-- FlowPub — limpieza de SQL ajeno (idempotente). Correr en el SQL Editor.
--
-- El 2026-07-03 se corrieron por accidente dos migraciones de OTRO proyecto
-- (Gulu): migration_conexiones_reciproco_fix.sql y
-- migration_moderacion_doble_aviso_fix.sql. Solo hicieron CREATE OR REPLACE
-- de TRES funciones que FlowPub no usa (ningún nombre chocó con los nuestros,
-- no crearon triggers ni tocaron datos). Verificado por sonda: las funciones
-- existen pero truenan al ejecutarse (referencian tablas de Gulu inexistentes
-- aquí). Aun así, accept_connection quedó invocable y es security definer:
-- se van las tres.

drop function if exists public.accept_connection(uuid);
drop function if exists public.auto_hide_reported();
drop function if exists public.notify_moderation();

-- Verificación 1: estas tres deben regresar CERO filas.
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('accept_connection', 'auto_hide_reported', 'notify_moderation');

-- Verificación 2: censo de funciones de public — deben ser SOLO las de FlowPub:
-- bump_conversation · bump_counts · enforce_max_tags · get_invite_info ·
-- get_or_create_dm · grant_invites · handle_new_user · is_admin · is_member ·
-- notify_on_comment · notify_on_flow_published · notify_on_follow ·
-- notify_on_like · redeem_invite.
-- Si ves algo que no esté en esta lista, avísale a Claude.
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;
