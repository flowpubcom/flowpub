-- ─────────────────────────────────────────────────────────────────────────────
-- migration_27 · Presentación por voz en el perfil
--
-- Qué habilita: que cada quien se presente HABLANDO. Un audio breve (≤ 60 s)
-- que vive arriba de la bio, se reproduce y ya — sin transcript, sin pulido,
-- sin Gemini. Es la voz cruda de la persona, que es justo el punto.
--
-- Dos columnas nuevas en `profiles`:
--   · `intro_audio_url` — URL pública del audio (bucket `audio`, carpeta del
--     propio usuario: la policy de storage exige `<uid>/archivo`).
--   · `intro_duration_s` — duración en segundos, para pintar el reproductor sin
--     tener que descargar el audio. Acotada 0–60 por CHECK: el límite deja de
--     ser solo del cliente y no se brinca con un PATCH por REST.
--
-- ⚠️ GRANTS POR COLUMNA (el gotcha caro de este proyecto): `profiles` tiene
-- revocado el SELECT/UPDATE de tabla desde migration_15, así que una columna
-- nueva es INVISIBLE hasta que se le da grant explícito. Ya mordió dos veces
-- (`push_prefs` quedó sin SELECT tres semanas y los switches de push mentían).
-- Por eso aquí se re-arma la lista COMPLETA de forma DINÁMICA contra
-- information_schema, igual que migration_25: así corre aunque falte alguna
-- migración intermedia y no se pierde ningún grant por omisión.
--
-- Idempotente: se puede correr dos veces sin daño.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists intro_audio_url  text;
alter table public.profiles
  add column if not exists intro_duration_s int not null default 0;

-- El tope de 1 minuto, del lado del servidor.
alter table public.profiles drop constraint if exists profiles_intro_duration;
alter table public.profiles
  add constraint profiles_intro_duration
  check (intro_duration_s >= 0 and intro_duration_s <= 60);

-- ── Grants por columna, calculados contra el esquema REAL ────────────────────
-- Mismo patrón que migration_25. `birthdate` va SOLO en UPDATE (es privada: se
-- lee por el RPC my_birthdate). `role` y `created_at` NUNCA en UPDATE.
do $$
declare
  sel_cols text;
  upd_cols text;
begin
  select string_agg(quote_ident(col), ', ' order by ord)
    into sel_cols
    from unnest(array[
           'id','username','display_name','bio','avatar_url','banner_url',
           'location','city','state','country',
           'website','instagram','x','tiktok','youtube',
           'intro_audio_url','intro_duration_s',
           'role','lang','theme','onboarded','push_prefs','created_at'
         ]) with ordinality as t(col, ord)
   where exists (
     select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles'
        and column_name = t.col
   );

  select string_agg(quote_ident(col), ', ' order by ord)
    into upd_cols
    from unnest(array[
           'username','display_name','bio','avatar_url','banner_url','birthdate',
           'location','city','state','country',
           'website','instagram','x','tiktok','youtube',
           'intro_audio_url','intro_duration_s',
           'lang','theme','onboarded','push_prefs'
         ]) with ordinality as t(col, ord)
   where exists (
     select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles'
        and column_name = t.col
   );

  if sel_cols is null or upd_cols is null then
    raise exception 'No se pudo calcular la lista de columnas de public.profiles';
  end if;

  execute 'revoke select on public.profiles from anon, authenticated';
  execute format(
    'grant select (%s) on public.profiles to anon, authenticated', sel_cols);

  execute 'revoke update on public.profiles from anon, authenticated';
  execute format(
    'grant update (%s) on public.profiles to authenticated', upd_cols);

  raise notice 'profiles → SELECT: %', sel_cols;
  raise notice 'profiles → UPDATE: %', upd_cols;
end $$;

-- ── Verificación ─────────────────────────────────────────────────────────────
-- Las dos columnas nuevas deben salir con SELECT y UPDATE:
select column_name,
       string_agg(privilege_type, ', ' order by privilege_type) as privilegios
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'profiles'
   and grantee = 'authenticated'
   and column_name in ('intro_audio_url', 'intro_duration_s')
 group by column_name
 order by column_name;
