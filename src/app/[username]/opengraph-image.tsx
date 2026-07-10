import { cache } from "react";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Tarjeta social POR perfil (/@usuario en WhatsApp/redes). Calca la tarjeta del
// Flow (papel sobre amate, marca de tres tiempos), pero pone al frente al autor:
// avatar + nombre + @usuario + bio. Lee sin cookies (anon key, REST) → cacheable
// e independiente de la sesión. Los hex son la paleta bloqueada: aquí no existen
// los tokens CSS (esto rasteriza a PNG con satori).

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const VIRGULA =
  "M 96 176 C 140 172 176 140 176 100 C 176 56 140 24 100 24 C 60 24 26 56 26 100 C 26 138 56 166 96 156 C 130 148 150 124 150 100 C 150 76 130 60 108 64 C 92 67 86 80 92 92";

const TINTA = "#1A1714";
const GRANA = "#C0303A";
const OCRE = "#D98A3D";
const AMATE = "#F2EFE8";
const PAPEL = "#FBFAF6";
const TEXTO_SEC = "#6E685D";
const LINEA = "rgba(26,23,20,0.12)";

// Disco de inicial (mismo criterio que <Avatar>): color determinista por hash
// del nombre, acentos que no voltean entre temas.
const ACCENTS = [
  { bg: TINTA, fg: AMATE }, // ink
  { bg: GRANA, fg: AMATE }, // grana
  { bg: OCRE, fg: AMATE }, // ocre
] as const;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pickAccent(name: string) {
  return ACCENTS[hash(name) % ACCENTS.length];
}

interface OgProfile {
  displayName: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  flowCount: number | null;
}

async function fetchOgProfile(username: string): Promise<OgProfile | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  try {
    // encodeURIComponent en el username: sin él, un valor hostil inyectaría
    // filtros de PostgREST.
    const res = await fetch(
      `${url}/rest/v1/profiles?select=${encodeURIComponent("id,username,display_name,avatar_url,bio")}&username=eq.${encodeURIComponent(username)}&limit=1`,
      { headers, next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as any[];
    const r = rows?.[0];
    if (!r) return null;

    // Conteo de Flows públicos del autor (nice-to-have para el pill). Si falla,
    // la tarjeta se dibuja igual sin el conteo.
    let flowCount: number | null = null;
    try {
      const cnt = await fetch(
        `${url}/rest/v1/flows?select=id&author_id=eq.${encodeURIComponent(r.id)}&status=in.(published,featured)`,
        { headers: { ...headers, Prefer: "count=exact" }, method: "HEAD", next: { revalidate: 3600 } },
      );
      const range = cnt.headers.get("content-range"); // «0-24/25» ó «*/25»
      const total = range ? Number(range.split("/")[1]) : NaN;
      if (Number.isFinite(total)) flowCount = total;
    } catch {
      /* sin conteo, no pasa nada */
    }

    return {
      displayName: (r.display_name || r.username || "") as string,
      username: (r.username as string) || "",
      bio: (r.bio as string | null) ?? null,
      avatarUrl: (r.avatar_url as string | null) ?? null,
      flowCount,
    };
  } catch {
    return null;
  }
}

// cache(): generateImageMetadata y el componente corren en el mismo request;
// así comparten una sola consulta en vez de pegarle dos veces a la REST.
const getOgProfile = cache(fetchOgProfile);

function normalizeUsername(raw: string): string {
  const r = decodeURIComponent(raw);
  return (r.startsWith("@") ? r.slice(1) : r).toLowerCase();
}

// alt dinámico: el `alt` exportado es estático (no ve params), así que el texto
// alternativo de la tarjeta se arma aquí con el nombre real del perfil.
export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const profile = await getOgProfile(normalizeUsername((await params).username));
  const who = profile?.displayName
    ? `${profile.displayName} (@${profile.username})`
    : "FlowPub";
  return [{ id: "og", alt: `Perfil de ${who} en FlowPub`, size, contentType }];
}

/** Descarga el avatar y lo vuelve data-URI. Cualquier fallo → null (cae a la
 *  inicial), para que la imagen OG nunca truene por un avatar caído. */
async function avatarDataUri(src: string | null): Promise<string | null> {
  if (!src) return null;
  try {
    const res = await fetch(src, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 3_000_000) return null; // avatar patológico → inicial
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function clamp(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max * 0.5 ? cut.slice(0, sp) : cut).trim()}…`;
}

export default async function ProfileOgImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const profile = await getOgProfile(normalizeUsername((await params).username));

  const dir = join(process.cwd(), "src", "app", "_og");
  const [frauncesItalic, fraunces, hanken] = await Promise.all([
    readFile(join(dir, "Fraunces-Italic-500.ttf")),
    readFile(join(dir, "Fraunces-500.ttf")),
    readFile(join(dir, "HankenGrotesk-600.ttf")),
  ]);

  const displayName = clamp(profile?.displayName || "FlowPub", 42);
  const handle = profile?.username ? `@${profile.username}` : "flowpub.app";
  const bio = profile?.bio ? clamp(profile.bio, 150) : "";
  const accent = pickAccent(profile?.displayName || "FlowPub");
  const initial = (profile?.displayName?.trim()?.[0] ?? "·").toUpperCase();
  const avatar = await avatarDataUri(profile?.avatarUrl ?? null);
  const flowsLabel =
    profile?.flowCount != null
      ? `${profile.flowCount} ${profile.flowCount === 1 ? "Flow" : "Flows"}`
      : "";

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
          {/* cabecera: marca + pill de Flows */}
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
            {flowsLabel ? (
              <div
                style={{
                  display: "flex",
                  padding: "8px 22px",
                  borderRadius: 999,
                  backgroundColor: AMATE,
                  color: TEXTO_SEC,
                  fontFamily: "Hanken Grotesk",
                  fontSize: 22,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {flowsLabel}
              </div>
            ) : null}
          </div>

          {/* cuerpo: avatar + nombre + @usuario + bio */}
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            {avatar ? (
              // satori exige <img> dentro de ImageResponse (next/image no aplica).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                width={200}
                height={200}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 999,
                  objectFit: "cover",
                  border: `1px solid ${LINEA}`,
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 200,
                  height: 200,
                  borderRadius: 999,
                  backgroundColor: accent.bg,
                  color: accent.fg,
                  fontFamily: "Fraunces Italic",
                  fontSize: 104,
                  lineHeight: 1,
                }}
              >
                {initial}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, maxWidth: 760 }}>
              <div
                style={{
                  display: "flex",
                  fontFamily: "Fraunces",
                  fontSize: displayName.length > 24 ? 60 : 74,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  color: TINTA,
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 10,
                  fontFamily: "Hanken Grotesk",
                  fontSize: 30,
                  color: GRANA,
                }}
              >
                {handle}
              </div>
              {bio ? (
                <div
                  style={{
                    display: "flex",
                    marginTop: 20,
                    fontFamily: "Hanken Grotesk",
                    fontSize: 27,
                    lineHeight: 1.4,
                    color: TEXTO_SEC,
                  }}
                >
                  {bio}
                </div>
              ) : null}
            </div>
          </div>

          {/* pie: dominio + marca de tres tiempos */}
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
                fontSize: 26,
                color: TEXTO_SEC,
              }}
            >
              flowpub.app
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
