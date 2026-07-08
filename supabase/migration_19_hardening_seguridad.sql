-- ─────────────────────────────────────────────────────────────────────────────
-- migration_19 · Hardening de seguridad (audit de sesión 6)
--
-- Cierra tres hallazgos del audit, todos del lado de la BD:
--   1. Buckets sin tope de tamaño ni tipo → un usuario podía subir un archivo
--      enorme o de content-type inesperado (costo de storage/egress).
--   2. tags.slug/name_* sin CHECK → la validación 3–24 del cliente se brinca con
--      un INSERT directo por REST; basura/slug vacío/miles de chars.
--   3. tags.sort sin cota → un usuario podía poner sort negativo para dominar el
--      orden de los listados de temas.
--
-- El XSS de JSON-LD (crítico) se arregló en CÓDIGO (lib/jsonLd.ts), no aquí.
-- Idempotente: se puede correr dos veces sin drama.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Límites por bucket ───────────────────────────────────────────────────────
-- Imágenes: 5 MB, solo formatos web comunes.
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
 where id in ('avatars', 'covers');

-- Audio: 25 MB (un Flow de 3 min pesa ~1 MB; 25 deja aire de sobra), tipos que
-- de verdad graba el navegador / acepta Gemini.
update storage.buckets
   set file_size_limit = 26214400,
       allowed_mime_types = array[
         'audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav','audio/x-m4a'
       ]
 where id in ('audio', 'messages');

-- 2) CHECKs de tags (la validación deja de ser solo del cliente) ──────────────
-- slug: minúsculas, dígitos y guiones; 2–24. name_es/name_en: 1–40.
-- Los seeds curados y ASMR ya cumplen; no hay temas de usuario en prod aún.
alter table public.tags drop constraint if exists tags_slug_fmt;
alter table public.tags
  add constraint tags_slug_fmt
  check (slug ~ '^[a-z0-9][a-z0-9-]{1,23}$');

alter table public.tags drop constraint if exists tags_name_len;
alter table public.tags
  add constraint tags_name_len
  check (
    char_length(name_es) between 1 and 40
    and char_length(name_en) between 1 and 40
  );

-- 3) sort no puede ser negativo ───────────────────────────────────────────────
alter table public.tags drop constraint if exists tags_sort_nonneg;
alter table public.tags
  add constraint tags_sort_nonneg check (sort >= 0);
