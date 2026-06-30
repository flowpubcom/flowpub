# ESTADO — FlowPub (handoff entre sesiones)

> Dónde nos quedamos y cómo seguir. Léelo al retomar (junto con `CLAUDE.md`).
> Última actualización: **sesión 1 — 2026-06-29**.

## En una frase

App montada **front-first** con el **loop central completo** (navegar → grabar →
leer → comentar), todo con **datos mock**. **Siguiente: cablear el backend
(Supabase + Gemini)** — estamos justo en la configuración (pasos abajo).

> ⚠️ La sesión 1 arrancó rooteada por error en `D:\Gulu\Webapp-claude`. Todo el
> trabajo se generó con rutas absolutas en `D:\FlowPub\app` (su propio repo git).
> Gulu quedó **intacto**. Esta sesión se abre ya en `D:\FlowPub\app` ✅.

## Hecho (todo commiteado, build verde, lint limpio, verificado en vivo)

| Commit | Qué |
|---|---|
| `5995f76` | **Fundación**: Next 16 + React 19 + TS + Tailwind v4; tokens claro/oscuro; marca FlowMark/Wordmark/Logo; librería base (Button, Chip, Avatar, Card, AudioPlayer-vírgula, Switch, Slider, Modal, Cover); providers Theme/Sound/I18n; `/styleguide`. |
| `606b10c` | **El Pub** (`/`): shell responsive (3 columnas desktop / top bar + bottom nav + FAB móvil), FlowCard, filtro de tags, riel derecho, auth-gate, capa de datos mock. |
| `b12af5d` | **Grabar un Flow** (`/componer`): máquina de 5 pasos (record→recording→processing→edit→published) con IA **simulada**; editor markdown (toolbar + preview react-markdown), TagPicker (≤3), portada regenerable. + fix de ESLint. |
| `5c0b4e9` | **Flow abierto** (`/flow/[id]`, SSG): lectura + toggle Publicación/Transcript, audio, engagement, **comentarios texto + voz**. |
| `854d041` | **Backend scaffolding**: clientes Supabase (`@supabase/ssr`), middleware (inerte sin env), `.env.example`, **`supabase/schema.sql`** (12 tablas + RLS + storage + triggers). |

## Rutas

- **Existen:** `/` (El Pub) · `/componer` · `/flow/[id]` · `/styleguide`.
- **Placeholder (404 por ahora):** `/explorar` · `/mensajes` · `/notificaciones` ·
  `/perfil` · `/@usuario`. (Pantallas de fases futuras.)

## Capa mock → puntos de swap a Supabase

- `src/data/mock.ts` (FLOWS, TAGS, CATEGORIES, perfiles) · `composeMock.ts` (IA
  simulada del composer) · `comments.ts`.
- `src/providers/AuthProvider.tsx` → hoy `user = null`. `src/lib/useRecorder.ts` →
  grabación simulada.
- **Al cablear backend:** crear `src/data/*Api.ts` que lean de Supabase y sustituir
  los imports de mock; `AuthProvider` → sesión real; route handlers para Gemini.
  Las portadas (`Cover`) ya son SVG reales (no cambian).

---

## 👉 SIGUIENTE PASO — configuración de Supabase (en curso)

**Julio YA tiene:** proyecto Supabase creado + **Gemini API key**. Quiere guía paso a paso.

**Lo que falta hacer (Julio):**
1. Del dashboard de su proyecto Supabase, sacar dos valores **públicos**:
   **Project URL** + la **API key pública** (`anon`/`public`, o la nueva
   `publishable` `sb_publishable_…`). La `service_role`/`secret` es para después.
2. Pegarlas en **`.env.local`** (ya existe, vacío, gitignored):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`.
   **Los secretos NUNCA en el chat** — directo al archivo.
3. Correr **`supabase/schema.sql`** en el SQL Editor (es idempotente).

**Lo que sigue (Claude), una vez existan las claves:**
1. Reiniciar el dev server (lee `.env.local` al arrancar; el middleware se activa).
2. **Email auth + onboarding** (registro/login + elegir 3 tags + perfil).
3. Cambiar las **primeras lecturas** (El Pub, Flow abierto) de mock → Supabase
   (`src/data/*Api.ts` con cascada tolerante a columnas).
4. **Google OAuth** (Supabase → Auth → Providers → Google, con OAuth de Google Cloud).
5. **Pipeline Gemini** en route handlers server-only (`/api/flows/transcribe`,
   `/polish`, `/translate`) — cambiar `useRecorder`/`composeMock` por lo real.
6. **Turnstile** (signup/login) + **Resend** (correos). Subida de audio a Storage.

## Notas que cuestan caro (ya resueltas — no re-romper)

- **Tema:** `@media (prefers-color-scheme)` para el default del SO + `data-theme`
  explícito para overrides. **Sin `<script>` anti-FOUC** (consola limpia). Default = SO.
- **ESLint:** flat config **nativo** (`eslint.config.mjs`) con parser TS + plugin de
  Next; `FlatCompat` rompía con ESLint 9/10 (ciclo en el plugin de React). eslint fijado a `^9`.
- **Preview:** server **`flowpub`** (puerto 3000) en `.claude/launch.json`. dpr 1.5 hace
  ver chicos los screenshots — **medir en vivo** con `preview_eval`/`inspect`, no fiarse de la captura.
- **Reglas duras:** secretos solo server-side · IA = **Gemini** (no Anthropic) · estilos
  **solo por tokens** · sin emoji · RLS en todo. (Detalle en `CLAUDE.md`.)

## Comandos

```bash
npm run dev        # :3000  (server "flowpub" en preview)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # next build (compila + chequea tipos)
```

## Mapa rápido

- `CLAUDE.md` — guía operativa + design system vinculante.
- `docs/design-map.json` — verdad visual por pantalla (tokens, componentes, copy).
- `design_handoff_flowpub/` — spec exhaustivo + referencias `.dc.html`.
- `supabase/schema.sql` — el backend a correr.
