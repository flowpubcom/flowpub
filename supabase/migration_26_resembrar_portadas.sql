-- ─────────────────────────────────────────────────────────────────────────────
-- migration_26 · Re-sembrar la dirección de arte de las portadas existentes
--
-- OPCIONAL y COSMÉTICA. Corre esto solo si quieres que los Flows YA publicados
-- estrenen portada; el arreglo de código (Composer) ya cubre los nuevos.
--
-- Por qué: el composer fijaba `cover_kind` en el índice 0 —«escher», los cubos
-- isométricos— y lo volvía a fijar después del pulido, así que salvo que el
-- autor tocara «regenerar portada», TODOS los Flows nacían con cubos y las
-- otras tres direcciones no se usaban nunca. Medido el 2026-07-29 en
-- producción: **7 de 9 Flows en `escher`**, 2 en `turrell`, cero en `flavin` y
-- `collage`.
--
-- Qué hace: reparte las cuatro direcciones de forma determinista a partir del
-- id del Flow (mismo id → misma portada, siempre). No toca:
--   · Flows con `cover_url` (foto propia del autor): ahí la generativa ni se ve.
--   · Ninguna otra columna. Es solo un cambio de apariencia.
--
-- Nota: el hash NO tiene que coincidir con el `kindFromSeed` del front. La
-- columna guarda la dirección elegida; el dibujo se siembra aparte con el id
-- del Flow. Aquí solo hace falta que el reparto sea variado y estable.
--
-- Reversible en la práctica: volver a correrlo da EXACTAMENTE el mismo
-- resultado (es determinista), pero el valor anterior no se guarda — y el
-- anterior era «escher» en casi todos.
-- ─────────────────────────────────────────────────────────────────────────────

-- Antes: cómo está el reparto hoy.
select cover_kind, count(*) as flows
  from public.flows
 where cover_url is null
 group by cover_kind
 order by 2 desc;

-- El reparto: los 8 primeros hex del md5 del id → entero → una de 4 direcciones.
update public.flows
   set cover_kind = (array['escher','turrell','flavin','collage'])[
         (('x' || substr(md5(id::text), 1, 8))::bit(32)::bigint % 4) + 1
       ]
 where cover_url is null;

-- Después: debe verse repartido entre las cuatro.
select cover_kind, count(*) as flows
  from public.flows
 where cover_url is null
 group by cover_kind
 order by 2 desc;
