-- FlowPub — temas nuevos: Filosofía y Chistes (idempotente). SQL Editor.
-- (También se puede desde /admin → Temas; esto los deja como seed formal.)

insert into public.tags (slug, name_es, name_en, sort) values
  ('filosofia', 'Filosofía', 'Philosophy', 13),
  ('chistes',   'Chistes',   'Jokes',      14)
on conflict (slug) do nothing;

-- Verificación: los 14 temas activos en orden.
select slug, name_es, name_en, sort from public.tags where active order by sort;
