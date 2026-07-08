import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";

// Registro de eventos de analítica propia (privacy-first). Best-effort: nunca
// rompe por analítica, siempre responde 204. El país se deriva EN EL SERVIDOR
// (header de Vercel); no se guarda IP. La escritura entra por el RPC security-
// definer track_event, así que no hay INSERT directo a la tabla.

const EVENTS = new Set(["view", "record_start", "publish", "signup"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anon";
    // Tope generoso: navegar mucho es legítimo; esto solo frena spam de bots.
    const rl = rateLimit(`track:${ip}`, [
      { limit: 40, windowMs: 60_000 },
      { limit: 600, windowMs: 60 * 60_000 },
    ]);
    if (!rl.ok) return new NextResponse(null, { status: 204 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new NextResponse(null, { status: 204 });
    }

    const event = EVENTS.has(body.event) ? body.event : "view";
    const path = typeof body.path === "string" ? body.path.slice(0, 512) : "";
    const ref = typeof body.ref === "string" ? body.ref.slice(0, 255) : "";
    const device =
      body.device === "mobile" || body.device === "desktop" ? body.device : null;
    const lang = body.lang === "es" || body.lang === "en" ? body.lang : null;
    const session =
      typeof body.session === "string" ? body.session.slice(0, 64) : "";
    const flowId =
      typeof body.flowId === "string" && UUID.test(body.flowId)
        ? body.flowId
        : null;
    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      null;

    const supabase = await createClient();
    await supabase.rpc("track_event", {
      p_event: event,
      p_path: path,
      p_ref: ref,
      p_device: device,
      p_lang: lang,
      p_country: country,
      p_session: session,
      p_flow_id: flowId,
    });
  } catch {
    // best-effort: la analítica jamás debe romper la navegación
  }
  return new NextResponse(null, { status: 204 });
}
