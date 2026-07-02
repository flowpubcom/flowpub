-- FlowPub — fan-out de notificaciones (idempotente). Correr en el SQL Editor.
-- Alta por triggers (security definer, pasan por encima de RLS a propósito:
-- el remitente nunca podría insertar en la bandeja de otro usuario a mano).
-- Nunca te notificas a ti mismo.

-- ── likes → dueño del Flow o del comentario ──────────────────────────────────
create or replace function public.notify_on_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
  fid   uuid;
begin
  if new.flow_id is not null then
    select author_id into owner from public.flows where id = new.flow_id;
    fid := new.flow_id;
  else
    select author_id, flow_id into owner, fid from public.comments where id = new.comment_id;
  end if;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, flow_id, comment_id)
    values (owner, new.user_id, 'like', fid, new.comment_id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_like on public.likes;
create trigger trg_notify_like after insert on public.likes
  for each row execute function public.notify_on_like();

-- ── follows → la persona seguida ─────────────────────────────────────────────
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.followee_id, new.follower_id, 'follow');
  return new;
end; $$;
drop trigger if exists trg_notify_follow on public.follows;
create trigger trg_notify_follow after insert on public.follows
  for each row execute function public.notify_on_follow();

-- ── comments → dueño del Flow (comment/voice) + dueño del comentario padre
--    (reply) + menciones @usuario en el texto ────────────────────────────────
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  flow_owner   uuid;
  parent_owner uuid;
  notif_type   text;
  mentioned    text;
  mentioned_id uuid;
  notified     uuid[] := array[new.author_id];
begin
  select author_id into flow_owner from public.flows where id = new.flow_id;
  notif_type := case when new.kind = 'voice' then 'voice' else 'comment' end;
  if flow_owner is not null and flow_owner <> new.author_id then
    insert into public.notifications (user_id, actor_id, type, flow_id, comment_id)
    values (flow_owner, new.author_id, notif_type, new.flow_id, new.id);
    notified := notified || flow_owner;
  end if;

  if new.parent_id is not null then
    select author_id into parent_owner from public.comments where id = new.parent_id;
    if parent_owner is not null and not (parent_owner = any(notified)) then
      insert into public.notifications (user_id, actor_id, type, flow_id, comment_id)
      values (parent_owner, new.author_id, notif_type, new.flow_id, new.id);
      notified := notified || parent_owner;
    end if;
  end if;

  if new.body_text is not null then
    for mentioned in select distinct m[1] from regexp_matches(new.body_text, '@([a-z0-9_]{3,})', 'gi') as m loop
      select id into mentioned_id from public.profiles where lower(username) = lower(mentioned);
      if mentioned_id is not null and not (mentioned_id = any(notified)) then
        insert into public.notifications (user_id, actor_id, type, flow_id, comment_id)
        values (mentioned_id, new.author_id, 'mention', new.flow_id, new.id);
        notified := notified || mentioned_id;
      end if;
    end loop;
  end if;

  return new;
end; $$;
drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment after insert on public.comments
  for each row execute function public.notify_on_comment();

-- ── flow publicado → seguidores del autor ────────────────────────────────────
create or replace function public.notify_on_flow_published()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.notifications (user_id, actor_id, type, flow_id)
    select follower_id, new.author_id, 'flow', new.id
    from public.follows where followee_id = new.author_id;
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_flow on public.flows;
create trigger trg_notify_flow after insert or update on public.flows
  for each row execute function public.notify_on_flow_published();

-- ── privilegios de columna: el destinatario solo puede tocar `read` ─────────
revoke update on public.notifications from authenticated;
grant update (read) on public.notifications to authenticated;
