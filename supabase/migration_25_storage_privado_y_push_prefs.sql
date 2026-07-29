-- ─────────────────────────────────────────────────────────────────────────────
-- migration_25 · Dos hallazgos de la auditoría integral (sesión 12), ambos
-- verificados EN VIVO contra producción con la anon key.
--
-- ⚠️ v2 — la v1 tronaba con «column "city" of relation "profiles" does not
-- exist» porque **la migration_20 nunca se corrió en producción** (verificado:
-- city/state/country/website/instagram/x/tiktok/youtube dan 42703 = no
-- existen). Como el SQL Editor envuelve el script en UNA transacción, ese
-- error tiró TODO para atrás, incluida la parte de storage. Esta versión arma
-- los grants **dinámicamente**, con la intersección entre las columnas que
-- queremos y las que de verdad existen → corre igual, haya corrido o no la 20.
--
-- 👉 ORDEN: si algún día corres la `migration_20` (para prender origen/redes/web
--    en el perfil), **vuelve a correr ESTA migración después**. La 20 hace
--    `revoke ... on public.profiles` y se lleva entre las patas el grant de
--    `push_prefs`; correr la 25 al final lo repone (y ya incluirá las 8
--    columnas nuevas, porque las detecta solas).
--
--   1) [ALTO · privacidad] Los buckets `audio`, `covers` y `avatars` son
--      ENUMERABLES por cualquier anónimo. La policy `storage_read` de
--      schema.sql permite SELECT sobre storage.objects con la sola condición
--      `bucket_id in (...)`, sin acotar por dueño — así que un
--      `POST /storage/v1/object/list/audio` sin sesión devuelve las carpetas
--      (un uid por carpeta) y, descendiendo, TODOS los nombres de archivo.
--      Medido el 2026-07-29: 30 audios enumerables, de los cuales 21 NO están
--      referenciados por ningún Flow ni comentario público (borradores, Flows
--      ocultos, grabaciones abandonadas), descargables sin llave. En una app
--      voice-first eso es la voz de la gente: el dato más íntimo que guardamos.
--
--      El arreglo acota el SELECT al dueño de la carpeta (`<uid>/archivo`,
--      mismo criterio que las policies de insert/update/delete de junto).
--      NO rompe nada: la app nunca lista buckets (solo `upload`,
--      `getPublicUrl` y `createSignedUrl`), y en un bucket PÚBLICO la ruta
--      `/storage/v1/object/public/<bucket>/<path>` se sirve por CDN sin pasar
--      por RLS — verificado con un HEAD sin apikey: 200. O sea: portadas,
--      avatares y audios de Flows publicados se siguen viendo y oyendo igual;
--      lo que muere es la enumeración.
--
--      ⚠️ Esto cierra el descubrimiento, no el acceso directo: quien YA tenga
--      la URL de un audio de borrador la sigue pudiendo abrir (los paths son
--      UUID, así que no se adivinan). El cierre completo es volver `audio`
--      privado + signed URLs, como ya hace `messages` desde migration_16 —
--      cambio más grande (toca reader, feed, radio, OG y RSS), documentado en
--      ESTADO.md como siguiente paso.
--
--   2) [MEDIO · bug vivo] `profiles.push_prefs` (migration_22) nunca recibió
--      GRANT de SELECT, y `profiles` tiene los grants partidos por columna
--      desde migration_15. Verificado: `select push_prefs` responde 42501
--      (permission denied) tanto a anon como a authenticated. Efecto:
--      `fetchPushPrefs()` (src/data/settingsClient.ts) se traga el error y cae
--      a los defaults en true, así que /configuración SIEMPRE pinta los tres
--      switches de push encendidos aunque el usuario los haya apagado. El
--      guardado sí funcionaba (update sí estaba granteado) y el Edge Function
--      los respetaba (lee con service_role) — el usuario veía una mentira.
--
-- Idempotente: se puede correr dos veces sin daño.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1) Storage: se acaba la enumeración anónima ──────────────────────────────
-- (Bloque autónomo: si algo más fallara, este se puede correr solo.)
-- Solo el dueño de la carpeta ve las filas de storage.objects de estos buckets.
-- Los buckets públicos se siguen sirviendo por /object/public/… sin tocar RLS.
drop policy if exists storage_read on storage.objects;
create policy storage_read on storage.objects for select
  using (
    bucket_id in ('audio', 'avatars', 'covers')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── 2) profiles: grants por columna, calculados contra el esquema REAL ───────
-- Se piden todas las columnas públicas conocidas (las de schema.sql + las que
-- agregaron las migraciones 14/20/22) y se grantean SOLO las que existen hoy.
-- Así el script no truena si una migración intermedia no se ha corrido.
--   · `birthdate` va SOLO en UPDATE: se lee únicamente por el RPC
--     my_birthdate() (privacidad, migration_15).
--   · `role`, `created_at` y los contadores NO se grantean en UPDATE: nadie se
--     auto-promueve a admin por la API.
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
-- a) push_prefs debe aparecer con SELECT **y** UPDATE; birthdate SOLO con
--    UPDATE; role SOLO con SELECT.
select column_name, string_agg(privilege_type, ', ' order by privilege_type) as privilegios
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'profiles'
   and grantee = 'authenticated'
   and column_name in ('push_prefs', 'birthdate', 'role')
 group by column_name
 order by column_name;

-- b) La policy de lectura de storage ya exige dueño (el `qual` debe mencionar
--    auth.uid() y storage.foldername):
select policyname, qual
  from pg_policies
 where schemaname = 'storage' and tablename = 'objects'
   and policyname = 'storage_read';

-- c) Prueba de humo (fuera del SQL Editor, sin sesión): un
--    POST /storage/v1/object/list/audio con la anon key debe devolver []
--    y un GET a la URL pública de un audio publicado debe seguir dando 200.
