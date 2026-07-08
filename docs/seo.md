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

## Implementado (base)

- [x] `app/sitemap.ts` — dinámico vía REST (sin cookies → cacheable).
- [x] `app/robots.ts`.
- [x] `metadataBase` desde `NEXT_PUBLIC_SITE_URL` + title template + OG/locale
  `es_MX` + robots index en `layout.tsx`.
- [x] Home con title/description/canonical propios.
- [x] `/tema/[slug]`: hub por categoría con metadata, H1, copy único, JSON-LD
  `CollectionPage` y lista de Flows (filtro `!inner` por slug).
- [x] `/flow/[id]`: description (excerpt), canonical, OG `article` y JSON-LD.
- [x] Links internos: kicker del Flow → hub; trending del riel → hub.

## Implementado (sesión 8 — SEO a fondo, aprovechando el texto)

> Base compartida en `lib/seo.ts` (`SITE`, `absoluteUrl`, `mdToPlainText`,
> `countWords`, `breadcrumbList`) — antes el `SITE` vivía duplicado en 6 archivos.
> Todo el JSON-LD pasa por `safeJsonLd` (escape anti-XSS). Verificado en vivo
> (HTML del servidor + JSON-LD parseado + PNG de OG 200).

- [x] **Datos estructurados del Flow** (`/flow/[id]`): `Article` con `image`
  (la imagen OG por Flow), `inLanguage` = **`flow.lang`** (antes «es» hardcodeado,
  bug en Flows EN), `articleBody` (el artículo pulido en texto plano), `wordCount`,
  `keywords`/`articleSection` (temas), `isAccessibleForFree`, `interactionStatistic`
  (likes + comentarios como `InteractionCounter`, **no** ratings falsos), autor con
  `@id` estable + `image`, `publisher` con `logo`. `AudioObject` con **`transcript`
  = transcript crudo** (la ventaja voice-first hecha dato indexable), `name`,
  `description`, `uploadDate`, `encodingFormat`, `inLanguage`. + `BreadcrumbList`.
- [x] **Imagen OG por Flow** (`app/flow/[id]/opengraph-image.tsx`): tarjeta de
  marca 1200×630 con el título en Fraunces (satori, fuentes de `_og`). Lee **sin
  cookies** (REST, `id` con `encodeURIComponent` para no inyectar filtros de
  PostgREST), clampa el título antes de satori (anti-DoS), y cae a la tarjeta
  genérica si el id no existe. Alimenta `og:image` + `twitter:image` + `Article.image`.
- [x] **Metadata del Flow**: `robots` = noindex si es borrador (defensa en
  profundidad), `keywords`, `authors[]`, `openGraph` (url/locale/section/tags/
  publishedTime), `twitter` (title/description). `lang={flow.lang}` en el título y
  el cuerpo del `FlowReader` (el chrome sigue en el idioma de la UI).
- [x] **Malla de enlaces internos** (`components/flow/RelatedFlows.tsx`, server):
  «Más de {autor}» y «Más en {tema}» como `<a>` en el HTML del servidor → rastreo,
  autoridad temática y descubrimiento. Reusa los fetchers `cache()`d.
- [x] **Home**: `@graph` con `WebSite` + `SearchAction` (caja de búsqueda de
  sitelinks → `/explorar?q=`) + `Organization` con `logo`.
- [x] **Perfil** (`/@usuario`): `Person` con `image`, `sameAs` (web + redes, todo
  validado por `safeHref`), `@id` compartido con el autor de cada Flow (Google
  fusiona la entidad), `address` (`PostalAddress`). **noindex** si 0 Flows
  publicados (contenido delgado). `openGraph` type profile.
- [x] **Tema**: `CollectionPage` con `ItemList` de los Flows + `BreadcrumbList`.
- [x] **`/explorar?q=`**: `noindex, follow` (resultados casi-duplicados);
  `/explorar` base sigue indexable.
- [x] **`robots.ts`**: bloquea privadas/gateadas (mensajes, notificaciones,
  perfil, admin, restablecer, `/i/`). `/entrar`, `/i/[code]` y `/restablecer`
  además emiten `noindex` a nivel página.
- [x] **`sitemap.ts`**: suma perfiles **con al menos un Flow publicado**.
- [x] **RSS 2.0** (`app/feed.xml/route.ts`): feed del Pub, sin cookies, cacheable;
  enlazado en el `<head>` (`alternates.types`).

## Siguiente (diferido — por qué)

1. **Cachear las páginas públicas (static/ISR).** `/`, `/flow/[id]`, `/@usuario`
   y `/tema/[slug]` son dinámicas porque el cliente Supabase usa `cookies()`, y
   `fetchFlow` hidrata like/guardado/sigue del lector. Un cache a secas
   **envenenaría** ese estado (congela al primer visitante para todos). Requiere
   partir el render: shell público estático + enriquecimiento del lector en
   cliente. **Alto valor, alto riesgo — sesión aparte.**
2. **Slugs legibles.** `/flow/<titulo>-<id-corto>` rankea mejor que un UUID.
   Requiere columna `slug` (migración) + backfill + **redirect 308** del UUID
   (las URLs ya indexadas deben pasar su equity, no dar 404). Slug congelado al
   publicar. Migración + 301s = sesión aparte.
3. **Podcast RSS (Apple/Spotify).** El feed RSS ya existe; el podcast necesita la
   namespace de iTunes: arte **cuadrado ≥1400px** (activo nuevo), tamaño en bytes
   del audio (columna nueva), categoría/owner/explicit. Bloqueado en assets/datos.
4. **`speakable`** (lectura por asistentes de voz). Encaja con lo voice-first,
   pero: (a) el transcript crudo **no** está en el DOM inicial (toggle en cliente)
   → apuntarle sería *cloaking*; (b) el rich result está prácticamente limitado a
   medios de noticias. ROI bajo. Si se hace: solo `h1` + cuerpo pulido (ambos en
   el DOM por defecto), con selectores estables.
5. **`<html lang>` por ruta** para contenido no-español (hoy fijo «es»). Ya se
   mitigó con `inLanguage` + `lang=` en el contenido; el arreglo pleno resuelve el
   lang efectivo del documento. **No** hacer hreflang: un Flow vive en UNA URL en
   su idioma (política del producto).
6. **Métricas / edge**: alta en Search Console; verificar en el borde que
   `www`↔apex y `http`→`https` hagan 301 y una sola convención de slash final
   (los canónicos ya mitigan, pero mejor no servir duplicados 200).

## Reglas para contenido nuevo

- Cada categoría nueva en el panel → automáticamente hub + sitemap (ya sale de
  la tabla `tags`; no hay que tocar código).
- El título que sugiere Gemini en el pulido ES el `<title>` y el H1 de la imagen
  OG: pedirle que sea descriptivo (ya lo hace: breve y evocador, sin comillas).
- No indexar contenido a medias: borradores (`status='draft'`) nunca entran a
  sitemap ni a hubs, y la página del Flow los emite `noindex` (defensa extra).
- **Todo JSON-LD nuevo pasa por `safeJsonLd`**; toda `sameAs`/href de usuario por
  `safeHref`. Es fácil de olvidar al agregar una propiedad con texto de usuario.
