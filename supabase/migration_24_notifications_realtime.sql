-- migration_24_notifications_realtime.sql
-- Realtime en `notifications`: el punto de la campana reacciona en vivo cuando
-- llega una notificación con el usuario quieto en una página (useUnreadCount se
-- suscribe a los INSERT filtrando por user_id). La RLS de notifications
-- (user_id = auth.uid()) sigue mandando: cada quien recibe solo las suyas.
-- Idempotente: no falla si la tabla ya está en la publicación.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
