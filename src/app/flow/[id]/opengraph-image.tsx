import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Tarjeta social POR Flow (WhatsApp/redes/miniatura del SERP). Adelanta el
// título en Fraunces sobre la tarjeta de papel de la marca — el título vende
// mejor el clic que una portada abstracta. Lee sin cookies (anon key, REST),
// así queda cacheable e independiente de la sesión. Los hex son la paleta
// bloqueada: aquí no existen los tokens CSS (esto rasteriza a PNG con satori).

export const alt = "FlowPub";
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
}

async function fetchOgFlow(id: string): Promise<OgFlow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const sel =
      "title,author:profiles!author_id(display_name,username),flow_tags(tags(name_es,sort))";
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
    };
  } catch {
    return null;
  }
}

/** Corta un título largo por límite de caracteres, en frontera de palabra. */
function clampTitle(t: string, max = 96): string {
  const s = t.trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 40 ? cut.slice(0, sp) : cut).trim()}…`;
}

export default async function FlowOgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flow = await fetchOgFlow(id);

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

          {/* título del Flow */}
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontSize: title.length > 60 ? 62 : 78,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: TINTA,
              maxWidth: 980,
            }}
          >
            {title}
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
