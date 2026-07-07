-- FlowPub — contenido sensible (idempotente). Correr en el SQL Editor.
-- Flags por Flow (lenguaje altisonante / 18+), fecha de nacimiento PRIVADA
-- para la compuerta de edad, y el tema «Hot» (siempre 18+).

-- ── 1) Flags del Flow ────────────────────────────────────────────────────────
alter table public.flows add column if not exists explicit_lang boolean not null default false;
alter table public.flows add column if not exists adult boolean not null default false;

revoke update on public.flows from anon, authenticated;
grant update (title, body_md, transcript_raw, audio_url, duration_s,
              cover_kind, cover_svg, cover_url, lang, status,
              explicit_lang, adult)
  on public.flows to authenticated;

-- ── 2) Fecha de nacimiento (PRIVADA: nadie la lee por la API) ────────────────
alter table public.profiles add column if not exists birthdate date;

-- Privacidad por privilegios de columna: el SELECT público de profiles ya no
-- incluye birthdate. (Enumera TODAS las demás columnas: si una falta, esa
-- consulta truena con 42501 — mantener esta lista al agregar columnas.)
revoke select on public.profiles from anon, authenticated;
grant select (id, username, display_name, bio, avatar_url, banner_url,
              location, role, lang, theme, onboarded, created_at)
  on public.profiles to anon, authenticated;

revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, bio, avatar_url, banner_url, birthdate,
              location, lang, theme, onboarded)
  on public.profiles to authenticated;

-- La propia fecha se lee solo vía RPC (security definer, fila propia).
create or replace function public.my_birthdate()
returns date language sql security definer stable set search_path = public as $$
  select birthdate from public.profiles where id = auth.uid();
$$;
revoke all on function public.my_birthdate() from public;
grant execute on function public.my_birthdate() to authenticated;

-- ── 3) Tema «Hot» (siempre 18+) ──────────────────────────────────────────────
insert into public.tags (slug, name_es, name_en, sort) values
  ('hot', 'Hot', 'Hot', 17)
on conflict (slug) do nothing;

-- Garantía del lado del servidor: etiquetar un Flow como Hot lo vuelve 18+
-- aunque el cliente no mande la casilla.
create or replace function public.enforce_hot_adult()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.tags t where t.id = new.tag_id and t.slug = 'hot') then
    update public.flows set adult = true where id = new.flow_id and adult = false;
  end if;
  return new;
end; $$;
drop trigger if exists trg_hot_adult on public.flow_tags;
create trigger trg_hot_adult after insert on public.flow_tags
  for each row execute function public.enforce_hot_adult();

-- Verificación: columnas nuevas + tag hot.
select column_name from information_schema.columns
 where table_schema='public' and table_name='flows'
   and column_name in ('explicit_lang','adult')
union all
select column_name from information_schema.columns
 where table_schema='public' and table_name='profiles' and column_name='birthdate'
union all
select slug from public.tags where slug='hot';
