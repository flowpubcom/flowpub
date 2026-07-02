-- FlowPub — mensajería privada (idempotente). Correr en el SQL Editor.
-- DMs texto+voz con Realtime. Reusa conversations/conversation_members/messages
-- (ya en schema.sql). Aquí: orden por actividad, no-leídos, DM 1:1 atómico,
-- policy de update para marcar leído, y realtime en messages.

-- ── 1) Orden por última actividad + marca de lectura + duración de voz ───────
alter table public.conversations
  add column if not exists last_message_at timestamptz not null default now();
alter table public.conversation_members
  add column if not exists last_read_at timestamptz not null default now();
-- Los mensajes de voz guardan su duración (para el reproductor), igual que los
-- comentarios de voz. El insert de la app manda solo lo que el remitente puede.
alter table public.messages
  add column if not exists duration_s int not null default 0;

-- Bump de last_message_at al llegar un mensaje (para ordenar la bandeja).
create or replace function public.bump_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;
  return new;
end; $$;
drop trigger if exists trg_bump_conversation on public.messages;
create trigger trg_bump_conversation after insert on public.messages
  for each row execute function public.bump_conversation();

-- ── 2) El integrante puede tocar SOLO su propia fila (last_read_at) ──────────
drop policy if exists members_update on public.conversation_members;
create policy members_update on public.conversation_members for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.conversation_members from anon, authenticated;
grant update (last_read_at) on public.conversation_members to authenticated;

-- ── 3) DM 1:1: hallar o crear atómicamente (evita conversaciones duplicadas) ─
-- security definer: crea la conversación y agrega a AMBOS de una; la RLS de
-- members_insert (bootstrap) sería frágil para carreras de dos usuarios.
create or replace function public.get_or_create_dm(other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me   uuid := auth.uid();
  conv uuid;
begin
  if me is null then raise exception 'sin sesión'; end if;
  if other is null or other = me then raise exception 'destinatario inválido'; end if;
  if not exists (select 1 from public.profiles where id = other) then
    raise exception 'el destinatario no existe';
  end if;

  -- ¿Ya existe un DM 1:1 (exactamente 2 integrantes: yo y el otro)?
  select cm.conversation_id into conv
  from public.conversation_members cm
  join public.conversation_members cm2
    on cm2.conversation_id = cm.conversation_id and cm2.user_id = other
  where cm.user_id = me
    and (select count(*) from public.conversation_members x
         where x.conversation_id = cm.conversation_id) = 2
  limit 1;

  if conv is not null then return conv; end if;

  insert into public.conversations default values returning id into conv;
  insert into public.conversation_members (conversation_id, user_id)
    values (conv, me), (conv, other);
  return conv;
end; $$;

revoke all on function public.get_or_create_dm(uuid) from public;
grant execute on function public.get_or_create_dm(uuid) to authenticated;

-- ── 4) Realtime en messages (el thread abierto recibe inserts en vivo) ───────
-- La RLS de messages (is_member) sigue mandando: solo los integrantes reciben.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
