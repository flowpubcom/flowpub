-- ─────────────────────────────────────────────────────────────────────────────
-- migration_20 · Perfil: lugar de origen + redes sociales + página web
--
-- Columnas nuevas en profiles (todas OPCIONALES). Las redes guardan el HANDLE
-- (sin @ ni URL); la app arma la liga canónica. `website` guarda una URL http(s)
-- ya normalizada por el cliente.
--
-- ⚠️ profiles tiene GRANT SELECT POR COLUMNA (privacidad de birthdate, migration_15):
-- hay que RE-OTORGAR select con TODAS las columnas públicas + las nuevas, o las
-- consultas que las pidan truenan con 42501. Misma historia para el update.
-- Idempotente: se puede correr dos veces.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles add column if not exists city      text;
alter table public.profiles add column if not exists state     text;
alter table public.profiles add column if not exists country   text;
alter table public.profiles add column if not exists website   text;
alter table public.profiles add column if not exists instagram text;
alter table public.profiles add column if not exists x         text;
alter table public.profiles add column if not exists tiktok    text;
alter table public.profiles add column if not exists youtube   text;

-- SELECT público (birthdate sigue FUERA a propósito). Lista completa:
revoke select on public.profiles from anon, authenticated;
grant select (id, username, display_name, bio, avatar_url, banner_url,
              location, city, state, country,
              website, instagram, x, tiktok, youtube,
              role, lang, theme, onboarded, created_at)
  on public.profiles to anon, authenticated;

-- UPDATE del propio perfil (birthdate incluida como ya estaba):
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, bio, avatar_url, banner_url, birthdate,
              location, city, state, country,
              website, instagram, x, tiktok, youtube,
              lang, theme, onboarded)
  on public.profiles to authenticated;

-- Verificación: las 8 columnas nuevas existen.
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name in
     ('city','state','country','website','instagram','x','tiktok','youtube')
 order by column_name;
