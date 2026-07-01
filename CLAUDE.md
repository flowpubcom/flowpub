# CLAUDE.md — Guía operativa de FlowPub

Brief que Claude Code lee al arrancar cada sesión. Lo **operativo** vive aquí. El
**spec exhaustivo** vive en `design_handoff_flowpub/README.md`, la **verdad visual por
pantalla** en `docs/design-map.json`, y las **referencias hi-fi** en
`design_handoff_flowpub/designs/*.dc.html`.

> **Cuándo me sirve:** comandos, arquitectura, el design system *vinculante* y los gotchas
> que cuestan caro. Si un dato no está aquí, búscalo en el handoff o en el código —
> **nunca inventes** colores, tokens, copy ni datos.

---

## Qué es FlowPub

App social **voice-first**: la voz que se vuelve publicación. La unidad de contenido es un
**Flow**: tocas grabar → hablas → Gemini transcribe → Gemini pule el transcript en un
**artículo markdown** → se genera una **portada abstracta 16:9**. El Flow publicado muestra
la versión pulida pero **siempre expone el transcript crudo**. Cualquiera navega el timeline
(**el Pub**); solo usuarios registrados publican. Los Flows se comentan (**texto o voz** — los
de voz siempre ofrecen «Ver transcript»), se les da like y se comparten. Perfiles, seguir
mutuo, **mensajería privada** (texto + voz), notificaciones, panel de control admin.
Bilingüe **ES/EN** (auto del SO), tema **claro + oscuro**. Dominio: **flowpub.lat**.

**Norte:** evolucionar hacia **UI generativa** — un LLM orquesta la presentación de cada Flow
(ritmo, énfasis, escala tipográfica) desde su contenido, **con la marca constante**. Por eso:
todo manejado por **tokens + un set chico de componentes componibles**, contenido separado de
layout. Lo que puede variar es *ritmo y escala*; **nunca** la paleta ni la marca.

## Stack (no sustituir sin preguntar)

**Next.js (App Router) + React + TypeScript** en **Vercel** · **Supabase** (Postgres + Auth +
Storage + Realtime + RLS) · **Google OAuth + correo** · **Resend** (correo) · **Cloudflare
Turnstile** (signup/login) · **Google Gemini** (STT, pulido, portada/translate). Estilos con
**Tailwind v4** (tokens como CSS variables) — ver Convenciones. Gestor: **npm**.

## Comandos

> Montado con **Next.js 16** (App Router, Turbopack). El loop central va front-first;
> falta cablear el backend. **Dónde nos quedamos: `ESTADO.md`.**

```bash
npm run dev          # next dev (Turbopack, :3000)
npm run typecheck    # tsc --noEmit — CORRE ESTO antes de dar por hecho un cambio
npm run lint         # eslint
npm run build        # next build (compila + chequea tipos de rutas)
npm run start        # next start (sirve el build)
```

- **Backend:** las **migraciones SQL y el deploy de Edge Functions los corre Julio** a mano
  (yo escribo el SQL/código). El SQL vive en `supabase/` (`schema.sql` + `migration_*.sql`
  idempotentes).
- **Deploy del front:** lo hace **Vercel** (push a la rama / `vercel`). Julio decide cuándo.
- **Verificación visual:** usa las herramientas `preview_*` (NO Bash para servidores). El
  servidor en `.claude/launch.json` se llamará **`flowpub`** (no «dev»), puerto **3000**.

## Mapa del código (estructura objetivo)

- `app/` — App Router. Rutas públicas (`/`, `/flow/[id]`, `/@usuario`) + privadas
  (`/componer`, `/mensajes`, `/notificaciones`, `/perfil`, `/admin`) + `app/api/*` (route
  handlers server-side: transcribe / polish / cover / flows / translate / turnstile).
- `components/` — UI por feature + la **librería base** (Button, Chip, Avatar, Card,
  AudioPlayer[vírgula], Switch, Slider, Modal, Cover). **Recrear los `.dc.html` pixel-accurate
  con estos componentes**, no copiar el HTML.
- `lib/` — clientes y utilidades: `supabase/` (browser + server + middleware), `gemini.ts`
  (server-only), `i18n/`, `theme.ts`, `sound.ts` (WebAudio), `covers/` (templates SVG
  paramétricos), helpers (slug, fecha, markdown).
- `providers/` — Theme, Sound, I18n, Auth, Realtime (Client Components que envuelven el árbol).
- `styles/` — `globals.css` con la capa de tokens (`@theme`) + la capa semántica clara/oscura.
- `supabase/` — `schema.sql` + `migration_*.sql` + Edge Functions.
- `design_handoff_flowpub/` — el handoff (referencias, NO se borra). `docs/design-map.json` —
  el mapa estructurado por pantalla (tokens reales, componentes, interacciones, copy).

## Convenciones

- **Comentarios y copy de UI en español** (registro mexicano: cálido, llano, un poco íntimo).
  El **código (identificadores) en inglés**. Escribe código que se lea como el de junto.
- **i18n:** se traduce **solo el chrome** (interfaz). El **contenido de un Flow se queda en su
  idioma**; se ofrece un **«Traducir»** opt-in por Flow (Gemini). Detecta de `navigator.language`
  / `Accept-Language` (`es*`→ES, si no EN), permite override, fija `<html lang>`. Catálogo
  semilla = keys de `designs/Idiomas.dc.html` (`nav.*`, `record`, `t.*`, `audio`, `ago`…).
- **Estilos:** **solo por tokens** (CSS variables `--*`). **Nunca hardcodees hex** fuera de la
  capa de tokens. Tematizado por capa semántica que voltea en `[data-theme="dark"]` (persiste
  `localStorage('fp-theme')`, **default = SO**). No invertir en bloque: mapea roles (bezels y
  acentos **no** cambian entre temas; las **portadas** tienen su propia capa clara/oscura vía
  tokens `--cover-*`: canvas/figura/línea/grano voltean, acentos grana/ocre/champagne fijos).
- **Sin emoji** en ningún lado. La única «emoji» de la marca es la **vírgula / gota dorada**.
- **Datos:** nada de SQL en componentes — pasa por `lib/` y los route handlers. Columnas nuevas:
  léelas con cascada tolerante (reintenta sin la columna si el esquema no la tiene aún).
- Antes de tocar un archivo, **léelo**. Antes de borrar/sobrescribir algo que no creaste, mira
  qué es y avisa si no cuadra.

## Reglas duras

- **IA = Google Gemini.** STT, pulido, portada y traducción. **El proyecto NO usa Anthropic.**
- **Todos los secretos y llamadas a Gemini corren en el servidor** (route handlers / Edge).
  **Nunca** expongas claves al cliente. `NEXT_PUBLIC_*` es **solo** para valores públicos
  (Turnstile site key, URL/anon key de Supabase, VAPID public).
- **RLS en TODAS las tablas.** Default-deny; políticas explícitas, probadas.
- **`grana` (#C0303A) está reservado** para: grabar, publicar, like-activo, ahora-sonando,
  CTAs primarios y focus ring. **Nada más es rojo.**
- **El handoff (`design_handoff_flowpub/`) es la fuente de verdad del diseño.** No inventes
  tokens, medidas ni copy: están en el README / `design-map.json`.

## Design system (vinculante)

**Paleta — «tinta, grana y amate» (códice mesoamericano).** `tinta #1A1714` (texto/tinta),
`grana #C0303A` (acento), `grana-700 #9A2530`, `grana-wash #F6E6E4`, `ocre #D98A3D`,
`amate #F2EFE8` (lienzo), `amate-2 #E6DFD0`, `papel #FBFAF6` (cards), `texto-sec #6E685D`,
`texto-mute #9C968A`, `linea rgba(26,23,20,.12)`, `linea-fuerte rgba(26,23,20,.24)`,
`ok #2E9A5B`. Karaoke (palabra activa): **champagne `#F6D49A`** con glow.

**Capa oscura** (voltea en `[data-theme="dark"]`, mapeo de roles — tabla completa en el README):
`--ink #1A1714↔#F2EFE8`, `--ink-on #F2EFE8↔#1A1714`, `--surface #FBFAF6↔#1E1A16`,
`--surface-2 #F8F5EF↔#191510`, `--surface-3 #F2EFE8↔#2A241D`, `--text-2 #6E685D↔#B3AB9D`,
`--text-3 #9C968A↔#867F72`, `--glass rgba(251,250,246,.82)↔rgba(20,17,14,.72)`,
`--grana-wash #F6E6E4↔rgba(192,48,58,.18)`; líneas → `rgba(242,239,232,*)`. Acentos
(grana/ocre) y bezels **fijos**; las portadas voltean su lienzo con los tokens `--cover-*`
(`--cover-canvas #F2EFE8↔#262019`, `--cover-shadow #1A1714↔#0E0C0A`,
`--cover-line #1A1714↔#F2EFE8`, `--cover-night #1A1714↔#12100D`, grano multiply↔soft-light).

**Tipografía:** **Fraunces** (serif = *la voz*: títulos, cuerpo del artículo, transcripts,
iniciales de avatar en itálica; pesos 400/500, optical sizing). **Hanken Grotesk** (sans = *el
chrome*: UI, botones, labels; 400/500/600). **Space Mono** (mono = *los datos*: duraciones,
contadores, timestamps). Eyebrows: 11–12px 600 uppercase, letter-spacing .12–.16em.

**Espaciado** base-4 (`4 8 12 16 24 32 48 64 96`). **Radios:** card 16, pill 999, md 8, lg 14,
icon-tile 24; teléfono pantalla 42 / bezel 52; ventana desktop 18.

**Movimiento:** easing `cubic-bezier(.22,1,.36,1)`, duraciones **140/240/320ms**, **sin bounce**.
Ambiente sutil: partículas a la deriva (`fp-drift` 11–16s), el logo «respira» (`fp-breathe` 6s).
Reproductor (cover viva): `fp-ripple/fp-glow/fp-aperture/fp-shard/fp-sheen/fp-rise/fp-eq/fp-spin`
togglados por `animation-play-state` paused↔running; karaoke `wordIndex = floor(elapsed/total ×
WORDS.length)` atado a `<audio>.timeupdate`. **Respeta `prefers-reduced-motion`** (apaga todo).

**Sonido** (no viene en `support.js`; constrúyelo como `SoundProvider` WebAudio): `blip(tipo)`
oscilador **sine**, envelope exponencial ~140ms — `rec 220Hz`, `pop 700Hz`, `click 400Hz`,
`soft 320Hz`, `tick 540Hz`. Gatear a gestos reales del usuario; **mute global** obligatorio.

**Marca (FlowMark):** vírgula monolínea (voluta de la palabra) — **un solo path SVG**,
`stroke=currentColor`, caps redondos (path exacto en el README). Wordmark «*Flow*Pub» (Flow
itálica). La marca está **viva** (default de `<FlowMark>`): se dibuja al aparecer
(`fp-mark-intro`), respira (`fp-breathe`) y se inclina al hover (`fp-mark-g`); todo se apaga con
`prefers-reduced-motion`. El **reproductor de audio es una línea-vírgula** que ondula, no un
waveform genérico; el progreso es un trazo grana vía `stroke-dashoffset`, con velocidad
1×/1.5×/2×.

**Portadas:** SVG abstracto 16:9 en 4 direcciones de arte (Escher/LeWitt isométrico · Turrell
apertura · Flavin neón · Lichtenstein/collage 90s), paleta bloqueada + grano `feTurbulence`.
**Preferir templates SVG paramétricos sembrados por Flow** (barato, on-brand, determinista) sobre
image-gen. Persistir `cover_kind` + `cover_svg`.

## Modelo de datos (Supabase) — columnas en el README

`profiles · tags · flows · flow_tags (máx 3) · comments (text|voice) · likes · follows ·
conversations · conversation_members · messages (text|voice) · notifications · settings`.
Buckets: `audio`, `avatars`, `covers`. Fan-out de notificaciones + mantener contadores con
triggers/Edge. **Un Flow dura ≤ 3 min** (`settings.limits.maxDurationSec=180`; el filtro de
duración del Pub corta en 15/30/60/90/120/150/180 s; la radio del Pub encadena los audios).
**Pipeline de publicación (server):** `transcribe` (audio→crudo, stream para vivo)
→ `polish` (crudo→markdown, conserva la voz, quita muletillas, **solo markdown**, mismo idioma,
sugiere título+tags) → `cover` (kind→SVG) → persistir `flows`. Comentarios/mensajes de voz:
guardar **audio + transcript sin pulir**.

## Orden de construcción (milestones)

1) **Fundación** (tokens + capa oscura, fuentes, FlowMark, componentes base, providers
   theme/sound/i18n) → 2) **Auth + onboarding** (Google + Turnstile + 3 tags + perfil) →
3) **El Pub** (feed + cards + filtro de tags) → 4) **Crear Flow** (record→transcribe→polish→cover
   →editar→publicar) → 5) **Flow abierto** (lectura, toggle transcript, audio, comentarios
   texto+voz) → 6) **Perfiles/seguir + Reproductor** (atar animación al `<audio>` real) →
7) **Mensajería + Notificaciones** (Realtime) → 8) **Admin + ajustes** → 9) **Pulido** (oscuro
   en todo, movimiento, sonido, a11y, i18n completo).

## Definition of done (por pantalla)

Igual al `.dc.html` en claro **y** oscuro; accesible por teclado con focus ring **grana** (nunca
azul default); `prefers-reduced-motion`-safe; targets ≥44px; **AA de contraste** (verificado **en
vivo**, no de memoria); strings en el catálogo i18n (ES+EN); **cero secretos en cliente**;
políticas RLS escritas y probadas.

## Gotchas que cuestan caro

- **`transform` ↔ `position: fixed`:** un ancestro con `transform`/`perspective` se vuelve el
  bloque contenedor de los hijos `fixed` y los **desplaza**. Si algo `fixed` aparece corrido,
  busca un `transform` arriba (típico en transiciones de ruta).
- **FOUC de tema (SSR):** aplica `data-theme` **antes de pintar** (script inline en `<head>`
  que lee `localStorage('fp-theme')` / `prefers-color-scheme`), o verás un flash claro→oscuro.
- **Updates optimistas:** like/seguir/contadores se pintan al instante; reconcilia con el
  servidor y revierte si falla. No bloquees la UI esperando el round-trip.
- **`backdrop-filter: blur` en headers sticky:** caro al hacer scroll en listas largas. Vigila
  performance (considera `will-change`).
- **Filtros SVG (`feTurbulence`/`feGaussianBlur`):** no rinden idéntico entre navegadores; prueba
  las 4 portadas y el glow en Chrome/Safari/Firefox.
- **`support.js` NO se porta.** Es el runtime que hace correr los `.dc.html` (componentes en
  streaming); el destino es React/Next nativo. Úsalo solo como referencia de comportamiento.
- **Screenshots del preview** se atoran en páginas con WebSocket de Realtime siempre activo
  (Mensajería/Flow autenticado). Verifica con `preview_inspect`/`preview_eval` (más fiables para
  tamaños/colores) — y **mide el contraste en vivo** antes de afirmar que algo cumple AA.
- **PowerShell 5.1 (Windows):** sin `&&`/`||`; encoding raro con acentos al llamar exes; para
  servidores usa las herramientas `preview_*`, no Bash.
- **Secretos:** jamás en `NEXT_PUBLIC_*` (se hornean en el bundle público).

## Memoria y handoff

- **Dónde nos quedamos / cómo seguir:** `ESTADO.md` (handoff entre sesiones — léelo primero).
- **Spec exhaustivo:** `design_handoff_flowpub/README.md` (modelo de datos con columnas, tabla
  oscura completa, path del FlowMark, keys del diccionario i18n, detalle por pantalla).
- **Verdad visual por pantalla:** `docs/design-map.json` (tokens reales, componentes con medidas,
  interacciones, copy literal, estado/datos, gotchas) — consúltalo al construir cada pantalla.
- Si una nota menciona un archivo/flag, **verifica que siga existiendo** antes de fiarte.
