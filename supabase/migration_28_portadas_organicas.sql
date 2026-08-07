-- ─────────────────────────────────────────────────────────────────────────────
-- migration_28 · Tres direcciones de arte ORGÁNICAS para las portadas
--
-- 🚨 CORRE ESTA MIGRACIÓN **ANTES** DE DESPLEGAR EL CÓDIGO QUE LA ACOMPAÑA.
--    `flows.cover_kind` tiene un CHECK con la lista de direcciones válidas. Si
--    el front ya siembra «riley» y la base todavía no lo acepta, **publicar un
--    Flow truena** con violación de constraint. Primero la base, luego el push.
--
-- Qué agrega: `riley`, `eliasson` y `saraceno` a las cuatro que ya existían.
-- Las cuatro viejas son geométricas y duras (Escher, Turrell, Flavin, collage
-- 90s); estas tres son orgánicas — ondas que respiran, atmósfera con capas
-- translúcidas, y partículas a la deriva con profundidad de campo. Misma
-- paleta bloqueada, mismo grano, mismo determinismo por seed.
--
-- Por qué: el sistema se sentía puro ángulo recto, y la voz humana no es un
-- cubo. (Además, hasta el arreglo del composer de esta misma tanda, TODOS los
-- Flows salían con la misma dirección — ver migration_26.)
--
-- Idempotente: se puede correr dos veces sin daño.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.flows drop constraint if exists flows_cover_kind_check;
alter table public.flows
  add constraint flows_cover_kind_check
  check (cover_kind in (
    'escher', 'turrell', 'flavin', 'collage',
    'riley', 'eliasson', 'saraceno'
  ));

-- ── Verificación ─────────────────────────────────────────────────────────────
-- 1) El CHECK debe listar las siete:
select conname, pg_get_constraintdef(oid) as definicion
  from pg_constraint
 where conrelid = 'public.flows'::regclass
   and conname = 'flows_cover_kind_check';

-- 2) Reparto actual (tras migration_26 deberían verse repartidas; las orgánicas
--    aparecerán conforme se publiquen Flows nuevos):
select cover_kind, count(*) as flows
  from public.flows
 group by cover_kind
 order by 2 desc;

-- ── ¿Quieres que los Flows YA publicados estrenen también las orgánicas? ─────
-- Opcional. Re-reparte entre las SIETE (solo los que usan portada generativa,
-- es decir, sin foto propia). Determinista por id. Descomenta para correrlo:
--
-- update public.flows
--    set cover_kind = (array[
--          'escher','turrell','flavin','collage','riley','eliasson','saraceno'
--        ])[ (('x' || substr(md5(id::text), 1, 8))::bit(32)::bigint % 7) + 1 ]
--  where cover_url is null;
