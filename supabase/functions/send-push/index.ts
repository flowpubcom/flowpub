// Edge Function `send-push` — envía notificaciones Web Push.
// Se dispara por dos Database Webhooks (INSERT en `notifications` y en `messages`).
// Lee suscripciones + preferencias con service_role (Supabase las inyecta solas).
// Secretos requeridos: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
// (mailto:…) y, opcional pero recomendado, WEBHOOK_SECRET (cabecera compartida).
//
// Deploy:  supabase functions deploy send-push
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:hola@flowpub.app WEBHOOK_SECRET=...
//
// deno-lint-ignore-file no-explicit-any

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:hola@flowpub.app";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") || "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function sendToUser(userId: string, payload: Record<string, unknown>) {
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth")
    .eq("user_id", userId);
  const body = JSON.stringify(payload);
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
      );
    } catch (err: any) {
      const code = err?.statusCode;
      if (code === 404 || code === 410) {
        await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
  }
}

async function nameOf(id: string): Promise<{ name: string; username: string }> {
  if (!id) return { name: "Alguien", username: "" };
  const { data } = await admin
    .from("profiles")
    .select("display_name,username")
    .eq("id", id)
    .maybeSingle();
  return {
    name: data?.display_name || data?.username || "Alguien",
    username: data?.username || "",
  };
}

async function prefsOf(id: string): Promise<Record<string, boolean>> {
  const { data } = await admin
    .from("profiles")
    .select("push_prefs")
    .eq("id", id)
    .maybeSingle();
  return (data?.push_prefs ?? {}) as Record<string, boolean>;
}

Deno.serve(async (req) => {
  // Verificación opcional de secreto compartido (defensa contra spam).
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  try {
    const payload = await req.json();
    const table = payload.table as string;
    const rec = payload.record as any;
    if (!rec) return new Response("no record");

    if (table === "notifications") {
      const type = rec.type as string;
      if (!["follow", "comment", "voice"].includes(type)) {
        return new Response("skip");
      }
      const recipient = rec.user_id as string;
      const prefs = await prefsOf(recipient);
      if (type === "follow" && prefs.follows === false) return new Response("off");
      if ((type === "comment" || type === "voice") && prefs.comments === false) {
        return new Response("off");
      }
      const actor = await nameOf(rec.actor_id as string);
      let title: string, body: string, url: string;
      if (type === "follow") {
        title = "Nuevo seguidor";
        body = `${actor.name} te empezó a seguir`;
        url = actor.username ? `/@${actor.username}` : "/notificaciones";
      } else {
        title = "Nuevo comentario";
        body = `${actor.name} comentó tu Flow`;
        url = rec.flow_id ? `/flow/${rec.flow_id}` : "/notificaciones";
      }
      await sendToUser(recipient, { title, body, url, tag: `notif-${rec.id}` });
      return new Response("sent");
    }

    if (table === "messages") {
      const convId = rec.conversation_id as string;
      const senderId = rec.sender_id as string;
      const { data: members } = await admin
        .from("conversation_members")
        .select("user_id")
        .eq("conversation_id", convId);
      const recipient = (members ?? [])
        .map((m: any) => m.user_id as string)
        .find((id: string) => id !== senderId);
      if (!recipient) return new Response("no recipient");
      const prefs = await prefsOf(recipient);
      if (prefs.messages === false) return new Response("off");
      const sender = await nameOf(senderId);
      const preview =
        rec.kind === "voice"
          ? "Te mandó una nota de voz"
          : rec.body_text
            ? String(rec.body_text).slice(0, 80)
            : "Nuevo mensaje";
      await sendToUser(recipient, {
        title: sender.name,
        body: preview,
        url: `/mensajes/${convId}`,
        tag: `msg-${convId}`,
      });
      return new Response("sent");
    }

    return new Response("ignored");
  } catch (e: any) {
    // 200 a propósito: no queremos reintentos en bucle del webhook por un error.
    return new Response("error: " + (e?.message ?? "unknown"), { status: 200 });
  }
});
