-- FlowPub — seed de contenido demo para el Pub (córrelo una vez; idempotente).
--
-- Como `profiles.id` referencia `auth.users(id)`, los autores demo deben existir
-- en auth.users. Los creamos con password ALEATORIO (no son login-ables: son solo
-- autores de contenido). El trigger `on_auth_user_created` les crea el profile;
-- luego lo pulimos (username/display_name limpios + onboarded).
--
-- Correr en el SQL Editor DESPUÉS de schema.sql.

-- ── 1) autores demo en auth.users ───────────────────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  u.id::uuid, 'authenticated', 'authenticated', u.email,
  crypt(gen_random_uuid()::text, gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', u.display_name, 'user_name', u.username),
  '', '', '', ''
from (values
  ('10000000-0000-0000-0000-000000000001','julio.demo@flowpub.lat','julio','Julio'),
  ('10000000-0000-0000-0000-000000000002','maria.demo@flowpub.lat','maria','María'),
  ('10000000-0000-0000-0000-000000000003','ines.demo@flowpub.lat','ines','Inés'),
  ('10000000-0000-0000-0000-000000000004','tomas.demo@flowpub.lat','tomas','Tomás'),
  ('10000000-0000-0000-0000-000000000005','renata.demo@flowpub.lat','renata','Renata'),
  ('10000000-0000-0000-0000-000000000006','sof.demo@flowpub.lat','sof','Sof')
) as u(id, email, username, display_name)
where not exists (select 1 from auth.users a where a.id = u.id::uuid);

-- ── 2) pule los perfiles creados por el trigger ─────────────────────────────
update public.profiles p set
  username     = v.username,
  display_name = v.display_name,
  onboarded    = true
from (values
  ('10000000-0000-0000-0000-000000000001','anto','Anton'),
  ('10000000-0000-0000-0000-000000000002','maria','María'),
  ('10000000-0000-0000-0000-000000000003','ines','Inés'),
  ('10000000-0000-0000-0000-000000000004','tomas','Tomás'),
  ('10000000-0000-0000-0000-000000000005','renata','Renata'),
  ('10000000-0000-0000-0000-000000000006','sof','Sof')
) as v(id, username, display_name)
where p.id = v.id::uuid;

-- ── 3) Flows ────────────────────────────────────────────────────────────────
insert into public.flows (
  id, author_id, title, body_md, transcript_raw, duration_s,
  cover_kind, lang, status, like_count, comment_count, created_at
)
select
  f.id::uuid, f.author_id::uuid, f.title, f.body_md, null, f.duration_s,
  f.cover_kind, 'es', 'published', f.like_count, f.comment_count,
  now() - (f.age_min || ' minutes')::interval
from (values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',
   'Nueve minutos sobre el barro',
   'Hoy quiero hablar de algo que llevo pensando entre el barro y los datos: cómo lo que se moldea con las manos también guarda memoria, y por qué la voz es el primer molde.',
   540,'escher',128,14,120),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',
   'Cuando una voz se vuelve archivo',
   'No es lo mismo escribir que hablar. La transcripción guarda las palabras, pero el audio guarda las dudas, las pausas, el cuerpo de quien habla.',
   360,'turrell',86,9,1440),
  ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003',
   'La ciencia también se cuenta en voz alta',
   'Pasé años escribiendo papers que nadie leía completos. Hoy grabé en siete minutos la idea que de verdad importa, y por fin suena a lo que es.',
   420,'flavin',203,27,240),
  ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004',
   'Un mapa hablado de la ciudad',
   'Caminé sin Google Maps por una ciudad que no conocía y grabé lo que me iban diciendo los desconocidos. Un mapa que solo existe en voz.',
   300,'collage',54,6,480),
  ('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000005',
   'Releer en voz alta lo que no entendí',
   'Hay libros que solo se abren cuando los dices. Grabé el párrafo que llevo un año sin entender y, al oírme, por fin lo escuché.',
   510,'turrell',71,11,60),
  ('20000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000006',
   'El cine que se escucha mejor que se ve',
   'Cerré los ojos en la última función y descubrí otra película. Aquí va lo que oí cuando dejé de mirar.',
   393,'collage',39,4,30)
) as f(id, author_id, title, body_md, duration_s, cover_kind, like_count, comment_count, age_min)
where not exists (select 1 from public.flows x where x.id = f.id::uuid);

-- ── 4) flow_tags (tag primario por slug) ────────────────────────────────────
insert into public.flow_tags (flow_id, tag_id)
select f.flow_id::uuid, t.id
from (values
  ('20000000-0000-0000-0000-000000000001','arte'),
  ('20000000-0000-0000-0000-000000000002','cultura'),
  ('20000000-0000-0000-0000-000000000003','ciencia'),
  ('20000000-0000-0000-0000-000000000004','viajes'),
  ('20000000-0000-0000-0000-000000000005','libros'),
  ('20000000-0000-0000-0000-000000000006','cine')
) as f(flow_id, slug)
join public.tags t on t.slug = f.slug
where not exists (
  select 1 from public.flow_tags x where x.flow_id = f.flow_id::uuid and x.tag_id = t.id
);
