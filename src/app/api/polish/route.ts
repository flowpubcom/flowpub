import { NextResponse } from "next/server";
import { geminiGenerate } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
// Lista CURADA para la sugerencia automática de Gemini. A propósito NO usa los
// temas creados por usuarios (tabla tags): Gemini sugiere solo de este set
// estable/on-brand; los temas de usuario se eligen a mano en el TagPicker.
import { CATEGORIES } from "@/data/mock";
import { rateLimit, RATE_RULES } from "@/lib/rateLimit";

export const runtime = "nodejs";

/** Solo usuarios con sesión: Gemini cuesta; anónimos no lo queman. */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Pulido del transcript crudo → artículo markdown + título + temas (Gemini).
// Server-only: la llave nunca toca el cliente.

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    bodyMd: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["title", "bodyMd", "tags"],
} as const;

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "auth-requerida" }, { status: 401 });
  }

  // Protege la cuota de Gemini: nadie pule en loop.
  const rate = rateLimit(`polish:${user.id}`, RATE_RULES.polish);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate-limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  let transcript: unknown;
  try {
    ({ transcript } = await req.json());
  } catch {
    return NextResponse.json({ error: "json-invalido" }, { status: 400 });
  }
  if (typeof transcript !== "string" || transcript.trim().length < 4) {
    return NextResponse.json({ error: "transcript-requerido" }, { status: 400 });
  }

  const system = [
    "Eres el editor de FlowPub, una red social voice-first.",
    "Recibes el transcript CRUDO de una grabación de voz y lo pules en un artículo.",
    "Reglas:",
    "- Conserva la VOZ y el punto de vista de quien habla (primera persona, su tono).",
    "- Quita muletillas, repeticiones y titubeos; ordena las ideas con claridad.",
    "- Responde en el MISMO idioma del transcript.",
    "- bodyMd va SOLO en Markdown (usa ## para subtítulos y párrafos; sin un H1).",
    "- title: breve y evocador (máx ~8 palabras), sin comillas.",
    `- tags: de 1 a 3, EXACTAMENTE de esta lista: ${CATEGORIES.join(", ")}.`,
  ].join("\n");

  try {
    const raw = await geminiGenerate(`Transcript crudo:\n\n${transcript}`, {
      system,
      responseSchema: SCHEMA,
      temperature: 0.6,
    });
    const parsed = JSON.parse(raw) as {
      title?: string;
      bodyMd?: string;
      tags?: string[];
    };
    const tags = (parsed.tags ?? [])
      .filter((t) => CATEGORIES.includes(t))
      .slice(0, 3);
    return NextResponse.json({
      title: (parsed.title ?? "").trim(),
      bodyMd: (parsed.bodyMd ?? "").trim(),
      tags,
    });
  } catch (err) {
    console.error("[polish]", err);
    return NextResponse.json({ error: "polish-failed" }, { status: 502 });
  }
}
