-- migration_21_analytics.sql
-- Analytics propias, privacy-first. Tres piezas:
--   1) tabla analytics_events — SOLO el admin la lee (RLS). Nadie inserta directo.
--   2) track_event() — RPC security-definer para registrar una vista validada
--      (así la escritura no expone INSERT por REST y se normaliza en un solo lugar).
--   3) admin_analytics() — RPC security-definer que devuelve los agregados ya
--      cocinados para el panel (guarda is_admin()).
-- Sin PII: no se guarda IP (solo país ISO-2 derivado en el servidor), el "session"
-- es un id anónimo de localStorage (no cookie). Idempotente.

-- ── tabla ────────────────────────────────────────────────────────────────────
create table if not exists public.analytics_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  event       text not null default 'view'
              check (event in ('view','record_start','publish','signup')),
  path        text,
  ref         text,     -- host del referrer (sin querystring, sin PII)
  device      text check (device is null or device in ('mobile','desktop')),
  lang        text check (lang is null or lang in ('es','en')),
  country     text,     -- ISO-2, derivado del header de Vercel en el servidor
  session     text,     -- id anónimo (localStorage, NO cookie, NO PII)
  flow_id     uuid references public.flows(id) on delete set null
);

create index if not exists analytics_events_created_idx
  on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_created_idx
  on public.analytics_events (event, created_at desc);
create index if not exists analytics_events_flow_idx
  on public.analytics_events (flow_id) where flow_id is not null;

alter table public.analytics_events enable row level security;

-- Solo el admin LEE. La escritura no pasa por la tabla (default-deny), pasa por
-- track_event(). RLS de lectura como defensa en profundidad.
drop policy if exists analytics_read on public.analytics_events;
create policy analytics_read on public.analytics_events
  for select using (public.is_admin());

revoke all on public.analytics_events from anon, authenticated;
grant select on public.analytics_events to authenticated; -- la RLS lo acota a admin

-- ── registrar un evento (validado, security definer) ─────────────────────────
create or replace function public.track_event(
  p_event   text,
  p_path    text,
  p_ref     text,
  p_device  text,
  p_lang    text,
  p_country text,
  p_session text,
  p_flow_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.analytics_events
    (event, path, ref, device, lang, country, session, flow_id)
  values (
    case when p_event in ('view','record_start','publish','signup') then p_event else 'view' end,
    left(coalesce(p_path, ''), 512),
    left(coalesce(p_ref, ''), 255),
    case when p_device in ('mobile','desktop') then p_device end,
    case when p_lang in ('es','en') then p_lang end,
    case when p_country ~ '^[A-Za-z]{2}$' then upper(p_country) end,
    left(coalesce(p_session, ''), 64),
    case when p_flow_id is not null
           and exists (select 1 from public.flows where id = p_flow_id)
         then p_flow_id end
  );
end;
$$;

revoke all on function public.track_event(text,text,text,text,text,text,text,uuid) from public;
grant execute on function public.track_event(text,text,text,text,text,text,text,uuid) to anon, authenticated;

-- ── agregados para el panel (solo admin) ─────────────────────────────────────
create or replace function public.admin_analytics(p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days  int := greatest(1, least(coalesce(p_days, 30), 90));
  v_since timestamptz := now() - make_interval(days => v_days);
  result  jsonb;
begin
  if not public.is_admin() then
    return null;
  end if;

  select jsonb_build_object(
    'days', v_days,
    'total_views',
      (select count(*) from analytics_events
        where event = 'view' and created_at >= v_since),
    'total_sessions',
      (select count(distinct session) from analytics_events
        where event = 'view' and created_at >= v_since and coalesce(session,'') <> ''),
    'views_by_day', coalesce((
      select jsonb_agg(jsonb_build_object('d', d, 'count', c) order by d)
      from (
        select gs::date as d, count(e.id) as c
        from generate_series(v_since::date, now()::date, interval '1 day') gs
        left join analytics_events e
          on e.event = 'view' and e.created_at >= v_since
         and e.created_at::date = gs::date
        group by gs::date
      ) q
    ), '[]'::jsonb),
    'top_paths', coalesce((
      select jsonb_agg(jsonb_build_object('path', path, 'count', c) order by c desc)
      from (
        select case
                 when path ~ '^/flow/' then '/flow/:id'
                 when path ~ '^/@'     then '/@usuario'
                 when path ~ '^/tema/' then '/tema/:slug'
                 else coalesce(nullif(path, ''), '/')
               end as path,
               count(*) as c
        from analytics_events
        where event = 'view' and created_at >= v_since
        group by 1 order by c desc limit 8
      ) q
    ), '[]'::jsonb),
    'top_flows', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', f.id,
               'title', coalesce(nullif(f.title, ''), '(sin título)'),
               'count', q.c) order by q.c desc)
      from (
        select flow_id, count(*) as c
        from analytics_events
        where event = 'view' and flow_id is not null and created_at >= v_since
        group by flow_id order by c desc limit 6
      ) q join flows f on f.id = q.flow_id
    ), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(jsonb_build_object('host', host, 'count', c) order by c desc)
      from (
        select ref as host, count(*) as c
        from analytics_events
        where event = 'view' and coalesce(ref, '') <> '' and created_at >= v_since
        group by ref order by c desc limit 6
      ) q
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('device', device, 'count', c) order by c desc)
      from (
        select coalesce(device, '—') as device, count(*) as c
        from analytics_events
        where event = 'view' and created_at >= v_since
        group by device order by c desc
      ) q
    ), '[]'::jsonb),
    'langs', coalesce((
      select jsonb_agg(jsonb_build_object('lang', lang, 'count', c) order by c desc)
      from (
        select coalesce(lang, '—') as lang, count(*) as c
        from analytics_events
        where event = 'view' and created_at >= v_since
        group by lang order by c desc
      ) q
    ), '[]'::jsonb),
    'new_users',
      (select count(*) from profiles where created_at >= v_since),
    'new_flows',
      (select count(*) from flows
        where status in ('published','featured') and created_at >= v_since)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_analytics(int) from public;
grant execute on function public.admin_analytics(int) to authenticated;

-- Verificación rápida (como admin): select public.admin_analytics(30);
