-- ─────────────────────────────────────────────────────────────────────────────
-- migration_29 · Semilla de la portada (que lo que ves al publicar sea lo que sale)
--
-- Qué arregla: la vista previa del composer dibujaba con una semilla fija
-- («compose-0»), y la tarjeta publicada dibuja con el id del Flow — que no
-- existe todavía mientras escribes. Resultado: la dirección de arte coincidía
-- pero la COMPOSICIÓN no. Enseñar una portada y publicar otra se siente mal
-- aunque nadie sepa nombrar por qué.
--
-- Cómo: `flows.cover_seed` guarda la semilla que el composer usó para dibujar
-- la previa. Al pintar se usa `cover_seed` y, si falta, se cae al id del Flow —
-- así los Flows de antes se siguen viendo EXACTAMENTE igual que hoy (su semilla
-- siempre fue su id). Nada que rellenar hacia atrás.
--
-- ⚠️ `flows` tiene UPDATE por columna (schema.sql, re-afirmado en migration_15
-- y 17): una columna nueva es invisible al editor hasta que se le da grant. Se
-- re-arma la lista COMPLETA de forma DINÁMICA contra information_schema, igual
-- que en migration_25/27, para no perder ninguna por omisión.
--
-- El INSERT no necesita grant por columna: sobre `flows` nunca se revocó
-- (solo el UPDATE), así que publicar ya puede escribir la semilla.
--
-- Idempotente: se puede correr dos veces sin daño.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.flows add column if not exists cover_seed text;

-- Cota de sanidad: es una semilla corta, no un campo de texto libre.
alter table public.flows drop constraint if exists flows_cover_seed_len;
alter table public.flows
  add constraint flows_cover_seed_len
  check (cover_seed is null or char_length(cover_seed) <= 64);

-- ── UPDATE por columna de flows, calculado contra el esquema REAL ────────────
-- Nadie edita author_id, contadores ni created_at: no están en la lista.
do $$
declare
  upd_cols text;
begin
  select string_agg(quote_ident(col), ', ' order by ord)
    into upd_cols
    from unnest(array[
           'title','body_md','transcript_raw','audio_url','duration_s',
           'cover_kind','cover_svg','cover_url','cover_seed',
           'lang','status','explicit_lang','adult'
         ]) with ordinality as t(col, ord)
   where exists (
     select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'flows'
        and column_name = t.col
   );

  if upd_cols is null then
    raise exception 'No se pudo calcular la lista de columnas de public.flows';
  end if;

  execute 'revoke update on public.flows from anon, authenticated';
  execute format('grant update (%s) on public.flows to authenticated', upd_cols);

  raise notice 'flows → UPDATE: %', upd_cols;
end $$;

-- ── Verificación ─────────────────────────────────────────────────────────────
-- `cover_seed` debe aparecer con UPDATE; `author_id` y `like_count` NO.
select column_name,
       string_agg(privilege_type, ', ' order by privilege_type) as privilegios
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'flows'
   and grantee = 'authenticated'
   and column_name in ('cover_seed', 'cover_kind', 'author_id', 'like_count')
 group by column_name
 order by column_name;
