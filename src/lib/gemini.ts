// Cliente server-only de Google Gemini. NUNCA se importa desde un Client Component:
// la llave (GEMINI_API_KEY) vive solo en el servidor (route handlers / Edge).
//
// gemini-2.0-flash viene con cuota 0 en el free tier de esta llave; usamos
// gemini-2.5-flash (configurable con GEMINI_MODEL).

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GenerateOptions {
  system?: string;
  /** JSON Schema para forzar salida estructurada (responseSchema). */
  responseSchema?: Record<string, unknown>;
  temperature?: number;
  model?: string;
}

export async function geminiGenerate(
  prompt: string,
  opts: GenerateOptions = {},
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no configurada");
  const model = opts.model || DEFAULT_MODEL;

  const generationConfig: Record<string, unknown> = {
    temperature: opts.temperature ?? 0.7,
    // Sin "thinking": queremos salida directa (más rápido y barato).
    thinkingConfig: { thinkingBudget: 0 },
  };
  if (opts.responseSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = opts.responseSchema;
  }

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };

  const res = await fetch(`${BASE}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const parts: Array<{ text?: string }> =
    data?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}

/** STT: audio (base64 inline) → transcript crudo, en su idioma original. */
export async function geminiTranscribeAudio(
  base64: string,
  mimeType: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no configurada");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Transcribe este audio literalmente, palabra por palabra, en su idioma original. Devuelve SOLO el texto hablado, sin comentarios, etiquetas ni marcas de tiempo.",
          },
          { inlineData: { mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0, thinkingConfig: { thinkingBudget: 0 } },
  };

  const res = await fetch(`${BASE}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini STT ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const parts: Array<{ text?: string }> =
    data?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}
