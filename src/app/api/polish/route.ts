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

// ⚠️ EL ORDEN DE LAS PROPIEDADES IMPORTA. El modelo genera los campos en el
// orden en que se declaran, así que `lang` va PRIMERO: decide el idioma antes
// de redactar y todo lo demás se condiciona a esa decisión.
//
// Con `lang` al final pasaba lo contrario y era un bug feo: como estas
// instrucciones están en español, ante un transcript en INGLÉS el modelo
// escribía el artículo en español y luego lo etiquetaba «es» — coherente
// consigo mismo y traicionando a quien habló. Medido: 0/2 corridas respetaban
// el inglés con el orden viejo (ni reforzando el prompt: 1/3); con `lang`
// primero, 4/4 casos (2 EN + 2 ES) salieron bien.
const SCHEMA = {
  type: "object",
  properties: {
    lang: { type: "string", enum: ["es", "en"] },
    title: { type: "string" },
    bodyMd: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["lang", "title", "bodyMd", "tags"],
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

  // La regla del idioma va ARRIBA y en las dos lenguas a propósito: el prompt
  // en español arrastraba al modelo a responder en español aunque la persona
  // hablara en inglés (ver la nota del SCHEMA). La línea en mayúsculas en
  // inglés es la que rompe ese arrastre.
  const system = [
    "Eres el editor de FlowPub, una red social voice-first.",
    "Recibes el transcript CRUDO de una grabación de voz y lo pules en un artículo.",
    "",
    'PRIMERO detecta el idioma del transcript y ponlo en `lang` ("es" o "en"; si es',
    "otro, el más cercano de esos dos). TODO lo demás que escribas —title y bodyMd—",
    "va en ESE idioma. Estas instrucciones están en español, pero eso NO decide el",
    "idioma de tu respuesta: lo decide la persona que habló.",
    "IF THE TRANSCRIPT IS IN ENGLISH, WRITE THE TITLE AND BODY IN ENGLISH.",
    "",
    "Reglas:",
    "- Conserva la VOZ y el punto de vista de quien habla (primera persona, su tono).",
    "- Quita muletillas, repeticiones y titubeos; ordena las ideas con claridad.",
    "- bodyMd va SOLO en Markdown (usa ## para subtítulos y párrafos; sin un H1).",
    "- title: breve y evocador (máx ~8 palabras), sin comillas.",
    `- tags: de 1 a 3, EXACTAMENTE de esta lista (son etiquetas fijas, van en español aunque el Flow sea en inglés): ${CATEGORIES.join(", ")}.`,
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
      lang?: string;
    };
    const tags = (parsed.tags ?? [])
      .filter((t) => CATEGORIES.includes(t))
      .slice(0, 3);
    // Acotado en el servidor, igual que los tags: lo que no sea es|en cae a es.
    // El modelo puede alucinar un "pt" o un "spanish"; el esquema de la BD y el
    // `lang` del reader solo entienden estos dos.
    const lang = parsed.lang === "en" ? "en" : "es";
    return NextResponse.json({
      title: (parsed.title ?? "").trim(),
      bodyMd: (parsed.bodyMd ?? "").trim(),
      tags,
      lang,
    });
  } catch (err) {
    console.error("[polish]", err);
    return NextResponse.json({ error: "polish-failed" }, { status: 502 });
  }
}
