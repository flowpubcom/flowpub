-- FlowPub — comentarios demo + alinear comment_count (córrelo una vez; idempotente).
-- Opcional pero recomendado: el seed inicial puso comment_count inventados; aquí
-- sembramos comentarios reales y recomputamos el contador a la realidad, para que
-- las tarjetas del Pub cuadren con la lista al abrir el Flow.
-- Correr DESPUÉS de migration_01_seed_demo.sql.

insert into public.comments (id, flow_id, author_id, kind, body_text, created_at)
select
  c.id::uuid, c.flow_id::uuid, c.author_id::uuid, 'text', c.body_text,
  now() - (c.age_min || ' minutes')::interval
from (values
  ('30000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002',
   'Me quedé pensando en eso del barro como primer molde. Hermosa idea.', 80),
  ('30000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003',
   'La voz que guarda memoria. Me lo llevo.', 25),
  ('30000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004',
   'Siete minutos y por fin entendí el paper que llevaba años posponiendo. Gracias.', 60)
) as c(id, flow_id, author_id, body_text, age_min)
where not exists (select 1 from public.comments x where x.id = c.id::uuid);

-- Recomputa el contador real (el trigger sumó sobre los números inventados del seed).
update public.flows f
set comment_count = (select count(*) from public.comments c where c.flow_id = f.id)
where f.id in (
  '20000000-0000-0000-0000-000000000001'::uuid,
  '20000000-0000-0000-0000-000000000002'::uuid,
  '20000000-0000-0000-0000-000000000003'::uuid,
  '20000000-0000-0000-0000-000000000004'::uuid,
  '20000000-0000-0000-0000-000000000005'::uuid,
  '20000000-0000-0000-0000-000000000006'::uuid
);
