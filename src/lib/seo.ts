// Utilidades SEO compartidas. La URL del sitio vivía duplicada en seis archivos
// (layout/sitemap/robots/flow/tema/perfil); aquí queda en un solo lugar, junto
// con el texto-plano-desde-markdown para datos estructurados y los armadores de
// JSON-LD comunes (migas). El escape seguro para <script> lo hace `safeJsonLd`
// al serializar — esto NO sanea, solo da forma a los datos.

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flowpub.app";

// Autodescubrimiento del RSS. OJO: Next fusiona `alternates` de forma
// SUPERFICIAL — el `canonical` de cada página REEMPLAZA el `types` del layout.
// Por eso hay que reesparcir esto en el `alternates` de cada página que fija su
// canonical, o el <link> del feed se cae justo en las páginas que importan.
export const RSS_ALT = { "application/rss+xml": "/feed.xml" };

/** Une un path a la URL del sitio (absoluta; para JSON-LD, OG y sitemap). */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Markdown → texto plano legible (para `articleBody` y descripciones). Conserva
 * el texto de los enlaces, tira las marcas y colapsa los espacios. NO es un
 * sanitizador de seguridad: el escape del cierre de `<script>` lo hace
 * `safeJsonLd` al serializar el JSON-LD.
 */
export function mdToPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ") // bloques de código
    .replace(/`([^`]+)`/g, "$1") // código en línea
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // imágenes
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // enlaces → su texto
    .replace(/^#{1,6}\s+/gm, "") // encabezados
    .replace(/^>\s?/gm, "") // citas
    .replace(/[*_~]/g, "") // énfasis
    .replace(/\s+/g, " ")
    .trim();
}

/** Cuenta palabras de un texto plano (para `wordCount`). */
export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** BreadcrumbList JSON-LD desde una lista de {name, path}. Migas en el SERP. */
export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
