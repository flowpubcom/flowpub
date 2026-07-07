-- FlowPub — banner de perfil editable (idempotente). Correr en el SQL Editor.
-- La imagen sube al bucket `avatars` (carpeta uid, como la foto de perfil).

alter table public.profiles add column if not exists banner_url text;

-- Privilegios de columna (migration_03 acotó el update por columnas; sin este
-- grant, el update de banner_url falla aunque la RLS lo permita).
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, bio, avatar_url, banner_url, location, lang, theme, onboarded)
  on public.profiles to authenticated;

-- Verificación: la columna existe.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' and column_name = 'banner_url';
