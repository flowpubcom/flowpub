import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Tarjeta social del sitio (WhatsApp/redes). Los hex son la paleta bloqueada
// de la marca — aquí no existen los tokens CSS (esto renderiza a PNG con
// satori), igual que en las portadas.

export const alt = "FlowPub | Speak, Flow, Publish";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// La vírgula (misma que <FlowMark>): un solo path, monolínea, caps redondos.
const VIRGULA =
  "M 96 176 C 140 172 176 140 176 100 C 176 56 140 24 100 24 C 60 24 26 56 26 100 C 26 138 56 166 96 156 C 130 148 150 124 150 100 C 150 76 130 60 108 64 C 92 67 86 80 92 92";

const TINTA = "#1A1714";
const GRANA = "#C0303A";
const AMATE = "#F2EFE8";
const PAPEL = "#FBFAF6";
const TEXTO_SEC = "#6E685D";
const LINEA = "rgba(26,23,20,0.12)";

export default async function OgImage() {
  const dir = join(process.cwd(), "src", "app", "_og");
  const [frauncesItalic, fraunces, hanken] = await Promise.all([
    readFile(join(dir, "Fraunces-Italic-500.ttf")),
    readFile(join(dir, "Fraunces-500.ttf")),
    readFile(join(dir, "HankenGrotesk-600.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: AMATE,
        }}
      >
        {/* tarjeta papel al centro, como las cards del Pub */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 1080,
            height: 510,
            borderRadius: 32,
            backgroundColor: PAPEL,
            border: `1px solid ${LINEA}`,
            boxShadow: "0 30px 70px -28px rgba(26,23,20,0.42)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
            <svg
              width={190}
              height={190}
              viewBox="0 0 200 200"
              fill="none"
            >
              <path
                d={VIRGULA}
                stroke={TINTA}
                strokeWidth={14}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                fontSize: 150,
                letterSpacing: "-0.01em",
                color: TINTA,
              }}
            >
              <span style={{ fontFamily: "Fraunces Italic" }}>Flow</span>
              <span style={{ fontFamily: "Fraunces" }}>Pub</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginTop: 34,
              fontFamily: "Hanken Grotesk",
              fontSize: 34,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: TEXTO_SEC,
            }}
          >
            <span>Speak</span>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                backgroundColor: GRANA,
              }}
            />
            <span>Flow</span>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                backgroundColor: GRANA,
              }}
            />
            <span>Publish</span>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 44,
              padding: "10px 30px",
              borderRadius: 999,
              backgroundColor: TINTA,
              color: AMATE,
              fontFamily: "Hanken Grotesk",
              fontSize: 26,
              letterSpacing: "0.04em",
            }}
          >
            flowpub.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces Italic", data: frauncesItalic, style: "italic", weight: 500 },
        { name: "Fraunces", data: fraunces, style: "normal", weight: 500 },
        { name: "Hanken Grotesk", data: hanken, style: "normal", weight: 600 },
      ],
    },
  );
}
