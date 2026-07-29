-- ─────────────────────────────────────────────────────────────────────────────
-- verificar_estado.sql — ¿qué migraciones corrieron DE VERDAD en esta base?
--
-- Solo SELECTs: no cambia nada, se puede correr cuando sea. Nació en la
-- auditoría de la sesión 12, cuando descubrimos que la `migration_20` nunca se
-- había corrido (llevaba ~3 semanas sin correr y NADIE se enteró, porque el
-- front tiene cascadas tolerantes que degradan en silencio).
--
-- Cómo leerlo: cada fila dice «SÍ» o «FALTA». Si algo dice FALTA, corre esa
-- migración y vuelve a correr este script. Después de correr CUALQUIER
-- migración que toque `public.profiles`, corre también la `migration_25`
-- (repone los grants por columna, que un `revoke` se lleva entre las patas).
-- ─────────────────────────────────────────────────────────────────────────────

with checks(orden, migracion, que_verifica, ok) as (
  values
    (14, 'migration_14_banner_perfil', 'profiles.banner_url',
      exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='profiles' and column_name='banner_url')),

    (15, 'migration_15_contenido_sensible', 'flows.explicit_lang + profiles.birthdate',
      exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='flows' and column_name='explicit_lang')
      and exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='profiles' and column_name='birthdate')),

    (16, 'migration_16_dm_voz_privada', 'bucket privado `messages`',
      exists (select 1 from storage.buckets where id='messages' and public = false)),

    (17, 'migration_17_flows_tags_edicion', 'tema asmr + insert de tags para authenticated',
      exists (select 1 from public.tags where slug='asmr')),

    (18, 'migration_18_invites9_badges', 'RPC invite_redemptions(uuid)',
      exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
               where n.nspname='public' and p.proname='invite_redemptions')),

    (19, 'migration_19_hardening_seguridad', 'topes de bucket + CHECKs de tags',
      exists (select 1 from storage.buckets where id='audio' and file_size_limit is not null)
      and exists (select 1 from pg_constraint where conname='tags_slug_fmt')),

    (20, 'migration_20_perfil_origen_redes', 'profiles.city/website/instagram…',
      exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='profiles' and column_name='city')),

    (21, 'migration_21_analytics', 'tabla analytics_events + RPC track_event',
      to_regclass('public.analytics_events') is not null),

    (22, 'migration_22_push_y_cuenta', 'push_subscriptions + profiles.push_prefs',
      to_regclass('public.push_subscriptions') is not null
      and exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='profiles' and column_name='push_prefs')),

    (23, 'migration_23_guard_flow_status', 'trigger guard_flow_status en flows',
      exists (select 1 from pg_trigger where tgname='guard_flow_status' and not tgisinternal)),

    (24, 'migration_24_notifications_realtime', 'notifications en la publicación Realtime',
      exists (select 1 from pg_publication_tables
               where pubname='supabase_realtime' and tablename='notifications')),

    (25, 'migration_25_storage_privado_y_push_prefs', 'storage_read acotado al dueño + select de push_prefs',
      exists (select 1 from pg_policies
               where schemaname='storage' and tablename='objects'
                 and policyname='storage_read' and qual like '%foldername%')
      and has_column_privilege('authenticated', 'public.profiles', 'push_prefs', 'SELECT'))
)
select orden,
       case when ok then 'SÍ' else '⚠️ FALTA' end as corrio,
       migracion,
       que_verifica
  from checks
 order by orden;

-- ── Extra 1: grants por columna de profiles (el punto frágil del proyecto) ───
-- push_prefs debe salir con SELECT y UPDATE; birthdate SOLO con UPDATE (es
-- privada, se lee por el RPC my_birthdate()); role SOLO con SELECT.
select column_name,
       string_agg(privilege_type, ', ' order by privilege_type) as privilegios_de_authenticated
  from information_schema.column_privileges
 where table_schema='public' and table_name='profiles' and grantee='authenticated'
 group by column_name
 order by column_name;

-- ── Extra 2: tablas sin RLS en public (deberían ser CERO filas) ──────────────
select c.relname as tabla_sin_rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname='public' and c.relkind='r' and c.relrowsecurity = false
 order by 1;
