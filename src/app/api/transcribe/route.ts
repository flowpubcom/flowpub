import { NextResponse } from "next/server";
import { geminiTranscribeAudio } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

// Audio (multipart form-data, campo "audio") → transcript crudo (Gemini STT).
// Inline base64: ok hasta ~20MB; audios más grandes necesitarían la Files API.
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  let file: FormDataEntryValue | null;
  try {
    const form = await req.formData();
    file = form.get("audio");
  } catch {
    return NextResponse.json({ error: "form-invalido" }, { status: 400 });
  }
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "audio-requerido" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "audio-muy-grande" }, { status: 413 });
  }

  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const mimeType = file.type || "audio/webm";
    const transcript = await geminiTranscribeAudio(base64, mimeType);
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("[transcribe]", err);
    return NextResponse.json({ error: "transcribe-failed" }, { status: 502 });
  }
}
