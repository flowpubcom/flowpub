# ESTADO — FlowPub (handoff entre sesiones)

> Dónde nos quedamos y cómo seguir. Léelo al retomar (junto con `CLAUDE.md`).
> Última actualización: **sesión 2 — 2026-07-01**.

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
