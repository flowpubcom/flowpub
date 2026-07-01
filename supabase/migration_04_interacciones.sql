-- FlowPub — interacciones reales (idempotente).
-- Para proyectos que YA corrieron schema.sql. Correr en el SQL Editor.

-- ── 1) saves: el «guardar» del lector (privado) ──────────────────────────────
create table if not exists public.saves (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  flow_id    uuid not null references public.flows(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, flow_id)
);
alter table public.saves enable row level security;
drop policy if exists saves_own on public.saves;
create policy saves_own on public.saves for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── 2) duración de los comentarios de voz ────────────────────────────────────
alter table public.comments add column if not exists duration_s int not null default 0;
