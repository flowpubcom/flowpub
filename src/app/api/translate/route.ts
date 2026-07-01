import { NextResponse } from "next/server";
import { geminiGenerate } from "@/lib/gemini";

export const runtime = "nodejs";

// Traducción opt-in por Flow (chrome se traduce aparte; el CONTENIDO se traduce
// solo cuando el lector lo pide). Server-only.

export async function POST(req: Request) {
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
