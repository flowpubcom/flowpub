-- FlowPub — limpieza pre-lanzamiento: fuera usuarios inventados y Flows de
-- relleno. Queda SOLO la cuenta real de Julio (pentrexyl@gmail.com) y su
-- contenido. Correr en el SQL Editor. Idempotente (borrar dos veces no duele).
--
-- Cómo funciona: se borra de auth.users y las cascadas hacen el resto
-- (profiles → flows → flow_tags/comments/likes/saves/notifications/…).
-- Los triggers de contadores SÍ corren en cascada, así que los like_count /
-- comment_count de los Flows de Julio quedan honestos solos.

-- ── 0) Candado: si la cuenta real no está, se aborta TODO ────────────────────
do $$
begin
  if not exists (
    select 1 from auth.users where lower(email) = 'pentrexyl@gmail.com'
  ) then
    raise exception
      'No existe pentrexyl@gmail.com en auth.users — aborto para no borrar todo.';
  end if;
end $$;

-- ── 1) Adiós usuarios demo (y todo lo suyo, por cascada) ─────────────────────
-- Cubre: los 6 autores demo (migration_01), demo1/demodos (pruebas de auth)
-- y cualquier otra cuenta de prueba que se haya colado.
delete from auth.users
where coalesce(lower(email), '') <> 'pentrexyl@gmail.com';

-- ── 2) Flows de relleno que hubieran quedado a nombre de Julio ───────────────
-- (los 6 demo tienen ids conocidos 20000000-…; por si alguna migración los
-- reasignó, se van explícitamente)
delete from public.flows
where id::text like '20000000-0000-0000-0000-%';

-- ── 3) Conversaciones huérfanas (sin integrantes tras la cascada) ────────────
delete from public.conversations c
where not exists (
  select 1 from public.conversation_members m where m.conversation_id = c.id
);

-- ── 4) Archivos huérfanos en Storage (carpetas de uids que ya no existen) ────
-- Los buckets guardan por carpeta-uid (así lo exige la RLS de subida).
delete from storage.objects
where bucket_id in ('audio', 'avatars', 'covers')
  and (storage.foldername(name))[1] is not null
  and (storage.foldername(name))[1] not in (
    select id::text from public.profiles
  );

-- ── 5) Reporte: lo que queda vivo ────────────────────────────────────────────
select
  (select count(*) from auth.users)          as usuarios,
  (select count(*) from public.profiles)     as perfiles,
  (select count(*) from public.flows)        as flows,
  (select count(*) from public.comments)     as comentarios,
  (select count(*) from public.likes)        as likes,
  (select count(*) from public.follows)      as follows,
  (select count(*) from public.notifications) as notificaciones;
