-- ─────────────────────────────────────────────────────────────────────────────
-- migration_16 · DMs de voz PRIVADOS
--
-- Problema: las notas de voz de mensajes directos vivían en el bucket `audio`
-- (público por diseño, para los Flows y comentarios): cualquiera con la URL
-- podía escuchar un audio privado. Este bucket nuevo `messages` es privado y
-- sus políticas cuelgan de la membresía de la conversación (public.is_member,
-- security definer, ya existe desde schema.sql).
--
-- Path de los archivos: <conversation_id>/<uid>/<uuid>.<ext>
--   · segmento 1 = conversación → gates de lectura/escritura por membresía
--   · segmento 2 = quién sube  → solo puedes subir a tu propia carpeta
--
-- El cliente ya está listo (uploadVoiceMessage/resolveMessageAudio): guarda el
-- PATH en messages.audio_url y reproduce con signed URLs de 1 hora. Los audios
-- de DMs viejos (URLs http… del bucket público) siguen sirviendo tal cual.
-- Idempotente: se puede correr dos veces sin drama.
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('messages', 'messages', false)
on conflict (id) do nothing;

-- Leer (incluye firmar URLs): solo integrantes de la conversación del path.
drop policy if exists storage_messages_read on storage.objects;
create policy storage_messages_read on storage.objects for select
  using (
    bucket_id = 'messages'
    and public.is_member(((storage.foldername(name))[1])::uuid)
  );

-- Subir: integrante de la conversación Y carpeta propia (uid en el segmento 2).
drop policy if exists storage_messages_insert on storage.objects;
create policy storage_messages_insert on storage.objects for insert
  with check (
    bucket_id = 'messages'
    and public.is_member(((storage.foldername(name))[1])::uuid)
    and auth.uid()::text = (storage.foldername(name))[2]
  );

-- Borrar: solo lo que subiste tú (limpieza de lo propio).
drop policy if exists storage_messages_delete on storage.objects;
create policy storage_messages_delete on storage.objects for delete
  using (
    bucket_id = 'messages'
    and auth.uid()::text = (storage.foldername(name))[2]
  );
