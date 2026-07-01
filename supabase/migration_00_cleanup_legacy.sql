-- FlowPub — limpieza previa (una sola vez, antes de schema.sql).
--
-- El proyecto Supabase traía 3 tablas legacy VACÍAS de un experimento previo
-- (comments/likes/messages) con estructura ajena a la nuestra. Chocan de nombre
-- con nuestro esquema y, como schema.sql usa `create table if not exists`, se
-- saltarían y luego los índices/políticas que referencian nuestras columnas
-- (flow_id, author_id, conversation_id, …) tronarían a mitad del batch.
--
-- Esta migración es SEGURA e IDEMPOTENTE: solo tira cada tabla si tiene la forma
-- LEGACY (le falta una columna que SÍ tiene nuestro esquema). Si ya corriste
-- schema.sql y existen las tablas buenas, esto no hace absolutamente nada.
--
-- Orden de ejecución en el SQL Editor:
--   1) migration_00_cleanup_legacy.sql   (este archivo)
--   2) schema.sql

do $$
begin
  -- comments legacy: la nuestra tiene flow_id; la legacy no.
  if to_regclass('public.comments') is not null
     and not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'comments' and column_name = 'flow_id'
     )
  then
    raise notice 'Tirando public.comments (forma legacy, sin flow_id)';
    drop table public.comments cascade;
  end if;

  -- likes legacy: la nuestra tiene flow_id; la legacy no.
  if to_regclass('public.likes') is not null
     and not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'likes' and column_name = 'flow_id'
     )
  then
    raise notice 'Tirando public.likes (forma legacy, sin flow_id)';
    drop table public.likes cascade;
  end if;

  -- messages legacy: la nuestra tiene conversation_id; la legacy no.
  if to_regclass('public.messages') is not null
     and not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'messages' and column_name = 'conversation_id'
     )
  then
    raise notice 'Tirando public.messages (forma legacy, sin conversation_id)';
    drop table public.messages cascade;
  end if;
end $$;
