-- FlowPub — temas nuevos: Ambiental y Rants (idempotente). SQL Editor.

insert into public.tags (slug, name_es, name_en, sort) values
  ('ambiental', 'Ambiental', 'Environment', 15),
  ('rants',     'Rants',     'Rants',       16)
on conflict (slug) do nothing;

-- Verificación: los 16 temas activos en orden.
select slug, name_es, name_en, sort from public.tags where active order by sort;
