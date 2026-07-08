-- FlowPub — migration_17: edición completa del Flow (portada + temas) y temas
-- creados por usuarios (ASMR + los que la gente proponga). Idempotente. SQL Editor.
--
-- Qué habilita:
--   1) Editar la portada de un Flow propio (cover_url / cover_kind) desde el modal.
--   2) Editar los temas de un Flow propio (borrar + reinsertar en flow_tags).
--   3) El tema ASMR como seed formal.
--   4) Que cualquier usuario registrado proponga un tema nuevo (con freno de spam:
--      solo puede nombrar/sluggear la fila que crea, nunca tocar otras ni editar;
--      el admin desactiva temas indebidos desde /admin → Temas).
--
-- Nota: schema.sql (instalaciones nuevas) ya trae casi todo esto; esta migración
-- lo aplica a proyectos que corrieron un schema anterior y agrega lo de temas de
-- usuario. Todo re-ejecutable sin daño.

-- ── 1) Privilegios de columna del UPDATE de flows ────────────────────────────
-- Re-afirma el set granteado incluyendo cover_url y cover_kind (que el modal de
-- edición ahora escribe). Nadie edita role/contadores: solo columnas de
-- contenido. IMPORTANTE: se re-lista el set COMPLETO (con explicit_lang/adult de
-- migration_15) porque el `revoke ... update` de abajo tumba todos los grants de
-- columna previos; si omitiéramos alguno, lo perderíamos. Mismo patrón que
-- schema.sql / migration_03 / migration_15.
revoke update on public.flows from anon, authenticated;
grant update (title, body_md, transcript_raw, audio_url, duration_s,
              cover_kind, cover_svg, cover_url, lang, status,
              explicit_lang, adult)
  on public.flows to authenticated;

-- ── 2) flow_tags: editar los temas del Flow propio ──────────────────────────
-- `for all` cubre INSERT y DELETE: el autor puede reinsertar sus temas (borrar
-- los viejos + poner los nuevos, máx 3 por el trigger enforce_max_tags). Se
-- re-crea idempotente por si un entorno quedó con una policy más angosta.
drop policy if exists flow_tags_write on public.flow_tags;
create policy flow_tags_write on public.flow_tags for all
  using (exists (select 1 from public.flows f where f.id = flow_id and f.author_id = auth.uid()))
  with check (exists (select 1 from public.flows f where f.id = flow_id and f.author_id = auth.uid()));

-- ── 3) Seed del tema ASMR ────────────────────────────────────────────────────
-- Mismo formato que los seeds previos (migration_09 / 12). active=true por default.
insert into public.tags (slug, name_es, name_en, sort) values
  ('asmr', 'ASMR', 'ASMR', 17)
on conflict (slug) do nothing;

-- ── 4) Temas creados por usuarios ────────────────────────────────────────────
-- Unicidad del slug: la columna ya es `unique` en schema.sql; este índice es una
-- red de seguridad idempotente para entornos donde la constraint faltara.
create unique index if not exists tags_slug_unique_idx on public.tags (slug);

-- Policy de INSERT para authenticated (además del tags_admin `for all` que ya
-- existe). Cualquier usuario con sesión puede proponer un tema.
drop policy if exists tags_insert_own on public.tags;
create policy tags_insert_own on public.tags for insert to authenticated
  with check (auth.uid() is not null);

-- Freno de columnas: un usuario SOLO puede escribir nombre/slug/sort de la fila
-- que crea. `active` NO se grantea → cae al default true (no puede nacer oculto
-- ni forzar visibilidad de otro modo); `id` es identity; nadie puede setear otras
-- columnas. Sin UPDATE ni DELETE para no-admin: no pueden tocar temas ajenos ni
-- los propios una vez creados (eso lo maneja el admin).
--   ⚠️ Riesgo de spam: alguien podría crear temas basura vía la API. Mitigación:
--   el admin los desactiva desde /admin → Temas (active=false los saca de filtros
--   y del onboarding). Si el spam se vuelve problema, subir el gate a solo-follows
--   o moderación previa.
revoke insert on public.tags from anon, authenticated;
grant insert (slug, name_es, name_en, sort) on public.tags to authenticated;

-- Verificación: los temas activos en orden (incluye ASMR y los de usuario).
select slug, name_es, name_en, active, sort from public.tags order by sort;
