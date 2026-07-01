-- FlowPub — 3 minutos + hardening de seguridad (idempotente).
-- Para proyectos que YA corrieron schema.sql: aplica los cambios de esta ronda.
-- (schema.sql ya trae todo esto para instalaciones nuevas.)

-- ── 1) Tope de duración: 9:00 → 3:00 ────────────────────────────────────────
update public.settings
set value = jsonb_set(value, '{maxDurationSec}', '180')
where key = 'limits';

-- Reacomoda las duraciones de los Flows demo bajo el nuevo tope, repartidas
-- entre los cortes del filtro (≤15 · ≤30 · ≤1:00 · ≤1:30 · ≤2:00 · ≤3:00).
update public.flows f
set duration_s = v.d
from (values
  ('20000000-0000-0000-0000-000000000001', 172),
  ('20000000-0000-0000-0000-000000000002',  88),
  ('20000000-0000-0000-0000-000000000003', 118),
  ('20000000-0000-0000-0000-000000000004',  55),
  ('20000000-0000-0000-0000-000000000005', 148),
  ('20000000-0000-0000-0000-000000000006',  15)
) as v(id, d)
where f.id = v.id::uuid;

-- ── 2) Escalada de privilegios: nadie edita su propio role/contadores ───────
-- (defensa por privilegios de columna, además de RLS; los contadores los
-- mueven los triggers y el role solo el servidor con service_role)
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, bio, avatar_url, location, lang, theme, onboarded)
  on public.profiles to authenticated;

revoke update on public.flows from anon, authenticated;
grant update (title, body_md, transcript_raw, audio_url, duration_s,
              cover_kind, cover_svg, cover_url, lang, status)
  on public.flows to authenticated;

revoke update on public.comments from anon, authenticated;
grant update (body_text) on public.comments to authenticated;

-- ── 3) Mensajería: nadie se auto-agrega a conversaciones ajenas ─────────────
-- La única alta "propia" permitida es la del creador sobre una conversación
-- vacía (bootstrap); después, solo invita quien ya es integrante.
drop policy if exists members_insert on public.conversation_members;
create policy members_insert on public.conversation_members for insert
  with check (
    public.is_member(conversation_id)
    or (
      user_id = auth.uid()
      and not exists (
        select 1 from public.conversation_members m
        where m.conversation_id = conversation_members.conversation_id
      )
    )
  );
