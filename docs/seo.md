# SEO de FlowPub — plan y estado

> Objetivo: que las voces del Pub se encuentren buscando sus **temas** (las 12
> categorías) y que cada Flow rankee por su contenido. La estrategia se apoya en
> lo que nos hace únicos: **cada pieza existe en audio Y en texto** (artículo
> pulido + transcript), o sea, contenido indexable de verdad, no solo un player.

## Estrategia (por qué así)

1. **Hubs por tema** — `/tema/[slug]` (arte, ciencia, libros, …). Una página
   indexable por categoría concentra la autoridad temática: title/description
   propios, H1, copy único y la lista de Flows del tema. Los queries objetivo
   son de cola media («podcast corto de historia en español», «artículos de
   ciencia en audio»…): los hubs son la puerta de entrada.
2. **El Flow como artículo** — `/flow/[id]` es un `Article` de schema.org **con
   `AudioObject`** (nuestro diferenciador). Google entiende: hay texto legible
   + un audio de ≤3 min. Title = título del Flow; description = excerpt.
3. **Enlazado interno** — el kicker del Flow y el riel «Hoy en el Pub» enlazan
   a su hub de tema; los hubs enlazan a los Flows. Triángulo home ↔ hub ↔ flow.
4. **Infraestructura** — `sitemap.xml` dinámico (home + hubs + Flows publicados,
   revalida 1 h), `robots.txt` (bloquea `/api` `/auth` `/componer` `/entrar`
   `/styleguide`), `metadataBase` + canonical en todo, OpenGraph site-wide.

## Implementado (esta ronda)

- [x] `app/sitemap.ts` — dinámico vía REST (sin cookies → cacheable).
- [x] `app/robots.ts`.
- [x] `metadataBase` desde `NEXT_PUBLIC_SITE_URL` + title template + OG/locale
  `es_MX` + robots index en `layout.tsx`.
- [x] Home con title/description/canonical propios.
- [x] `/tema/[slug]`: hub por categoría con metadata, H1, copy único, JSON-LD
  `CollectionPage` y lista de Flows (filtro `!inner` por slug).
- [x] `/flow/[id]`: description (excerpt), canonical, OG `article`
  (publishedTime + author) y JSON-LD `Article` + `AudioObject`.
- [x] Links internos: kicker del Flow → hub; trending del riel → hub.

## Siguiente (en orden de impacto)

1. **Cachear las páginas públicas.** Hoy `/` y `/flow/[id]` son dinámicas
   porque el cliente Supabase usa `cookies()`. Para lecturas públicas conviene
   un cliente sin cookies + `revalidate` (60 s home, 300 s flows) → TTFB
   estable para crawlers. (El sitemap ya lo hace así.)
2. **`og:image` por Flow.** Ruta `opengraph-image` que rasterice la portada
   SVG (mismo seed) — CTR en compartidos y en resultados con miniaturas.
3. **Slugs legibles.** `/flow/nueve-minutos-sobre-el-barro-<id-corto>` rankea
   mejor que un UUID. Requiere columna `slug` + redirect del formato viejo.
4. **hreflang / rutas EN** cuando el chrome EN tenga audiencia; el contenido
   se queda en su idioma (es la política del producto) con `inLanguage`.
5. **Perfil como entidad** (`/@usuario` + JSON-LD `Person`/`ProfilePage`)
   cuando exista la pantalla de perfil (fase 6).
6. **Métricas**: alta en Search Console al desplegar `flowpub.lat` y revisar
   qué hubs jalan queries; el copy de cada hub se afina con eso.

## Reglas para contenido nuevo

- Cada categoría nueva en el panel → automáticamente hub + sitemap (ya sale de
  la tabla `tags`; no hay que tocar código).
- El título que sugiere Gemini en el pulido ES el `<title>`: pedirle que sea
  descriptivo (ya lo hace: breve y evocador, sin comillas).
- No indexar contenido a medias: borradores (`status='draft'`) nunca entran a
  sitemap ni a hubs (el filtro `published/featured` ya lo garantiza).
