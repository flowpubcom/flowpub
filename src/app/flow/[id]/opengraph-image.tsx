import { cache } from "react";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Tarjeta social POR Flow (WhatsApp/redes/miniatura del SERP). Adelanta el
// título en Fraunces sobre la tarjeta de papel de la marca — el título vende
// mejor el clic que una portada abstracta. Lee sin cookies (anon key, REST),
// así queda cacheable e independiente de la sesión. Los hex son la paleta
// bloqueada: aquí no existen los tokens CSS (esto rasteriza a PNG con satori).

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const VIRGULA =
  "M 96 176 C 140 172 176 140 176 100 C 176 56 140 24 100 24 C 60 24 26 56 26 100 C 26 138 56 166 96 156 C 130 148 150 124 150 100 C 150 76 130 60 108 64 C 92 67 86 80 92 92";

const TINTA = "#1A1714";
const GRANA = "#C0303A";
const GRANA_700 = "#9A2530";
const GRANA_WASH = "#F6E6E4";
const AMATE = "#F2EFE8";
const PAPEL = "#FBFAF6";
const TEXTO_SEC = "#6E685D";
const LINEA = "rgba(26,23,20,0.12)";

interface OgFlow {
  title: string;
  author: string;
  tag: string;
  lang: "es" | "en";
}

// La leyenda del botón es chrome, así que sí se traduce (el contenido del
// Flow no). Cualquier cosa que no sea 'en' se va a español, como el default
// de la columna.
const PLAY_LABEL: Record<"es" | "en", string> = {
  es: "¡Dale play a este Flow!",
  en: "Play this Flow",
};

async function fetchOgFlow(id: string): Promise<OgFlow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const sel =
      "title,lang,author:profiles!author_id(display_name,username),flow_tags(tags(name_es,sort))";
    // encodeURIComponent en el id: sin él, un id hostil (p. ej. «x&or=(…)»)
    // inyectaría filtros de PostgREST y podría saltarse el filtro de status.
    const res = await fetch(
      `${url}/rest/v1/flows?select=${encodeURIComponent(sel)}&id=eq.${encodeURIComponent(id)}&status=in.(published,featured)&limit=1`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as any[];
    const r = rows?.[0];
    if (!r) return null;
    const tags = (r.flow_tags ?? [])
      .map((ft: any) => ft.tags)
      .filter(Boolean)
      .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
    return {
      title: (r.title as string) || "Flow",
      author: (r.author?.display_name || r.author?.username || "") as string,
      tag: (tags[0]?.name_es as string) || "",
      lang: r.lang === "en" ? "en" : "es",
    };
  } catch {
    return null;
  }
}

/** Corta un título largo por límite de caracteres, en frontera de palabra. */
function clampTitle(t: string, max = 88): string {
  const s = t.trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 40 ? cut.slice(0, sp) : cut).trim()}…`;
}

// cache(): generateImageMetadata y el componente comparten la consulta.
const getOgFlow = cache(fetchOgFlow);

// alt dinámico con el título real del Flow (el `alt` exportado no ve params).
export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const flow = await getOgFlow((await params).id);
  const alt = flow?.title ? `${clampTitle(flow.title, 70)} — FlowPub` : "FlowPub";
  return [{ id: "og", alt, size, contentType }];
}

export default async function FlowOgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flow = await getOgFlow(id);

  const dir = join(process.cwd(), "src", "app", "_og");
  const [frauncesItalic, fraunces, hanken] = await Promise.all([
    readFile(join(dir, "Fraunces-Italic-500.ttf")),
    readFile(join(dir, "Fraunces-500.ttf")),
    readFile(join(dir, "HankenGrotesk-600.ttf")),
  ]);

  const title = clampTitle(flow?.title ?? "FlowPub");
  // El autor también va clampado: sin esto, un display_name patológico (editable
  // por REST) infla el layout de satori igual que un título largo.
  const author = (flow?.author ?? "").slice(0, 60);
  const playLabel = PLAY_LABEL[flow?.lang === "en" ? "en" : "es"];
  // Tres escalones de título: entre más largo, más chico, para que el botón de
  // play siempre quepa completo debajo. El bloque del título además va con
  // maxHeight + overflow oculto — es el seguro por si una tipografía ancha
  // gana una línea de más; el botón nunca se sale de la tarjeta.
  const titleSize = title.length > 52 ? 58 : title.length > 34 ? 68 : 78;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 60,
          backgroundColor: AMATE,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: 56,
            borderRadius: 32,
            backgroundColor: PAPEL,
            border: `1px solid ${LINEA}`,
            boxShadow: "0 30px 70px -28px rgba(26,23,20,0.42)",
          }}
        >
          {/* cabecera: marca + tema */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <svg width={52} height={52} viewBox="0 0 200 200" fill="none">
                <path
                  d={VIRGULA}
                  stroke={TINTA}
                  strokeWidth={16}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  fontSize: 40,
                  color: TINTA,
                }}
              >
                <span style={{ fontFamily: "Fraunces Italic" }}>Flow</span>
                <span style={{ fontFamily: "Fraunces" }}>Pub</span>
              </div>
            </div>
            {flow?.tag ? (
              <div
                style={{
                  display: "flex",
                  padding: "8px 22px",
                  borderRadius: 999,
                  backgroundColor: GRANA_WASH,
                  color: GRANA_700,
                  fontFamily: "Hanken Grotesk",
                  fontSize: 22,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {flow.tag}
              </div>
            ) : null}
          </div>

          {/* título del Flow + la invitación a escucharlo */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              flexGrow: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Fraunces",
                fontSize: titleSize,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                color: TINTA,
                maxWidth: 980,
                maxHeight: 200,
                overflow: "hidden",
              }}
            >
              {title}
            </div>

            {/* botón de play: es gráfico, no interactivo — pero es el CTA de la
                tarjeta, y por eso sí lleva grana. */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                marginTop: 26,
                padding: "12px 32px 12px 12px",
                borderRadius: 999,
                backgroundColor: GRANA,
                border: `1px solid ${GRANA_700}`,
                boxShadow: "0 16px 32px -16px rgba(192,48,58,0.7)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  backgroundColor: PAPEL,
                }}
              >
                {/* triángulo dibujado a mano: nada de emoji ni fuente de íconos.
                    El stroke del mismo color le redondea las puntas. */}
                <svg width={20} height={22} viewBox="0 0 20 22" fill="none">
                  <path
                    d="M4 3 L16.5 11 L4 19 Z"
                    fill={GRANA}
                    stroke={GRANA}
                    strokeWidth={3}
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                style={{
                  marginLeft: 18,
                  fontFamily: "Hanken Grotesk",
                  fontSize: 26,
                  letterSpacing: "0.01em",
                  color: PAPEL,
                }}
              >
                {playLabel}
              </span>
            </div>
          </div>

          {/* pie: autor + marca de tres tiempos */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Hanken Grotesk",
                fontSize: 28,
                color: TEXTO_SEC,
              }}
            >
              {author ? `por ${author}` : "flowpub.app"}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontFamily: "Hanken Grotesk",
                fontSize: 22,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: TEXTO_SEC,
              }}
            >
              <span>Speak</span>
              <div style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: GRANA }} />
              <span>Flow</span>
              <div style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: GRANA }} />
              <span>Publish</span>
            </div>
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
