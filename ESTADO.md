# ESTADO — FlowPub (handoff entre sesiones)

> Dónde nos quedamos y cómo seguir. Léelo al retomar (junto con `CLAUDE.md`).
> Última actualización: **sesión 9 — 2026-07-08 (landing `/splash` con Three.js,
> pitch deck `/deck`, paquete de marca en `D:\FlowPub\design`, campaña de marketing
> en `D:\FlowPub\marketing`, fix del FAB de cuenta. Build de producción VERDE)**.

## Sesión 9 — 2026-07-08: landing + deck + marca + marketing (tanda grande)

**typecheck/lint/`next build` VERDES** (build corrido con el dev server detenido).
`/splash` y `/deck` prerenderizan estáticas. Tanda pedida por Julio para lanzar
el sitio: **front puro, CERO SQL, cero dashboard**. Nuevas deps: `three` (+ dev
`@types/three`, `puppeteer-core` solo para generar capturas/verificar).

- **Fix del FAB de cuenta (desktop)** (`AppShell.tsx` → `RailAccountMenu`): el menú
  abría **hacia abajo** (`top-[calc(100%+8px)]`) y como el disparador vive al pie del
  riel, se salía de pantalla. Ahora abre **a la DERECHA anclado al fondo**
  (`absolute bottom-0 left-full`) y **al hover/foco** (con gracia de 140 ms para
  cruzar el hueco; `pl-2` como puente), sin tapar «Grabar un Flow». Escape cierra y
  devuelve foco. Keyframe nuevo `fp-emerge` en globals. **⚠️ Verificar con sesión
  real** (el menú solo aparece logueado; yo no pude loguearme en el preview).
- **Landing `/splash`** (`app/splash/page.tsx` + `components/welcome/`):
  splash pública guiada por scroll, **bilingüe ES/EN** (`COPY[lang]` local, no toca
  el diccionario global), claro/oscuro, reduce-motion-safe. Secciones: hero (vírgula
  + tagline + CTA «Grabar un Flow» → `/componer`) · por qué la voz · 3 pasos · el Pub
  (con capturas reales) · features · cierre. **Fondo Three.js** (`ThreeStage.tsx`,
  dynamic `ssr:false`): campo de partículas que fluye, reacciona a scroll+cursor,
  paleta por tema, limpia TODO al desmontar, static frame en reduce-motion. En
  sitemap (priority .9).
- **Pitch deck `/deck`** (`app/deck/page.tsx` + `components/deck/`): 14 slides
  interactivas (teclado ←/→, dots, swipe, barra de progreso), motion por slide
  (`visuals.tsx`), claro/oscuro, **noindex** (activo de fundraising, se comparte por
  enlace). Incluye capturas de la app en frames de navegador/teléfono y una **slide
  de finanzas** con 3 escenarios (Austero $2,058 / Base $18,858 / Ambicioso $81,498
  al año) y la petición **$20,000 USD / 12 meses** (escenario Base). Narrativa +
  finanzas salieron de un workflow de contenido (verificado con precios de jul 2026).
- **Capturas de la app** en `app/public/shots/` (16: Pub/Flow/perfil/explorar/entrar,
  móvil+desktop, claro+oscuro), generadas con puppeteer-core + Chrome del sistema
  (headless, idioma ES, tema forzado). Las usan la landing, el deck y el marketing.

### Entregables FUERA del repo de la app (no se despliegan)

- **`D:\FlowPub\design`** — paquete de marca: **27 SVG + 61 PNG + 14 PDF**
  (vírgula/wordmark/lockups/isotipo/favicon/avatar/OG/headers/swatches/clearspace en
  claro y oscuro) + **`flowpub-brand-book.pdf`** (5 págs) + `tokens.css`/`tokens.json`
  + `README.md`. Generado desde el path real de la vírgula y las TTF locales
  (Fraunces/Hanken/Space Mono) con texto **convertido a trazos** (portátil); PNG con
  `sharp`, PDF con PyMuPDF.
- **`D:\FlowPub\marketing`** — campaña «¡Saca el Flow!»: `copy/` (ES/EN +
  prensa-plan-calendario), `graphics/` (anuncio cuadrado/story, ad, cita,
  cómo-funciona en claro/oscuro; SVG+PNG; + copia de las capturas), `motion/`
  (`launch-teaser.html` animado autocontenido con fuentes embebidas + storyboards de
  reels), `checklist-lanzamiento.md`, `README.md`.

**Review adversarial (workflow · 4 dimensiones → verificación; 14 hallazgos
confirmados, TODOS arreglados salvo 1 diferido):**
- ThreeStage: `forceContextLoss()` al desmontar (evita fuga de contextos WebGL al
  alternar tema); `onResize` repinta en reduced-motion y reajusta pixelRatio.
- Deck: `go()` puro (sonido FUERA del updater de setState); teclado solo ←/→ (ya no
  secuestra el scroll del slide de finanzas); región `aria-live` que anuncia el
  cambio de slide; dots con hit ≥44px (`fp-hit-y`).
- FAB de cuenta: `closeSoon` ya no cierra si el teclado tiene el foco dentro del menú.
- Landing: `alt` de imágenes bilingüe (ES/EN); texto informativo chico `text-3→text-2`
  (AA); cue de scroll `aria-hidden`.
- Deck covers: caras de cubo `#fff/#000` → `var(--amate)/var(--tinta)` (tokens).
- **Diferido (baja, pre-existente):** el `role="menu"` del menú de cuenta no implementa
  el patrón completo de flechas/roving-tabindex (mismo patrón que el menú del avatar
  móvil; refactor de a11y para otra sesión).

**Verificado EN VIVO tras los fixes:** la landing aguanta 4 toggles de tema con
**0 errores de consola** y el canvas sigue vivo; el deck anuncia «Diapositiva N de
14…» por `aria-live`. typecheck/lint/`next build` verdes.

**👉 Julio:** es solo front — commit + push a `main` (= deploy). Nuevas rutas vivas:
`flowpub.app/splash` (landing) y `flowpub.app/deck` (pitch, noindex). **Verifica
el FAB con tu sesión** en desktop (pasa el cursor sobre tu avatar al pie del riel:
el menú debe abrir a la derecha, no abajo). Los paquetes `design/` y `marketing/`
son entregables locales (no se despliegan). Reenvía el sitemap en Search Console
(ahora trae `/splash`). **Ojo:** `npm install` agregó `three` — ya está en
`package.json`, Vercel lo instala solo en el próximo deploy.


## Sesión 8 (cont.) — 2026-07-08: /design (manual de marca) + build

**typecheck/lint/`next build` VERDES** (build corrido tras cerrar el dev server
de la otra sesión, con permiso de Julio). `/design` prerenderiza estática.

- **OG del sitio: ya dice `flowpub.app`** — Julio veía `.lat`; rendericé el PNG
  real (`/opengraph-image`) y confirma `flowpub.app`. Cero `.lat` en `src`/`public`
  (los `.lat` restantes son históricos: handoff, design-map, ESTADO, migration_01).
  Lo que se ve con `.lat` es **caché social** de la época `flowpub.lat` → se
  refresca con redeploy + re-escanear en el debugger de la plataforma.
- **`/design` — identidad + manual de uso** (`app/design/page.tsx` + client
  `components/design/BrandGuide.tsx`). Página pública independiente (fuera del
  chrome del Pub), indexable (en sitemap). **Bilingüe con switch ES/EN real**
  (usa `useI18n().setLang` global → persiste `fp-lang` + fija `<html lang>`),
  toggle de tema, y copy colocado con `tr(es,en)`. Secciones: hero · la vírgula
  (reglas/aire/mínimos) · wordmark+lockup · **color** (paleta base + roles
  claro↔oscuro, swatches con copiar-hex y badge «reservado» = ícono Lock) ·
  tipografía (3 voces, especímenes) · movimiento · **sonido** (5 blips
  REPRODUCIBLES vía `useSound().play`) · **portadas** (4 `<Cover>` en vivo:
  escher/turrell/flavin/collage) · voz y tono (do/don’t) · **descargas** (Blob
  cliente: vírgula.svg, lockup.svg, tokens.css, tokens.json + ícono 512 + fuentes).
  Todo por tokens; los hex «crudos» son la paleta que el manual DOCUMENTA.
- **Verificado en vivo** (mi propio dev server, ya libre): renderiza claro/oscuro,
  switch cambia copy + `<html lang>`, tema, 4 portadas, descargas (Blob JSON 910 B),
  sonidos sin error, 0 errores de consola. **Contraste medido AA en ambos temas**
  (claro 4.9–5.29:1, oscuro 7.6–8.26:1).

**Review adversarial del /design (workflow #3) — arreglado:**
- Bilingües: aria-label «Copiar→Copy {hex}», title «Reservado→Reserved», y los
  3 especímenes tipográficos (tagline/chrome/timestamp) ahora con `tr()`.
- A11y: `text-3`→`text-2` en 9 etiquetas meta (text-3 daba ~2.8:1 en claro);
  nav de secciones `scroll-mt-28` (antes se metía bajo el header sticky de 108px);
  `fp-hit-y` en el switch de idioma y el nav (targets ≥44px).
- Aceptado sin cambio: `text-2` sobre el gradiente de fondo (mismo patrón ya
  auditado como AA en toda la app). El review perdió algunos verifies al tope de
  sesión, pero los hallazgos accionados se confirmaron a mano/en vivo.

**👉 Julio:** todo front, cero SQL. Commit + push a `main` (= deploy). `/design`
queda vivo en `flowpub.app/design`. Enlázalo donde gustes (aún no está en el
chrome; se llega por URL / sitemap). Para el OG: tras deploy, re-escanea en el
debugger de WhatsApp/redes para tirar el caché viejo de `.lat`.


## Sesión 8 — 2026-07-08: SEO a fondo + letrero beta + legales

**Todo FRONT (cero SQL, cero dashboard). typecheck/lint verdes; verificado EN
VIVO** contra el dev server de otra sesión (mismo working tree, HMR) —
robots/sitemap/feed/JSON-LD/OG-image/metadata de home, Flow, perfil, tema y
explore. **`next build` NO se corrió**: otra sesión tiene el dev server tomando
`.next` (Next bloquea un 2º proceso); Vercel lo compila al hacer push.
Dos workflows multi-agente: (1) diseño SEO (4 especialistas + síntesis) para
presionar el plan, (2) review adversarial (5 dimensiones → verificación).

**SEO — la jugada: volver INDEXABLE y ESTRUCTURADO el texto de cada Flow**
(audio + artículo pulido + transcript). Base compartida `lib/seo.ts` (`SITE` en
un solo lugar —antes duplicado en 6 archivos—, `absoluteUrl`, `mdToPlainText`,
`countWords`, `breadcrumbList`, `RSS_ALT`). Todo JSON-LD pasa por `safeJsonLd`.

- **Datos estructurados del Flow** (`flow/[id]/page.tsx`): `Article` con `image`
  (la OG por Flow), `inLanguage`=**`flow.lang`** (antes «es» hardcodeado = bug en
  EN), `articleBody` (artículo pulido en texto), `wordCount`, `keywords`/
  `articleSection`, `isAccessibleForFree`, `interactionStatistic` (likes+comentarios
  como `InteractionCounter`, NO ratings falsos), autor con `@id` estable + `image`,
  `publisher.logo`. `AudioObject` con **`transcript`=transcript crudo**, `name`,
  `uploadDate`, `encodingFormat`, `inLanguage`. + `BreadcrumbList`.
- **Transcript AHORA en el DOM** (`FlowReader`): las vistas pub/raw se alternan
  por `hidden` (visibilidad), no por montaje → el transcript crudo vive en el HTML
  del servidor (indexable + coherente con `AudioObject.transcript`, no cloaking).
- **Imagen OG por Flow** (`flow/[id]/opengraph-image.tsx`): tarjeta de marca con
  el título en Fraunces (satori). Lee sin cookies (REST, `id` con
  `encodeURIComponent` anti-inyección PostgREST), clampa título Y autor antes de
  satori (anti-DoS), cae a tarjeta genérica si el id no existe. Alimenta
  `og:image`+`twitter:image`+`Article.image`. Verificado: PNG 200.
- **Malla de enlaces internos** (`components/flow/RelatedFlows.tsx`, server):
  «Más de {autor}» + «Más en {tema}» como `<a>` en SSR. Reusa fetchers `cache()`d.
- **Home**: `@graph` WebSite + SearchAction (caja de sitelinks → `/explorar`) +
  Organization con logo.
- **Perfil**: `Person` con `image`, `sameAs` (web+redes por `safeHref`), `@id`
  compartido con el autor de cada Flow, `address`. noindex si 0 Flows.
- **Tema**: `CollectionPage` con `ItemList` + `BreadcrumbList`.
- **`/explorar?q=`**: noindex (sin canonical cruzado); base indexable.
- **`robots.ts`**: bloquea privadas/gateadas. **`sitemap.ts`**: + perfiles con ≥1
  Flow. **`/entrar`** noindex. **RSS 2.0** (`app/feed.xml`) enlazado en el `<head>`
  (`RSS_ALT` reesparcido en cada página porque Next fusiona `alternates` superficial).
- **Metadata del Flow**: robots noindex si borrador, keywords, authors, og
  article tags/locale, twitter; `lang={flow.lang}` en título+cuerpo del reader.

**Letrero «beta»** (`components/brand/BetaBadge.tsx`): pill discreto (mono, tokens,
sin emoji, **sin grana**), junto al wordmark en riel desktop + barra móvil (prop
`beta` en `<Logo>`). Contraste medido: 5.07:1 claro / 7.99:1 oscuro (AA). i18n
`beta.title` (tooltip). A11y: el link de home lleva `aria-label="FlowPub"` (el
badge NO mete su frase en el nombre accesible).

**Legales** (`lib/legal.ts`): Privacidad ahora lista origen/web/redes + un bloque
público-vs-privado; Términos con nota de beta; fecha → 8 jul 2026. `docs/seo.md`
reescrito (implementado + diferidos con el porqué).

**Review adversarial — 6 hallazgos, TODOS arreglados** (0 rechazados):
- [med] RSS: `xmlEscape` no quitaba caracteres de control ilegales en XML 1.0 →
  un título con `U+000C` rompía el feed ENTERO para todos. Fix: strip del rango.
- [low] `<link>` de autodescubrimiento RSS se caía en TODAS las páginas (Next
  fusiona `alternates` superficial: el canonical de cada página reemplazaba el
  `types` del layout). Fix: `RSS_ALT` reesparcido en las 6 páginas con canonical.
- [med→low] `aria-label` del badge contaminaba el nombre del link de home. Fix:
  quitar aria-label del badge (queda `title`) + `aria-label="FlowPub"` en el link.
- [low] OG image: `display_name` del autor sin clampar (DoS). Fix: `.slice(0,60)`.
- [low] `/explorar?q=` noindex + canonical a otra URL (señales en conflicto). Fix:
  canonical solo en la base; el `?q=` se auto-canonicaliza.
- [low] `AudioObject.transcript` marcaba texto ausente del DOM (cloaking-adjacent).
  Fix: transcript ahora en el DOM (ver arriba) — resuelto de raíz.

**👉 Julio:** es solo front — cuando gustes, commit + push a `main` (= deploy).
Tras desplegar en `flowpub.app`: re-enviar el sitemap en Search Console (ya trae
perfiles), y verás el letrero beta en el riel/barra. Nada de SQL esta vez.
Pendientes SEO grandes (otra sesión, ver `docs/seo.md`): static/ISR sin envenenar
el estado del lector, slugs legibles (migración+301), podcast RSS (arte 1400px).

## Sesión 7 — 2026-07-08: perfil enriquecido, cropper 16:9, emojis, modales

**typecheck/lint/build verdes; review adversarial multi-agente (3 hallazgos
confirmados, TODOS arreglados antes del push).**

- **Fix scroll de modales** (`Modal.tsx`): el modal base ahora es flex-column con
  `max-h-[calc(100dvh-2rem)]`; con footer, el cuerpo hace scroll y el footer queda
  fijo (antes «Guardar» de Edit Flow caía fuera del viewport). Sin footer
  (LegalProvider) renderiza directo, self-managed. Nuevo prop `closeOnEscape`.
- **`ImageCropper`** (reemplaza a AvatarCropper): pan+zoom, aspecto 1:1 circular
  (avatar) o 16:9 (portada de Flow). Cableado en composer + FlowEditModal: subir
  foto de portada ahora RECORTA/previsualiza en 16:9 siempre. Escape del cropper
  ya no cierra el modal padre (ver fix del review).
- **Perfil: origen + redes + web** (`migration_20` ⚠️ correr): columnas
  city/state/country/website/instagram/x/tiktok/youtube + **re-grant SELECT con
  TODAS las columnas** (conserva las de migration_15 + 8 nuevas; birthdate sigue
  fuera) y UPDATE. `lib/links.ts` sanea (solo http/https, sin javascript:).
  `SocialLinks` pinta íconos monolínea. Editar perfil trae los campos nuevos.
  Cascada tolerante triple (SEL_FULL→PRE20→LEGACY) — el perfil carga aunque la
  migración no haya corrido (verificado).
- **Emojis en desktop** (`EmojiButton`): set curado, inserta en el caret;
  cableado en cuerpo del Flow (MarkdownToolbar), comentarios y mensajes. Oculto
  en móvil (teclado del SO ya trae emojis). **Ojo CLAUDE.md**: es para CONTENIDO
  del usuario; el chrome de la app sigue sin emoji (la única marca es la vírgula).
- **Copy** «En el Flow desde el {fecha}» (ES) / «In the Flow since {date}» (EN).

**Review adversarial — 3 fixes aplicados (habrían sido bugs en prod):**
- [MAYOR] `closeOnEscape` quedaba en closure obsoleto (deps del effect sin él) →
  el guard de modal anidado estaba MUERTO, Escape sobre el cropper cerraba el
  modal padre y perdía las ediciones. Fix: listener de Escape en effect propio
  con `closeOnEscape` en deps.
- [MAYOR] `safeHref` solo probaba el prefijo del esquema → una web malformada
  (`http://[`) guardada por REST hacía tronar `new URL` al renderizar y tumbaba
  la página pública del perfil (DoS almacenado, auto-scope por RLS). Fix:
  `safeHref` parsea con `new URL` en try/catch y exige http/https; `hostLabel`
  guardado. Verificado contra entradas hostiles.
- [MENOR] `updateProfile` escribía origen/redes/web SIEMPRE (null en vacío),
  sin el centinela `undefined=no tocar` de birthdate → ante lectura degradada
  (grant partido) el primer guardado borraba datos reales. Fix: extras con
  `undefined=no tocar` + `PublicProfile.hasLinks` (el editor solo reescribe si
  la lectura trajo las columnas). Defensa en profundidad (el proyecto tiene
  historial de grants por columna partidos — ver memoria).

**👉 Julio — SQL Editor: `migration_20`** (origen + redes + web). Tras correrla:
edita tu perfil (ciudad/estado/país, IG/X/TikTok/YouTube, web) y velos en tu
perfil. El resto es solo front (sin más SQL).

## Sesión 6 (cont. 4) — 2026-07-07: compra de flowpub.app + prompt de instalación

> **NUEVO DOMINIO: flowpub.app** (Julio lo compró; .lat pasa a redirect 301).
> Los cambios de CÓDIGO ya están hechos; la MIGRACIÓN EN VIVO es un runbook de
> dashboard que corre Julio EN ORDEN (abajo). Verificado con workflow de 5
> análisis + crítico adversarial.

- **Prompt de instalación PWA suprimido en DESKTOP** (independiente de la
  migración): `InstallPrompt.tsx` gate `isMobile()` (userAgentData.mobile →
  fallback pointer:coarse + viewport ≤900px). En desktop se captura el evento
  pero sin banner; el navegador ya ofrece instalar desde la barra. Móvil intacto.
- **Dominio en código → flowpub.app** (36 reemplazos, 15 archivos, script
  verificado por conteos): 6 fallbacks `?? "https://flowpub.app"` (layout/sitemap/
  robots/flow[id]/[username]/tema — INERTES en prod hasta cambiar la env var),
  chip del OG PNG (opengraph-image.tsx), hints i18n del onboarding ES/EN, texto
  legal (legal.ts ×2), las 2 plantillas de correo + su README, docs/deploy.md,
  docs/seo.md, CLAUDE.md. NO tocado (referencia histórica): design_handoff/**,
  design-map.json, migration_01 (emails demo).

### 🚦 RUNBOOK de migración flowpub.lat → flowpub.app (Julio, EN ESTE ORDEN)

> Regla de oro: **agrega .app a TODAS las allowlists ANTES de mover tráfico, y
> CONSERVA .lat** hasta que todo esté estable. El código no necesita más cambios
> para que el login migre (los redirectTo son dinámicos por host); lo único que
> rompe auth es una allowlist externa que no incluya .app.

1. **Vercel → Domains**: Add `flowpub.app` y `www.flowpub.app`. No borres .lat. **(bloqueante)**
2. **Namecheap → DNS de flowpub.app**: crea los A/CNAME EXACTOS que dé Vercel; TTL bajo. Deja vivo el A de .lat. **(bloqueante)**
3. **Vercel**: espera «Valid Configuration» + **cert TLS emitido** para .app. `.app` está en HSTS-preload: sin cert queda 100% inaccesible. **(bloqueante)**
4. **Supabase → Auth → URL Configuration**: AGREGA `https://flowpub.app/**` a Redirect URLs. CONSERVA `flowpub.lat/**` y `localhost:3000/**`. **No cambies Site URL aún.** **(bloqueante)**
5. **Cloudflare Turnstile**: agrega hostnames `flowpub.app` y `www.flowpub.app` al widget (misma site key). Conserva .lat. Sin esto, el botón de registro se deshabilita SIN error visible. **(bloqueante)**
6. **Google Cloud → OAuth**: agrega `https://flowpub.app` a Authorized JavaScript origins. NO toques las redirect URIs (apuntan a *.supabase.co). *(no bloqueante)*
7. **Verifica EN VIVO** en `https://flowpub.app` (aún no primario): login con Google + un signup + un reset. **(bloqueante — antes de montar el 301)**
8. **Vercel → Env**: cambia `NEXT_PUBLIC_SITE_URL` a `https://flowpub.app` (Production+Preview) y **REDEPLOY**. Verifica `/sitemap.xml` y `/robots.txt` con .app. *(este redeploy recoge todos los cambios de código de esta sesión)* **(bloqueante para SEO/OG)**
9. **Vercel → Domains**: marca `flowpub.app` **primario**; `flowpub.lat` → **Redirect 308** a .app; `www` → apex. NO borres el DNS de .lat. *(hazlo solo con .app estable y auth OK)*
10. **Supabase → Site URL**: cámbialo a `https://flowpub.app`. DEJA `flowpub.lat/**` en Redirect URLs unas semanas (enlaces de correo ya enviados apuntan a .lat, válidos ~24h).
11. **Resend → Domains**: Add `flowpub.app` + crea SPF/DKIM/DMARC en el DNS. Espera **Verified** (24–48h). NO quites .lat de Resend.
12. **Supabase → SMTP**: SOLO tras «Verified», cambia el remitente a `hola@flowpub.app` (host/user/password igual). Antes de verificar = correos rebotan EN SILENCIO.
13. **Supabase → Email Templates**: re-pega el HTML actualizado de «Confirm signup» y «Reset Password» (ya apuntan a flowpub.app en el repo; los clientes de correo NO siguen el 301 en `<img>`). Yo puedo re-pegarlos por Chrome cuando digas.
14. **Google Search Console**: propiedad `flowpub.app` + reenvía sitemap; en la propiedad .lat usa «Cambio de dirección» → .app.

**Fricción inevitable a comunicar:** cookies/sesión son por-origen → **todos los
beta-testers quedan deslogueados en .app** y deben re-entrar (no es bug).

**Lo que dejaría a un usuario FUERA** (evitarlo respetando el orden): tráfico a
.app antes de allowlistar Supabase/Turnstile; anunciar .app sin cert TLS; cambiar
el remitente a @flowpub.app antes de «Verified» en Resend; quitar .lat de las
allowlists antes de que caduquen los enlaces de correo viejos.



## Sesión 6 — 2026-07-07: auditoría pre-beta + correos con la marca

- **Julio corrió TODAS las migraciones hasta `migration_15`** y verificó el toggle
  «Captcha protection» en Supabase. Los bloqueantes de BD del pre-beta quedan
  cerrados.
- **Correos de Auth con la marca** (`supabase/email-templates/`): plantillas HTML
  on-brand (tinta/grana/amate, wordmark *Flow*Pub, botón grana pill, marca vía PNG
  `flowpub.lat/icono-512` porque Gmail bloquea SVG). **Aplicadas en producción vía
  Chrome**: «Confirm sign up» (asunto «Confirma tu correo y entra a FlowPub») y
  «Reset password» (asunto «Restablece tu contraseña de FlowPub»). Verificadas en
  el Preview de Supabase. Ver `email-templates/README.md` para el mapeo y cómo
  re-aplicar. Faltan por marcar (siguen en inglés default): Invite, Magic link,
  Change email, Reauthentication — no urgen hoy.
- **Resend YA estaba conectado** (hallazgo): Custom SMTP activo en Supabase
  (`smtp.resend.com:465`, user `resend`, remitente `hola@flowpub.lat`). La nota de
  «Resend pendiente» de sesiones previas quedó obsoleta. **Pendiente de Julio:**
  confirmar que el dominio `flowpub.lat` siga «Verified» en Resend y hacer una
  prueba E2E real (disparar «¿Olvidaste tu contraseña?» y ver que llegue el correo
  con la marca).
- **service_role key:** para llenar `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` →
  Supabase → Settings → API Keys → pestaña **«Legacy anon, service_role API keys»**
  → copiar `service_role`.
- **Auditoría integral pre-beta (3 barridos + a11y en vivo)**: hallazgos
  priorizados; la tanda P0 se ejecutó completa (ver sesión 6 cont.).
  - _P1 (pendiente):_ feed vacío sin CTA; skeletons en perfil/notificaciones;
    «Cargando comentarios…» sin timeout; targets `h-8` (32px) e iconos <44px;
    DMs de voz viven en bucket `audio` público (fuga de privacidad → signed
    URLs); a11y menor (aria-invalid, foco al cerrar dropdowns, `title` en modal
    de legales); barrido i18n completo del Composer (fase 9).
  - Lo que YA está fuerte: optimistas con revert, focus ring grana,
    prefers-reduced-motion, Modal con focus-trap, i18n ~528 keys, RLS por columna.

## Sesión 6 (cont. 3) — 2026-07-07: tanda de features (delegada a subagentes) + audit de seguridad

**Ejecutada con 3 subagentes en paralelo (chrome/nav, edición de Flow, invites/badges)
+ 1 auditor de seguridad. typecheck/lint/build verdes; verificado en vivo.**

- **Notificaciones → perfil**: avatar y nombre del actor ahora son Links a `/@usuario`
  (stopPropagation dentro del div role=button; marca leído). NotificationsView.
- **Auth CTA (desktop + móvil)**: riel desktop y top bar móvil muestran «Sign up | Login»
  (inglés fijo en ambos idiomas, keys auth.signupCta/loginCta) → `/entrar?m=signup|login`.
  `/entrar` lee `m` (enum acotado) y siembra el authMode. Con sesión, el riel muestra
  Avatar+nombre con menú (Ver perfil / Panel de admin si isAdmin / Cerrar sesión; Escape
  devuelve foco). `AuthProvider` expone `isAdmin` SOLO cosmético (gate real sigue server+RLS).
- **«Artículo» → «Flow»** en toda la UI (dictionaries ES/EN + prosa hardcodeada de
  Composer y /tema). Intactos: prompt de Gemini, legal.ts, SEO/JSON-LD (schema.org Article).
- **Home alcanzable en TODA pantalla**: logo→"/" agregado en /entrar, /restablecer, /i/[code].
- **Crédito**: «Creado por Julio Sahagún Sánchez» → https://juliosahagunsanchez.com/
  (noopener) en el riel/menú (desktop+móvil) y pie del onboarding. Key `credit`.
- **Edición completa del Flow** (`migration_17` ⚠️ correr): FlowEditModal ahora edita
  portada (subir foto / usar generada / ciclar generativa) y temas (TagPicker). `updateFlow`
  extendido (coverUrl/coverKind/tagNames, cascada tolerante). Tema **ASMR** sembrado.
  **Crear tema propio** desde el TagPicker (slug saneado, degrada si no hay migración).
  El composer trae los temas reales de la BD (server) con fallback a CATEGORIES.
- **Invitaciones 6→9 + badges OG** (`migration_18` ⚠️ correr): acuñado 9 + backfill; RPC
  público `invite_redemptions` (solo conteo). Badge «OG» + estrellas lucide en ocre junto
  al nombre del perfil (≥3/6/9 canjes = 1/2/3 estrellas). InvitesCard muestra progreso.

**Audit de seguridad (Sonnet, adversarial) — hallazgos accionados HOY:**
- **[CRÍTICO — ARREGLADO en código] Stored XSS vía JSON-LD**: `flow/[id]`, `[username]`,
  `tema/[slug]` insertaban campos editables por el usuario (bio, display_name, título) con
  `JSON.stringify` que NO escapa `</script>` → robo de sesión a cualquier visitante. Fix:
  `lib/jsonLd.ts` (`safeJsonLd` escapa `< > &` a \\u00xx) usado en las 3 páginas. Verificado
  en vivo: carga hostil ya no rompe el script, dato intacto al parsear. Era PREEXISTENTE
  (no de esta tanda), vivía en prod desde el commit de SEO.
- **[ALTO — ARREGLADO en código] Faltaban headers de seguridad**: `next.config.ts` ahora
  sirve X-Frame-Options DENY, nosniff, Referrer-Policy, HSTS, CSP `frame-ancestors 'none'`,
  Permissions-Policy (mic=self). Verificados servidos. NO se puso `script-src` estricto a
  propósito (rompería Turnstile/Supabase/Google OAuth sin prueba en vivo) — CSP completa
  queda pendiente para probar en prod.
- **[MEDIO/BAJO — SQL en `migration_19` ⚠️ correr]**: buckets sin tope → `file_size_limit`
  + `allowed_mime_types` (imágenes 5MB, audio 25MB); `tags` sin CHECK → constraints de
  slug/nombre/sort (la validación 3–24 era solo cliente, brincable por REST directo).
- **[BAJO — ARREGLADO] FlowProse**: links de markdown ahora `rel="noopener noreferrer"`.
- **Confirmado sano (no tocado)**: migration_16 (cast ::uuid no explotable), flow_tags_write
  (no tagueas Flows ajenos), invite_redemptions (solo conteo), isAdmin cliente (cosmético),
  rate-limit (key server-side no spoofeable; bypass solo por paralelismo — best-effort ok
  para beta). react-markdown sin rehype-raw = sin XSS por contenido.
- **Veredicto del auditor**: apto para beta chica UNA VEZ arreglado el XSS (hecho) y corrida
  la migration_16 (Julio ya la corrió). El resto no bloquea beta familiar.

**👉 Julio — SQL Editor (en orden): `migration_17` (edición Flow + ASMR + temas de
usuario), `migration_18` (invites 9 + badges), `migration_19` (hardening: límites de
bucket + CHECKs de tags).** La 16 ya la corriste. Tras la 17: prueba editar la portada y
los temas de un Flow tuyo, crear un tema, y ver ASMR en el picker. Tras la 18: revisa tu
perfil (badge OG si tienes ≥3 canjes) y la tarjeta de invitaciones (debe decir 9).

**Pendiente de código (no urge beta):** CSP con script-src completa (probar hosts en prod);
rate-limit global real (Upstash/tabla) si la cuota de Gemini aprieta.

## Sesión 6 (cont. 2) — 2026-07-07: tanda P1 completa (typecheck/lint/build verdes)

- **Feed vacío con CTA**: Pub sin Flows → botón «Grabar un Flow»; si el vacío es
  por FILTRO, mensaje distinto (`pub.emptyFiltered`) sin empujar a grabar
  (verificado en vivo con filtro ≤15s).
- **`loading.tsx` de marca en 8 rutas** (/, flow, @usuario, notifs, mensajes ×2,
  explorar, tema): vírgula respirando (`RouteLoading`) en vez de blanco en 3G.
- **Comentarios inline con reintento**: si la carga falla ya no hay «Cargando…»
  eterno — aviso + botón Reintentar (`comments.error/retry`).
- **Targets táctiles**: clases `.fp-hit` (44×44) y `.fp-hit-y` (44 solo vertical,
  para filas apretadas) en globals — ⚠️ como CSS plano, NO `@utility` (el
  `&::after` anidado en @utility no genera regla; Tailwind lo tira en silencio).
  Aplicadas a 25 controles (chips, play/velocidad, toolbar markdown, iconos de
  cards, toggles, menús) + bump h-8→h-9 en iconos agrupados y el lápiz del
  avatar (absoluto: sin fp-hit, chocaría el position). Verificado en vivo:
  chip 34px con hit de 44 (tap 4px arriba SÍ pega), play 44×44.
- **DMs de voz PRIVADOS** (`migration_16` ⚠️ correr): bucket `messages` privado,
  políticas por membresía (`is_member` del path `<convId>/<uid>/…`).
  `uploadVoiceMessage` guarda el PATH en `messages.audio_url`; `MessageBubble`
  lo firma por 1h (`resolveMessageAudio`); URLs http legacy pasan tal cual.
  Sin migración: fallback al bucket público con `console.warn` (nada se rompe).
- **A11y menor**: `aria-invalid` + `aria-describedby` en inputs del onboarding
  (email/password/forgot → `#onb-error` con role=status); Escape/selección en
  AvatarMenu y DurationMenu devuelven el foco al trigger (verificado);
  `labelledBy` nuevo en `<Modal>` + el modal de legales anuncia su título
  (verificado: `aria-labelledby=fp-legal-title` → «Términos y Condiciones…»).

**👉 Julio — SQL Editor: `migration_16`** (DMs de voz privados). Luego prueba
una nota de voz en DM: debe subir a `messages/` (privado) y reproducirse; los
audios viejos de DMs siguen sonando (eran públicos y quedan así).

**Pendiente que sigue en la lista (post-P1):** paginación real del feed ·
og:image por Flow · barrido i18n total del Composer (fase 9) · skeletons ricos
por pantalla (hoy: vírgula centrada) · focus-trap completo en Modal · límites
dinámicos desde `settings`.

## Sesión 6 (cont.) — 2026-07-07: tanda P0 completa (typecheck/lint/build verdes)

- **Composer no pierde voces**: `beforeunload` cuando hay Flow a medias
  (grabando/procesando/editando) + `confirm` al salir por los links del header
  (nav interna no dispara beforeunload).
- **Procesamiento honesto**: `ProcessingStep` ya no usa timers falsos — la fase
  la fija el pipeline real (`transcribe → polish → publish`); a los ~12s en la
  misma fase aparece «seguimos en ello»; timeouts reales (`AbortSignal.timeout`:
  transcribe 90s, polish 75s; si el pulido falla/tarda → cae al transcript crudo).
- **Errores diferenciados al publicar**: sesión vencida (con instrucción de
  re-entrar en otra pestaña — el Flow queda intacto en la actual) vs. servicio
  saturado (429) vs. genérico; keys `compose.err.*` ES/EN.
- **AudioPlayer robusto**: spinner al bufferear (`readyState`/`onWaiting`),
  `onError` → «El audio no está disponible. Toca para reintentar.» (reintenta
  con `load()`). **Verificado en vivo** forzando un src 404.
- **`not-found.tsx` + `error.tsx` de marca** (vírgula, copy cálido, CTA al Pub;
  error boundary loguea `digest` para cruzar con logs de Vercel). Verificado el
  404 en vivo.
- **Contraste AA (tarea grande)**: barrido `text-3 → text-2` en TODO texto
  informativo chico de superficies de usuario (~50 reemplazos en 28 archivos via
  script Node con verificación de conteos; quedaron fuera: placeholders, íconos
  decorativos, admin y styleguide — `text-3` sigue existiendo como color mute
  para eso). **Medido en vivo tras el cambio: claro 0 fallos, oscuro 0 fallos
  reales** (los 2 reportados eran artefactos del fondo glass en mi script de
  medición).
- **i18n**: 6 strings marcados a catálogo (`compose.coverPhoto/coverGenerated/
  audio/viewTranscript`, `flow.viewRawLabel/commentsTitle`) + toggle del reader
  (`flow.viewPub/viewRaw`) + fases y errores del composer + `player.error` +
  `nf.*`/`err.*` — todo ES+EN. `rec.micError` ahora guía al candadito del
  navegador (mic denegado ya no es callejón sin salida).
- **Rate-limit en `/api/{transcribe,polish,translate}`** (`lib/rateLimit.ts`):
  ráfaga + tope por hora por usuario (transcribe/polish 5/min y 30/h; translate
  10/min y 60/h), 429 con `Retry-After`; best-effort en memoria por instancia
  (documentado; si algún día hace falta límite global duro → Upstash/tabla).
- **Gotcha nuevo (medición)**: al medir contraste con eval sobre paneles glass
  (`rgba` sin fondo opaco arriba), el fallback del script mezcla con blanco y da
  falsos fallos en oscuro («Inicia sesión» 3.58, aviso de cookies 3.33) —
  verificar el fondo real antes de creerle. Y las `transition` de color pueden
  congelarse en el renderer del preview: inyectar `transition:none` al medir.

**👉 Julio:** la tanda es solo front — no hay SQL ni dashboard nuevos. Cuando
gustes: commit + push a `main` (= deploy) y prueba humana del composer con mic
real (grabar → recargar a medias para ver el aviso → publicar).

## Sesión 5 (cont.) — contenido sensible + legal

- **Contenido sensible** (`migration_15` ⚠️ correr): casillas en el composer
  («Palabras altisonantes» pre-marcada si el transcript trae groserías —
  lib/profanity.ts ES-MX+EN; «Para mayores de 18» fija si lleva el tema Hot,
  con trigger del servidor que lo garantiza). Stickers sutiles 18+/«Lenguaje
  explícito» en cards y reader. Compuerta de edad: fecha de nacimiento
  PRIVADA en Editar perfil (revoke select por columnas + RPC my_birthdate);
  el reproductor de un 18+ solo aparece con mayoría declarada (invitado → a
  entrar; sin fecha → a su perfil; el autor siempre se escucha); la radio
  del Pub salta los 18+ para quien no puede. SELECTs v2 con retry 42703:
  prod no se rompe si la migración corre después del deploy.
- **Legal (estilo Gulu, a la FlowPub)**: `lib/legal.ts` (Términos/Privacidad/
  Cookies, MX, responsable Julio, base para pulir con abogado) +
  `LegalProvider` global: modal con tabs (verificado: tabs cambian, 12
  secciones en Términos) + aviso de cookies primera visita («solo cookies
  esenciales» + Entendido persistente en fp-consent — verificado) + fila
  Términos·Privacidad·Cookies en el riel desktop (verificado abre el modal)
  + **menú del avatar** en la top bar móvil (Ver perfil / Cerrar sesión /
  legales — patrón DurationMenu; ⚠️ verificar con sesión) + línea legal del
  onboarding ahora clickeable (keys onb.legal.* divididas).

**👉 Julio — SQL Editor: `migration_15`** (flags + birthdate + Hot). Probar
con sesión: menú del avatar, casillas al publicar, fecha de nacimiento y la
compuerta 18+ (publica un Flow Hot y velo sin fecha declarada).

## Sesión 5 — 2026-07-03: portadas con alma, fotos propias y audit del registro

- **Limpieza del SQL ajeno**: Julio corrió 2 migraciones de Gulu por accidente;
  solo crearon 3 funciones huérfanas (cero datos tocados). `migration_13` las
  dropea y censa las funciones (⚠️ correr).
- **Ajustes visuales del Pub** (verificados): reproductor a lo ancho de la
  card (variant full), chips del filtro sólidos (bg-surface sobre la barra
  glass), hover de cards sin salto → token `--shadow-glow` (halo claro/oscuro).
- **Portadas generativas con variedad**: Escher 3 composiciones (retícula/
  monolito con sombra/escalera + banda de hatch), Turrell 4 aperturas (sala/
  óvalo/arco/ranura + horizonte), Flavin 3 (vertical/horizontal/diagonal +
  barra cruzada), Collage con anillos, parches Ben-Day, media luna ancla y
  tiras de papel. Todo determinista por seed, paleta intacta. Verificado
  estructuralmente en /styleguide (8 covers, 8 fingerprints distintos).
- **Foto propia como portada del Flow**: en el composer, «Subir mi foto»
  (bucket covers, carpeta uid) o la generada; persiste `flows.cover_url`;
  `<FlowCover>` la pinta en FlowCard/FlowReader/tiles/notificaciones.
  ⚠️ Falta probar con humano el flujo completo del composer con foto.
- **Banner de perfil editable**: `migration_14` (⚠️ correr: profiles.banner_url
  + grant de columna); subir desde Editar perfil (preview en el modal);
  ProfileBanner pinta la foto (con velo inferior) o el generativo; lectura
  tolerante mientras no corra la migración.
- **Audit /design-critique del registro (medido en vivo, tema oscuro = peor
  caso)**: links grana («Crea una»/«Inicia sesión») daban 3.07:1 ❌ → ahora
  `--grana-text` 8.16:1 ✓ (igual el eyebrow y el link de la compuerta de
  comentarios y la top bar móvil); legal 11px con text-3 daba 2.81:1 en CLARO
  ❌ → text-2 5.29/7.6 ✓; ojo del password de 36px → 44×44 ✓ (también en
  /restablecer). Copy vs design-map: fiel.
- Recuperar contraseña YA existía (41593fc) — Julio no lo había visto.

**👉 Julio — SQL Editor:** `migration_13` (limpieza SQL ajeno) y
`migration_14` (banner). También pendientes de antes: 11 y 12 si no corrieron.

## Sesión 4, cierre — la tanda del beta

**BD:** Julio corrió 05, 06 (versión arreglada), 07 y 08. Producción quedó
limpia: solo `julio` (admin) + un registro nuevo `pentroxyl_01ff`.

**Hecho (typecheck/lint/build verdes):**
- **Invitaciones** (`migration_10` ⚠️ pendiente de correr): 6 códigos por
  usuario (trigger + backfill), landing `/i/[code]` de marca, canje en el
  onboarding (localStorage `fp-invite`, sobrevive OAuth), auto-follow mutuo
  (dispara la notificación de follow), tarjeta en el perfil propio con
  Copiar enlace y Compartir por WhatsApp (`wa.me`). Sin migración: tarjeta
  oculta y `/i/*` → 404 (verificado).
- **PWA:** `manifest.webmanifest` + iconos 192/512 de la vírgula (verificado
  el PNG) + favicon generado. `InstallPrompt`: ofrece instalar; descartado →
  reaparece cada 3 visitas (visita = sesión de navegador). Solo se puede
  probar de verdad en HTTPS (prod).
- **Anti-caché de versiones:** `/api/version` (SHA del deploy de Vercel) +
  `VersionWatcher` (chequeo al volver a la pestaña + cada 15 min) → chip
  «Hay una versión nueva — Actualizar». En dev devuelve "dev" (inerte).
- **A11y tema oscuro (audit + fix, medido en vivo):** token nuevo
  `--grana-text` (#C0303A claro / #EC9DA2 oscuro) para grana COMO TEXTO —
  el pleno daba 3.07:1 sobre superficies oscuras, el nuevo 8.16:1. Burbujas
  salientes de DM ahora tinta (ink/ink-on, 15.5:1; en oscuro son claritas);
  mic del composer neutral en idle. Grana queda para: Enviar (CTA) y el
  pulso de grabación (roles reservados).
- **CommentComposer internacionalizado** (tabs/placeholder/errores ES+EN).
- **Ojo mostrar/ocultar** contraseña en onboarding.
- **Bottom nav móvil compacto:** 53px (antes 63), botones al centro, FAB 54
  intacto sobresaliendo (pedido de Julio; su imagen adjunta no llegó —
  implementado per descripción).
- **Temas nuevos** Filosofía y Chistes (`migration_09` ⚠️ pendiente).
- **Deploy:** este cierre se PUSHEA a `main` → Vercel lo publica.

**Remate de la noche (post-push):**
- **Invitaciones ∞ para admins** (`migration_11` ⚠️): al canjearse un código
  de un admin se le acuña otro — nunca baja de 6. La tarjeta muestra «∞».
- **Recuperar contraseña:** «¿Olvidaste tu contraseña?» en el login →
  `resetPasswordForEmail` (con Turnstile) → el correo aterriza en
  `/auth/callback?next=/restablecer` → `/restablecer` (gateada) pide la
  nueva con ojo y `updateUser`. OJO: los correos salen por el SMTP default
  de Supabase (≈2-4/hora) hasta configurar Resend. Verificado en preview:
  modo forgot renderiza; el flujo E2E real necesita el correo.
- **El ojo del password ya no cierra el teclado móvil** (preventDefault en
  pointer/mousedown: el botón no roba el foco). Verificado el toggle.
- **Temas Ambiental y Rants** (`migration_12` ⚠️).
- Skills evaluadas: webapp-testing (sí — para E2E Realtime con 2 navegadores,
  instalar con /plugin) · Ponytail (solo su review puntual; sus reglas
  always-on chocarían con CLAUDE.md).

**👉 Julio — SQL Editor:** correr `migration_11` (invitaciones ∞ admin) y
`migration_12` (temas nuevos). 09 y 10 ya corrieron. Luego: perfil → tarjeta
de invitaciones, y `/admin` para el panel.

**Pendiente de verificar en prod:** prompt de instalación PWA (Chrome
Android/desktop), aviso de versión en el PRÓXIMO deploy, invitación E2E con
un amigo real (landing → registro → auto-follow), Realtime de DMs con dos
navegadores.

## Sesión 4 (cont.) — Explorar + Admin + mensajería verificada

- **Mensajería VERIFICADA E2E en vivo** (migration_07 ya corrida por Julio):
  como demodos → botón «Enviar mensaje» en @julio → el RPC creó el DM →
  mensaje de texto enviado → burbuja saliente grana → persiste tras reload →
  la bandeja lista la conversación con preview y hora. Quedó un DM de prueba
  demodos→julio («Hola Julio — primer DM de la historia de FlowPub…»); se
  limpia solo con la migración 06 (cascada al borrar demodos). Falta solo
  probar Realtime con DOS navegadores a la vez y la nota de voz con mic real.
- **Copy del OG a 3 min** (decisión de Julio) + **fix**: la home sobreescribía
  el metadata, así que compartir flowpub.lat mostraba el copy del feed; ahora
  og:/twitter: de `/` usan la tarjeta de marca (title Speak/Flow/Publish +
  copy + summary_large_image) y el `<title>` sigue siendo del feed (SEO).
- **`/explorar` (nuevo, público):** buscador server-rendered (`?q=`) — Flows
  por título/cuerpo (ilike saneado para el `or()` de PostgREST) y voces por
  nombre/usuario con estado real de seguir; sin búsqueda: grid de los 12
  temas con conteos → `/tema/[slug]` + voces nuevas. `data/exploreApi.ts`.
  `FollowButton` extraído a `components/social/` (lo comparten riel y
  Explorar). Verificado en vivo (conteos, singular/plural, «barro», «julio»).
- **`/admin` (nuevo, milestone 8):** gate doble (middleware sesión + página
  role=admin; la RLS re-exige is_admin() al escribir). Secciones: Resumen
  (métricas reales + Flows/día 7d + temas activos %), Flows (tabla + buscar +
  destacar/ocultar/republicar optimista), Usuarios (read-only; cambiar roles
  NO se puede desde el cliente a propósito — solo SQL/servidor), Temas
  (switch activo + añadir con slug saneado), Ajustes (registro abierto,
  idioma/tema default, duración máx, temas por Flow → parches jsonb a
  `settings`; estado de integraciones; switch beta de UI generativa).
  **`migration_08_admin.sql`** (⚠️ pendiente): te da el rol admin. Verificado
  en vivo el rebote de no-admin; **el panel en sí pruébalo tú tras la 08**.
  Copy del admin en español fijo (fundador); entra al barrido i18n fase 9.
- **Nota:** los Ajustes guardan en `settings`, pero el Composer aún lee su
  `MAX=180` hardcodeado — cablear límites dinámicos desde `settings` es
  pendiente chico para cuando muevas esos valores de verdad.

**👉 Julio — SQL Editor:** 05, 07 y 08 **ya corrieron** (julio = admin,
verificado). La **06 falló y SE REVIRTIÓ COMPLETA** (los demos siguen): el
`DELETE` directo a `storage.objects` ya no se permite (trigger
`storage.protect_delete()` de Supabase — exige la Storage API) y el SQL Editor
corre todo en una transacción. **Arreglada:** el paso 4 ahora solo LISTA los
huérfanos. → **Re-corre `migration_06`** y luego, para borrar los archivos
huérfanos de Storage: `node scripts/limpia-storage.mjs` (dry-run) y
`node scripts/limpia-storage.mjs --borra` (usa la service role de .env.local).
Tras la 06: entra a `/admin` y dale una vuelta con tu cuenta.

**Gotcha nuevo (no re-romper):** en Supabase ya NO se puede `delete from
storage.objects` por SQL — siempre Storage API (dashboard o service role).
Y un error en CUALQUIER statement del SQL Editor revierte el script entero.

## Sesión 4 — Mensajería (`/mensajes`, milestone 7)

**Hecho** (typecheck/lint/build verdes; UI verificada en vivo hasta donde
permite la BD sin la migración nueva):

- **Decisión de Julio aplicada:** el copy del OG bajó a «Graba hasta 3 minutos»
  (coincide con el tope real). El tope sigue en 3:00.
- **`supabase/migration_07_mensajeria.sql`** (⚠️ **pendiente de correr**):
  - RPC `get_or_create_dm(other uuid)` security-definer: halla o crea el DM 1:1
    atómicamente (evita conversaciones duplicadas por carreras).
  - Columnas `conversations.last_message_at` (orden de bandeja),
    `conversation_members.last_read_at` (no leídos), `messages.duration_s` (voz).
  - Trigger `bump_conversation` (last_message_at al insertar mensaje).
  - Policy `members_update` + grant de columna `last_read_at` (marcar leído).
  - Habilita Realtime en `public.messages` (el thread abierto recibe en vivo;
    la RLS `is_member` sigue mandando).
- **Capa de datos:** `data/messages.ts` (tipos puros + mapeo), `messagesApi.ts`
  (server: bandeja con último mensaje + no leídos, meta del thread, mensajes —
  todo con cascada tolerante a que la migración no haya corrido),
  `messagesClient.ts` (`getOrCreateDm`, enviar texto/voz reusando
  storage+`/api/transcribe`, marcar leído), hook `useConversationMessages`
  (suscripción Realtime + dedup por id del eco de los propios).
- **UI (`components/messages/`):** `MessagesShell` (desktop dos-paneles lista
  340px + thread; móvil lista o thread a pantalla completa como overlay fixed
  con botón «Volver»), `ConversationList` (buscador + items con avatar/último/
  hora/badge de no leídos), `MessageThread` (header + scroll + autoscroll +
  marcar leído), `MessageBubble` (texto in/out + voz con reproductor compacto
  temado grana/superficie + «Ver transcript»), `MessageComposer` (texto + nota
  de voz ≤90s, mismo pipeline que los comentarios de voz).
- **Rutas:** `/mensajes` (bandeja) y `/mensajes/[id]` (thread; si no soy
  integrante → redirige a la bandeja por RLS). Gateadas en el middleware.
- **`/@usuario`:** botón «Enviar mensaje» (no propio) → `get_or_create_dm` →
  navega al thread; degrada con aviso si la migración no ha corrido.
- **`AppShell`:** prop `flush` (mensajería maneja su altura, sin top bar/padding
  móvil); se quitó el punto grana **hardcodeado** de «Mensajes» en el nav (era
  placeholder; hoy no hay conteo real de DMs sin leer aún — pendiente menor).
- i18n `msg.*` + `profile.message` ES/EN.

**Verificado en vivo (sin migración):** `/mensajes` carga con estado vacío
correcto y **sin 500** (las lecturas toleran las columnas faltantes); layout
desktop de dos-paneles exacto (rail 236 + lista 340 + thread, altura completa);
botón «Enviar mensaje» aparece en perfiles ajenos y **degrada con gracia**
(muestra aviso) mientras el RPC no exista. **Pendiente de verificar tras la
migración:** enviar/recibir texto y voz, Realtime en vivo entre dos cuentas,
badges de no leídos, y el thread a pantalla completa en móvil. (No pude sembrar
una conversación de prueba: el guardrail de auto-mode bloquea escrituras con
service_role a producción — bien.)

**👉 Julio debe correr en el SQL Editor (en orden):** `migration_05`
(notificaciones), `migration_06` (limpieza — antes del beta), `migration_07`
(mensajería). Sin la 07, `/mensajes` vive pero vacío y «Enviar mensaje» avisa.

## Sesión 3, cierre — fluidez del Pub + pre-lanzamiento

## Sesión 3, cierre — fluidez del Pub + pre-lanzamiento

**Hecho** (typecheck/lint/build verdes; revisado con workflow multi-agente de
4 dimensiones + verificación adversarial, 8 hallazgos netos corregidos):

- **Lectura inline en el Pub:** el extracto de la FlowCard se expande al
  artículo completo ahí mismo (`FlowProse` con `demoteHeadings` para no
  invertir el outline h3→h2), con «Mostrar menos» + link al Flow completo.
  El botón de comentarios abre el panel inline (leer + comentar texto/voz sin
  salir del Pub): carga on-demand con `fetchCommentsClient`, merge por id si
  el usuario publica mientras carga, error ≠ vacío (reintenta al reabrir).
  Foco gestionado al alternar (el botón desmontado devolvía el foco a body) y
  `aria-controls`/`aria-expanded` en los toggles.
- **Capa de comentarios compartida:** el select + mapeo viven en
  `data/comments.ts` (`COMMENT_SELECT`, `mapCommentRow`); `commentsApi` (server)
  y `commentsClient` (browser) los reutilizan.
- **Edición de Flows propios** (título + artículo; el transcript NUNCA se
  edita): `data/flowsClient.ts` (`updateFlow`, RLS `flows_update` + privilegios
  de columna de migration_03 ya lo acotaban — cero SQL nuevo) +
  `FlowEditModal` reutilizado en 3 lugares: FlowCard (lápiz en la fila de
  acciones), perfil (botón sobre los tiles propios, variante sticker sobre
  portada / tokens sobre borrador) y FlowReader (botón «Editar Flow» donde iría
  Seguir). Optimista: FlowCard/FlowReader pintan local + `router.refresh()`;
  el perfil parchea los tiles con un mapa local mientras llega el refresh.
- **`supabase/migration_06_limpieza_demo.sql`** (pendiente de correr): borra
  TODOS los usuarios salvo `pentrexyl@gmail.com` (candado: aborta si esa
  cuenta no existe), los 6 Flows demo, conversaciones huérfanas y archivos
  de Storage de uids muertos. Las cascadas + triggers dejan contadores bien.
- **OpenGraph:** title `FlowPub | Speak, Flow, Publish` + description nueva
  (dictada por Julio), `twitter:summary_large_image`, `og:locale es_MX` +
  alternate `en_US`, y **`src/app/opengraph-image.tsx`**: PNG 1200×630
  generado en build con satori (vírgula + wordmark Flow itálica + «Speak ·
  Flow · Publish» + chip flowpub.lat, paleta de marca). Fuentes TTF locales en
  `src/app/_og/` (Fraunces 500 normal/itálica + Hanken 600). Verificada la
  imagen renderizada. ⚠️ **Decisión pendiente de Julio:** la description dice
  «hasta 9 minutos» (su copy) pero el tope real es 3 min (migration_03 bajó
  9:00→3:00; el diseño original SÍ era 09:00) — o se ajusta el copy o se
  regresa el tope a 9 min (Composer MAX + settings + filtro del Pub).

**👉 Julio debe correr en el SQL Editor (en orden):** `migration_05`
(notificaciones) y `migration_06` (limpieza — ANTES de invitar a los compas).

**Pendiente de dashboard (Julio) — Resend y Google branding:** ver el mensaje
de cierre de la sesión 3: SMTP de Resend en Supabase Auth + dominio verificado
en Resend (DNS en Namecheap), y branding del consent de Google en Google Cloud
(el «syesetjvlhfbniicdgeg.supabase.co» solo se quita con Custom Domain de
Supabase, de paga).

## Sesión 3, última tanda — `/notificaciones` completo

**Hecho** (typecheck/lint/build verdes; **sin verificar en vivo** — otra sesión
tenía el dev server tomando el puerto 3000 y Next bloquea un segundo server en
el mismo directorio por el lockfile de `.next/`, incluso en otro puerto):

- **`supabase/migration_05_notificaciones.sql`** (nueva, pendiente de correr):
  fan-out por triggers `security definer` — `likes` → dueño del Flow/comentario,
  `follows` → seguido, `comments` → dueño del Flow + dueño del comentario padre
  (reply) + menciones `@usuario` en el texto (regex sobre `body_text`, cruza
  contra `profiles.username`), `flows` → seguidores del autor al publicarse
  (insert o transición de `status` a `published`). Nunca te notificas a ti
  mismo. Cierra el privilegio de columna: `authenticated` solo puede tocar
  `read` (patrón ya usado en `profiles`).
- **`data/notificationsApi.ts`** (server): `fetchNotifications()` trae items +
  actor + Flow + comentario relacionado (un solo `select` con embeds; sin hint
  `!` porque cada FK de `notifications` apunta una sola vez, a diferencia de
  `flows`/`comments`), enriquece `followingActor` en lote.
- **`data/notificationsClient.ts`** (client): `markNotificationRead`,
  `markAllNotificationsRead`, `fetchUnreadNotifCount`.
- **`components/notifications/`**: `NotificationsView.tsx` (tabs Todas/Sin
  leer, agrupado Hoy/Esta semana/Antes, fondo `grana-wash` en no-leídas,
  click marca leído y navega —al Flow o al perfil del actor—, botón Seguir
  inline, bloque de voz con `AudioPlayer` real + «Ver transcript», portada
  mini para Flows nuevos vía `<Cover>`) + `useUnreadCount.ts` (hook del punto
  de la campana).
- **Iconos de tipo por avatar:** mapeados a tokens existentes (nunca hex
  nuevo) — like `grana`, voz `grana-700`, comentario/mención `ocre`, seguir/
  Flow `ink`. El handoff pedía un azul custom para seguir/mención que **no**
  está en la paleta bloqueada de CLAUDE.md; se sustituyó por `ink` a propósito
  (discrepancia documentada en `design-map.json`, no es un error).
- **`AppShell`**: la campana (móvil) y el ítem del riel (desktop) ahora
  muestran el punto solo si hay notificaciones sin leer de verdad (antes era
  un punto hardcoded siempre visible).
- **`middleware.ts`**: `/notificaciones` gatea igual que `/componer` (sin
  sesión → `/entrar?next=/notificaciones`).
- i18n: catálogo `notif.*` completo ES/EN.

**👉 Julio debe correr en el SQL Editor:**
3. `supabase/migration_05_notificaciones.sql` — sin esto la tabla
  `notifications` sigue vacía (existe desde antes, pero nada la llena): la
  pantalla carga bien pero no verás actividad real hasta correrla.

**Pendiente de verificación en vivo** (siguiente sesión, o ahora si hay puerto
libre): login real → dar like/seguir/comentar desde otra cuenta → confirmar
que aparece en `/notificaciones`, que «Marcar todo como leído» limpia el
fondo y el punto de la campana, y que el filtro «Sin leer» esconde bien los
grupos vacíos. También pendiente: `.claude/launch.json` quedó con
`"autoPort": true` (antes fallaba si el puerto 3000 estaba ocupado).

## Sesión 3 — auditoría + ronda de features (Fable 5)

**Hecho y verificado en vivo** (typecheck/lint/build verdes):

- **Marca viva:** `<FlowMark>` por default se dibuja al aparecer, respira y se
  inclina al hover (clases `fp-mark-*` en globals). Reduced-motion safe.
- **Portadas con capa oscura:** tokens `--cover-*` (canvas/figura/línea/grano
  voltean por tema; acentos fijos). Regla actualizada en CLAUDE.md.
- **Radio Autoplay** (`providers/RadioProvider.tsx`, alcance PubFeed): al
  terminar un audio suena el siguiente Flow con audio; solo uno a la vez;
  scroll suave a la tarjeta. Verificado E2E (encadenado + pausa cruzada).
- **Velocidad 1×/1.5×/2×** en AudioPlayer (real `playbackRate` + mock).
- **3 minutos máximo** (`MAX=180` composer + settings + `migration_03`).
- **Filtros nuevos del Pub:** temas en rail deslizable (tags REALES de la BD,
  con fade en bordes) + menú de duración ≤15/30/60/90/120/150/180 s.
- **SEO completo:** metadataBase/OG/canonical, `sitemap.ts`, `robots.ts`,
  hubs **`/tema/[slug]`** (H1+copy+CollectionPage), JSON-LD Article+AudioObject
  en el Flow, links internos (kicker→tema, trending→tema). Plan: `docs/seo.md`.
- **Fixes de la auditoría multi-agente** (los verificadores toparon con el
  límite de sesión; el triage lo hice a mano sobre los hallazgos):
  - _Seguridad:_ APIs de Gemini exigen sesión (401 anónimo — verificado);
    privilegios de columna: nadie se auto-promueve a admin ni infla contadores
    (`revoke/grant update` por columna); `members_insert` ya no deja colarse a
    conversaciones ajenas; callback OAuth sanea `?next=` (solo rutas internas).
  - _Honestidad del pipeline:_ sin transcript NO se finge contenido (aviso y
    regresa a grabar); si el pulido falla, el cuerpo = transcript crudo; si la
    subida de audio falla, se avisa; el editor muestra el transcript REAL.
  - _Datos:_ `fetchFlows` con límite 60 + errores logueados; `cache()` en
    fetchFlow/fetchTags (una consulta por request); fallo de tags al publicar
    ya no invita a duplicar el Flow.
  - _A11y:_ aria-labels en bottom nav / inputs del composer / comentario;
    aria-pressed en toggles segmentados; errores con role="status".
- **Primer Flow real de Julio publicado** (con audio, @julio). El Pub vive.

**👉 Julio debe correr en el SQL Editor (en orden):**
1. `supabase/migration_03_radio_y_hardening.sql` — tope 3 min + duraciones demo
   bajo el tope + hardening. Sin esto, el filtro de duración deja fuera a los 6
   Flows demo (duran >3 min).
2. `supabase/migration_04_interacciones.sql` — tabla `saves` (guardados) +
   `comments.duration_s` (voz). El código tiene cascada tolerante y funciona sin
   ella, pero «Guardar» no persiste y los comentarios de voz salen sin duración.

## 🚀 EN PRODUCCIÓN — https://flowpub.lat (sesión 3, cont. 2)

- **Deploy vivo en Vercel** (repo `flowpubcom/flowpub`, público, rama `main` =
  producción; push = deploy). Dominio `flowpub.lat` por registro A en Namecheap
  (`@` → la IP que indique Vercel). Env vars puestas por Julio en el dashboard.
- **Tropiezos resueltos del primer deploy** (para no repetir):
  1. Credencial de GitHub equivocada en Windows (era de otra cuenta) → `cmdkey
     /delete` y re-login como `flowpubcom`.
  2. Hobby plan bloquea repos privados con autor de commit distinto → repo
     **público** (verificado antes: cero secretos en el historial).
  3. Framework Preset quedó "Other" al importar → cambiarlo a **Next.js** en
     Build and Deployment (si no, busca carpeta `public` y falla).
  4. **PGRST201**: al nacer `saves` (migración 04) hubo >1 relación
     flows↔profiles y comments↔profiles; TODOS los embeds de profiles llevan
     ahora el hint **`!author_id`**. Regla: al crear una tabla puente nueva
     hacia profiles, revisar los embeds existentes.
- **Migraciones 03 y 04: corridas** (saves existe en prod). Turnstile y Resend:
  Julio ya tiene las llaves (en Vercel y .env.local); integración = siguiente fase.
- **Pendiente de dashboard (Julio):** Supabase → Auth → URL Configuration:
  Site URL = `https://flowpub.lat` y agregar `https://flowpub.lat/**` a
  Redirect URLs (sin esto el login NO funciona en el dominio). Google Cloud:
  agregar `https://flowpub.lat` a Authorized JavaScript origins.

## Sesión 3 (cont.) — Olas 1+2: todo lo maquetado ahora FUNCIONA

**Ola 1 — interacciones reales** (verificado E2E contra Supabase):
- **Likes** de Flows y comentarios: persisten (`data/engagement.ts`), estado
  inicial enriquecido server-side, optimista con revert, invitado → /entrar.
- **Seguir**: real en byline del Flow, riel y perfil; oculto en lo propio.
- **Guardar** (`saves`, privado) y **Compartir** (Web Share API → clipboard).
- **Comentarios de VOZ**: grabar → Storage → Gemini STT → insert (audio +
  transcript sin pulir + duración). Verificado E2E con voz TTS: transcripción
  palabra por palabra, persiste tras reload. Tope 1:30.
- **Traducir** en el Flow abierto (la ruta ya existía): verificado en vivo
  (el Flow de Julio en inglés), nota «Traducido con Gemini» + «Ver original».
- **Riel derecho real**: trending por conteo de `flow_tags`, voces sugeridas de
  `profiles` reales con sus temas y estado de seguir.
- **Guardar borrador**: persiste `status='draft'` → aparece en el perfil propio.

**Ola 2 — perfiles** (pixel per Perfil.dc.html; verificado en vivo):
- **`/@usuario`** (`app/[username]/`, valida el prefijo @): banner generativo
  sembrado por username, avatar traslapado, bio serif, chips de temas, stats
  REALES (flows/seguidores/siguiendo), tabs Flows · Me gusta · Borradores
  (borradores solo el dueño), grid de mini-portadas 16:11, JSON-LD ProfilePage.
- **Editar perfil** (modal): nombre/usuario/bio + **subir foto** al bucket
  `avatars`; si cambia el username, redirige al nuevo. Verificado (bio editada
  y persistida).
- **`/perfil`** → redirige al propio (o a /entrar).

**Datos de prueba que quedaron** (bórralos si quieres): un like y un follow de
demodos a Julio, y un comentario de VOZ sintética de demodos en el Flow de
Julio («Qué bonito quedó este Flow…» — el primer comentario de voz de la
historia de FlowPub, transcrito por Gemini).

**Pendiente (siguiente sesión): Ola 4** — ✅ `/notificaciones` (hecho, ver
arriba) · `/mensajes` (Realtime, milestone 7) · `/explorar` (sin .dc.html:
definir con Julio) · `/admin` (milestone 8) · respuestas anidadas a
comentarios (parent_id ya existe en BD, y `notify_on_comment` ya sabe
notificar al padre — falta la UI de threading).

**Pendientes que dejó la auditoría (colita):** paginación real del feed ·
cachear páginas públicas (cliente sin cookies + revalidate) · og:image por Flow
· slugs legibles en /flow · focus-trap completo en Modal · barrido i18n de
strings hardcodeados (fase 9) · bucket audio es público por diseño (revisar
cuando lleguen los DMs de voz).

## En una frase

Loop central completo con datos mock (sesión 1). **Sesión 2: backend cableado y
Milestone 2 (Auth email/password + onboarding) COMPLETO y verificado en vivo**
contra Supabase real (registro → 3 temas → perfil → sesión → compuerta abierta).
**Siguiente: Google OAuth + swap de lecturas mock→Supabase + pipeline Gemini.**

## Hecho — sesión 1 (commiteado, build verde, verificado)

| Commit | Qué |
|---|---|
| `5995f76` | **Fundación**: Next 16 + React 19 + TS + Tailwind v4; tokens claro/oscuro; marca; librería base; providers Theme/Sound/I18n; `/styleguide`. |
| `606b10c` | **El Pub** (`/`): shell responsive, FlowCard, filtro de tags, riel derecho, auth-gate, datos mock. |
| `b12af5d` | **Grabar un Flow** (`/componer`): máquina de 5 pasos con IA simulada. |
| `5c0b4e9` | **Flow abierto** (`/flow/[id]`): lectura + transcript + audio + comentarios texto/voz. |
| `854d041` | **Backend scaffolding**: clientes Supabase, middleware (inerte sin env), `schema.sql`. |

## Hecho — sesión 2 (⚠️ EN EL WORKING TREE, SIN COMMITEAR — Julio decide cuándo)

- **Arreglado `.env.local`:** la `NEXT_PUBLIC_SUPABASE_URL` traía `/rest/v1/` de más
  (era el endpoint REST, no el Project URL). Ya conecta al proyecto `syesetjvlhfbniicdgeg`.
- **Descubierto:** el proyecto Supabase tenía 3 tablas legacy **vacías**
  (`comments`/`likes`/`messages`) de un experimento previo que **chocan** con nuestros
  nombres. → Nueva **`supabase/migration_00_cleanup_legacy.sql`** (tira solo si tienen
  forma legacy; segura e idempotente).
- **Esquema ampliado** (`supabase/schema.sql`): tabla **`profile_tags`** (intereses del
  usuario del onboarding) + columna **`profiles.onboarded`** + sus políticas RLS.
- **Milestone 2 — Auth + onboarding (código completo; typecheck/lint/build verdes):**
  - `AuthProvider` real (sesión Supabase + perfil → `SessionUser`; `refresh`/`signOut`).
  - Ruta **`/entrar`** (server: trae tags, redirige a onboarded) + `components/onboarding/`
    (`Onboarding.tsx` máquina de 4 pasos **auth → temas(3) → perfil → listo**,
    `BrandHypnotic.tsx` panel de blobs/anillos/marca). Email/password + botón Google.
  - `data/tags.ts` (tipo+`tagName` puros) · `data/tagsApi.ts` (`fetchTags` server) ·
    `data/profileApi.ts` (`completeOnboarding`, `isUsernameAvailable`).
  - `app/auth/callback/route.ts` (OAuth + confirm email).
  - `middleware.ts` ahora **gatea `/componer`** (sin sesión → `/entrar?next=`).
  - `AppShell` abre la compuerta si `!user`; barra móvil con avatar real / «Inicia sesión».
  - i18n: catálogo de onboarding completo (ES+EN). globals.css: keyframes
    `fp-blob1/2/3`, `fp-spin`, token `--brand-abyss`.
  - **Verificado en vivo E2E** contra Supabase real: registro email/password → el trigger
    crea el perfil → 3 temas (tags reales) → perfil (usuario con check de disponibilidad)
    → escribe `profiles`+`profile_tags`+`onboarded` → sesión → `/componer` accesible →
    onboarded en `/entrar` redirige a `/`. Claro/oscuro y desktop/móvil OK, cero errores.
    (Screenshots se atoran por animaciones infinitas → usar `inspect`/`snapshot`/`eval`.
     El click sintético del preview NO lo cacha React: usar `.click()`/setter nativo vía `eval`.)

## ✅ Milestone 2 — Auth + onboarding: HECHO y verificado

- SQL corrido (`migration_00_cleanup_legacy.sql` + `schema.sql` con el fix de orden de
  `is_admin()`). **"Confirm email" apagado** en el dashboard (dev).
- Usuarios de prueba en el proyecto: `demo1` (sin confirmar, inofensivo) y `demodos`
  (onboarded, 3 intereses). Bórralos desde Authentication → Users si quieres limpiar.
- **Cambios en el working tree SIN commitear** — Julio decide cuándo.
- **Pendiente de dashboard para prod:** reactivar "Confirm email" + Resend cuando toque.
- **Pendiente en `.env.local`:** `GEMINI_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
  (no bloquean auth; sí el pipeline de Gemini y ops admin server-side).

## Lo que sigue (Claude)

1. ✅ **Google OAuth** — configurado en Google Cloud + Supabase y verificado a nivel
   endpoint (`authorize?provider=google` → 302 a accounts.google.com con el client_id).
   Código ya estaba (botón + `/auth/callback`). Falta solo el click-through humano de Julio.
2. ✅ **Pub con datos reales** — seed (`migration_01_seed_demo.sql`: 6 autores demo +
   6 Flows) + `data/flowsApi.ts` (`fetchFlows`/`fetchFlow`, mapeo a `Flow`, embeds
   autor+tags). El Pub (`/`) y Flow abierto (`/flow/[id]`) ahora leen de Supabase
   (dinámicos). Verificado en vivo: 6 tarjetas con autor/tiempo/tag, Flow abre desde BD.
   De paso, **fix de hidratación en `Cover`** (ver notas).
3. ✅ **Composer publica a Supabase** (`data/publishApi.ts`: `flows`+`flow_tags`, mapeo de
   nombres→ids) + **comentarios de texto reales** (`commentsApi.ts` lee server-side,
   `commentsClient.ts` postea; gate de sesión; el trigger mantiene `comment_count`).
   Verificado E2E: publicar un Flow (aparece en el Pub) y comentar (persiste tras reload).
   `migration_02_seed_comments.sql` (opcional) alinea contadores + siembra comentarios demo.
4. ✅ **Gemini — pulido + traducción** (`lib/gemini.ts` server-only, `/api/polish`
   raw→título/markdown/tags con salida estructurada, `/api/translate`). El composer pule
   con Gemini **real** (fallback al mock si falla). Modelo **`gemini-2.5-flash`**
   (`gemini-2.0-flash` tiene cuota 0 en esta llave); configurable con `GEMINI_MODEL`.
   Verificado con llamadas reales (pulido quita muletillas, mantiene la voz, tags de la lista).
5. ✅ **Audio real**: grabación con MediaRecorder (`useRecorder` real), subida al bucket
   `audio` (`data/storage.ts`, carpeta por uid para la RLS), `/api/transcribe` (Gemini STT).
   El composer encadena **grabar → subir → transcribir → pulir → publicar** con `audio_url`;
   el Flow abierto reproduce el audio real. Verificado E2E con stream sintético (webm subido
   a Storage y accesible + transcrito por Gemini); **falta solo tu prueba con micrófono real**.
6. **(SIGUIENTE)** botón **Traducir** en el Flow abierto (ruta `/api/translate` lista) ·
   comentarios de **voz** (grabar+subir+transcribir, igual que el composer) · transcript en
   vivo (opcional).
7. Google OAuth click-through (Julio) · Turnstile · Resend · pantallas placeholder ·
   likes/seguir reales · «Guardar borrador» (hoy solo navega, no persiste draft).
3. **Pipeline Gemini** (route handlers server-only): transcribe/polish/translate;
   cambiar `useRecorder`/`composeMock` por lo real. Subir audio a Storage.
4. **Turnstile** (signup/login, server-side) + **Resend** (correos).
5. Pantallas pendientes (placeholder 404 hoy): `/explorar` `/mensajes` `/notificaciones`
   `/perfil` `/@usuario`.

## Notas que cuestan caro (ya resueltas — no re-romper)

- **Boundary server/client:** `data/tagsApi.ts` / `data/flowsApi.ts` importan el cliente
  server (`next/headers`); NO los importes desde un Client Component. La parte pura (tipo +
  `tagName`) vive en `data/tags.ts`. Mismo patrón para futuras `*Api.ts`.
- **Gemini:** `gemini-2.0-flash` da **429 (cuota 0)** en el free tier de esta llave; usa
  `gemini-2.5-flash` (o `gemini-flash-latest`). La llave es formato nuevo `AQ.Ab8…`. Toda
  llamada a Gemini es **server-only** (`lib/gemini.ts` + route handlers), nunca en cliente.
- **Preview sin micrófono:** `getUserMedia` falla (se maneja con un error claro). Para probar
  el composer real ahí, parchea `navigator.mediaDevices.getUserMedia` con un oscilador
  (Web Audio → `MediaStreamDestination`) y drivéalo por eval. Gemini **acepta
  `audio/webm;codecs=opus`** (el formato de MediaRecorder en Chrome) — verificado.
- **Env nuevo → reinicia el dev server:** Next lee `.env.local` al arrancar. Si pegas una
  llave (p. ej. `GEMINI_API_KEY`) con el server corriendo, no la ve hasta reiniciar (en
  preview: `preview_stop` + `preview_start`).
- **Portadas (`Cover`) = render puro:** cada sub-portada crea su propio RNG desde el seed
  numérico dentro de su render. NO pases un RNG con estado como prop para consumirlo en el
  hijo: Strict Mode (dev) doble-invoca el hijo con el RNG ya avanzado → mismatch de
  hidratación SSR/CSR (portada distinta en server vs client). Ya corregido.
- **`create table if not exists` NO agrega columnas** a una tabla existente. Si `profiles`
  ya existiera sin `onboarded`, habría que un `alter table ... add column if not exists`.
  Hoy no aplica (se corre en limpio), pero tenlo presente al migrar.
- **Preview:** las animaciones infinitas del panel hipnótico atoran `preview_screenshot`.
  Verifica con `preview_snapshot`/`preview_inspect`/`preview_eval`.
- **Tema:** `@media (prefers-color-scheme)` para el default + `data-theme` para overrides.
- **Reglas duras:** secretos solo server-side · IA = **Gemini** · estilos **solo por tokens**
  · sin emoji · RLS en todo.

## Comandos

```bash
npm run dev        # :3000  (server "flowpub" en preview)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # next build
```

## Mapa rápido

- `CLAUDE.md` — guía operativa + design system vinculante.
- `docs/design-map.json` — verdad visual por pantalla.
- `design_handoff_flowpub/` — spec exhaustivo + referencias `.dc.html` (incl. `Onboarding.dc.html`).
- `supabase/` — `migration_00_cleanup_legacy.sql` → `schema.sql` (correr en ese orden).
