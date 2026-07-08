import { NextResponse } from "next/server";
import { geminiGenerate } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, RATE_RULES } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Traducción opt-in por Flow (chrome se traduce aparte; el CONTENIDO se traduce
// solo cuando el lector lo pide). Server-only. Por ahora exige sesión (cuando
// entre Turnstile podremos abrirla a invitados sin regalar cuota de Gemini).

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth-requerida" }, { status: 401 });
  }

  // Protege la cuota de Gemini: traducir es opt-in, no un grifo abierto.
  const rate = rateLimit(`translate:${user.id}`, RATE_RULES.translate);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate-limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  let text: unknown;
  let target: unknown;
  try {
    ({ text, target } = await req.json());
  } catch {
    return NextResponse.json({ error: "json-invalido" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text-requerido" }, { status: 400 });
  }

  const lang = target === "en" ? "inglés" : "español";
  const system = [
    `Traduce el texto del usuario al ${lang}.`,
    "Conserva el formato Markdown y el tono/voz del original.",
    "Devuelve SOLO la traducción, sin notas, prefijos ni comillas.",
  ].join(" ");

  try {
    const out = await geminiGenerate(text, { system, temperature: 0.3 });
    return NextResponse.json({ text: out });
  } catch (err) {
    console.error("[translate]", err);
    return NextResponse.json({ error: "translate-failed" }, { status: 502 });
  }
}
