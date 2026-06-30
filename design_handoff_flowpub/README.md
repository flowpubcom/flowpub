# Handoff: FlowPub — la voz que se vuelve publicación

## Overview
**FlowPub** is a voice‑first social publishing app. The single unit of content is a **Flow**: the user taps one record button, speaks, and the app transcribes (Gemini), polishes the transcript into a publishable article (Gemini), and generates an abstract 16:9 cover image. The published Flow shows the AI‑edited version but always exposes the **original raw transcript**. Anyone can browse the infinite timeline (**el Pub**); only registered users can publish. Flows can be liked, shared, and commented with **text or voice** (voice comments expose a "ver transcript" button). Users have profiles, follow each other, message privately (text + voice), and receive notifications. There is an admin **control panel**. The app is bilingual (ES/EN, auto‑detected from the OS) with light + dark themes.

This bundle documents **10 fully‑designed, interactive screens** so a developer can rebuild FlowPub in the production stack.

## About the design files
The files in `designs/` are **design references created as HTML prototypes** (`.dc.html`). They show the intended look, motion, and behavior at high fidelity — they are **not** production code to copy. The task is to **recreate these designs in the production environment** (see Stack below) using its idioms, not to ship the HTML.

> The `.dc.html` files are a streaming‑component format. To view one, open it in a browser (it loads `support.js` from the same folder + Google Fonts over CDN). Read them as visual + interaction references; the inline styles encode exact colors, type, spacing, and the JS classes encode the interaction logic.

## Fidelity
**High‑fidelity.** Final colors, typography, spacing, motion, copy (Spanish, Mexican register) and interactions are all intentional. Recreate the UI pixel‑accurately using the production codebase's component library. Exact tokens are in **Design Tokens** below.

---

## Stack & architecture (the user's chosen stack)
- **Hosting / framework:** Vercel. Use **Next.js (App Router) + React + TypeScript**. Domain: **flowpub.lat**.
- **Backend / DB / Auth:** **Supabase** (Postgres + Auth + Storage + Realtime + Row Level Security). Auth includes **Google OAuth** and email.
- **Email:** **Resend** (verification, notifications digests).
- **Bot protection:** **Cloudflare Turnstile** on signup/login.
- **AI:** **Google Gemini** for (a) speech‑to‑text transcription, (b) transcript → polished markdown article, (c) abstract cover‑image generation (or SVG templating — see Generated Covers).
- **Audio:** browser `MediaRecorder` → upload to Supabase Storage; transcription via Gemini.

High‑level request flow for publishing a Flow:
1. Client records audio (`MediaRecorder`), streams partial transcript (Gemini streaming STT) for the live "transcribiendo" view.
2. On stop → upload audio blob to Storage; server route calls Gemini to (a) finalize transcript, (b) polish into markdown, (c) generate cover.
3. Show the **edit** step (title, markdown body, up to 3 tags, regenerate cover, view original transcript).
4. Publish → insert `flows` row (status `published`), with `audio_url`, `transcript_raw`, `body_md`, `cover_*`, `duration_s`.

Keep all Gemini/secret calls in **server routes / Edge functions**, never the client.

---

## Design tokens

### Color — light theme ("amate": codex ink, cochineal red, amate paper)
| Token | Hex | Use |
|---|---|---|
| `tinta` | `#1A1714` | primary text / ink fills |
| `grana` | `#C0303A` | accent: record, publish, like‑active, primary CTAs |
| `grana-700` | `#9A2530` | accent hover / pressed |
| `grana-wash` | `#F6E6E4` | accent tint backgrounds, audio badge |
| `ocre` | `#D98A3D` | secondary accent (covers, charts) |
| `amate` | `#F2EFE8` | app canvas |
| `amate-2` | `#E6DFD0` | deeper canvas / gradient stop |
| `papel` | `#FBFAF6` | cards / raised surfaces |
| `texto-sec` | `#6E685D` | secondary text |
| `texto-mute` | `#9C968A` | muted text / meta |
| `linea` | `rgba(26,23,20,.12)` | hairline borders |
| `linea-fuerte` | `rgba(26,23,20,.24)` | stronger borders / outline buttons |
| ok (status) | `#2E9A5B` | success / online / verified |

### Color — dark theme ("códice de noche")
Implemented as a **semantic token layer** that flips on `[data-theme="dark"]`. Map each role; do **not** blanket‑invert (covers, device bezels, and accent colors stay fixed).
| Semantic | Light | Dark |
|---|---|---|
| `--ink` (text / ink fills) | `#1A1714` | `#F2EFE8` |
| `--ink-on` (text on ink fill) | `#F2EFE8` | `#1A1714` |
| `--text-2` | `#6E685D` | `#B3AB9D` |
| `--text-3` | `#9C968A` | `#867F72` |
| `--surface` (cards) | `#FBFAF6` | `#1E1A16` |
| `--surface-2` (rails/insets) | `#F8F5EF` | `#191510` |
| `--surface-3` (active pill bg) | `#F2EFE8` | `#2A241D` |
| page bg gradient | `radial(#F4F1EA→#EDE7DA→#E6DFD0)` | `radial(#1E1913→#141110→#0E0C0A)` |
| `--line` | `rgba(26,23,20,.12)` | `rgba(242,239,232,.12)` |
| `--line-2` | `rgba(26,23,20,.24)` | `rgba(242,239,232,.22)` |
| `--hover` | `rgba(26,23,20,.04)` | `rgba(242,239,232,.06)` |
| `--glass` | `rgba(251,250,246,.82)` | `rgba(20,17,14,.72)` |
| `--grana`, `--ocre`, `--grana-700` | unchanged | unchanged |
| `--grana-wash` | `#F6E6E4` | `rgba(192,48,58,.18)` |

Accent avatars (grana/ocre backgrounds with cream text) stay fixed across themes; only "default" ink avatars use `--ink`/`--ink-on`. Theme choice persists in `localStorage('fp-theme')` and defaults to OS (`prefers-color-scheme`).

### Typography
- **Fraunces** (serif, "the voice") — headlines, post titles, article body, transcripts, avatars' initial (italic). Weights 400/500; optical sizing on.
- **Hanken Grotesk** (sans, "the chrome") — UI: buttons, labels, nav, body meta. Weights 400/500/600.
- **Space Mono** (mono, "the data") — durations, counters, timestamps, codes.

Scale (px): Display 40–76 Fraunces 400; H1/Post title 24–30 Fraunces 500; H2 22–24; reading body 18–19 Fraunces 1.7; UI base 14–16 Hanken; meta/eyebrow 11–12 Hanken 600 uppercase, letter‑spacing .12–.16em; data 12–15 Space Mono.

### Spacing (base 4)
`4, 8, 12, 16, 24, 32, 48, 64, 96`.

### Radius
`sm 4 · md 8 · lg 14 · cards 16 · pill 999 · icon tile 24`. Phone screen 42, bezel 52. Desktop window 18.

### Elevation
- card: `0 1px 2px rgba(26,23,20,.05)`
- card hover: `0 16–18px 36px -18px rgba(26,23,20,.3)` + `translateY(-3px)`
- window/modal: `0 30px 70px -28px rgba(26,23,20,.42)` (dark: `rgba(0,0,0,.65)`)
- press: `scale(.95–.97)`

### Motion
Calm, expensive. Easing `cubic-bezier(.22,1,.36,1)`; durations 140/240/320ms; **no bounce**. Ambient: slow drifting particles, the logo "breathes" (6s). Respect `prefers-reduced-motion` (disable all animation). Light interaction **sounds** (WebAudio sine "blips": tick/pop/click/soft) on chips, likes, sends, toggles — gated to real user gestures; provide a global mute.

---

## Brand & signature elements
- **FlowMark (logo):** a monoline *vírgula* (the Mesoamerican speech‑scroll glyph) — one SVG path, `stroke=currentColor`, round caps. Animated states exist (idle breathe, loading comet, generating ink‑draw, publishing pop). Path:
  `M 96 176 C 140 172 176 140 176 100 C 176 56 140 24 100 24 C 60 24 26 56 26 100 C 26 138 56 166 96 156 C 130 148 150 124 150 100 C 150 76 130 60 108 64 C 92 67 86 80 92 92`
- **Wordmark:** "*Flow*Pub" — "Flow" italic Fraunces, "Pub" roman.
- **Audio player:** never a generic waveform — a **vírgula line** that undulates; progress is a grana stroke that grows via `stroke-dashoffset`.
- **Generated covers (4 art directions)**, abstract 16:9 in the palette (tinta/grana/ocre/amate), built as **SVG**: (1) *Escher/LeWitt* isometric cubes with hatch pattern; (2) *Turrell* glowing rounded aperture (radial gradient + blur); (3) *Flavin* vertical neon bars (gradient + gaussian glow); (4) *Lichtenstein/90s collage* (overlapping circle/triangle/quarter‑circle, Ben‑Day dot pattern). All use a `feTurbulence` grain overlay. In production, generate by either (a) Gemini image gen with a constrained palette prompt, or (b) **parametric SVG templates** seeded per Flow (recommended — cheap, on‑brand, deterministic). Store as `cover_svg` (string) or rendered PNG in Storage.
- **No emoji.** The brand bullet is the gold drop / vírgula.

---

## Internationalization (i18n)
- Detect from `navigator.language` / `Accept-Language` (`es*` → Spanish, else English). User can override (Auto / ES / EN); persist choice. Set `<html lang>`.
- **Only the interface chrome is translated.** A Flow's user‑generated content stays in its original language; offer an opt‑in **"Traducir"** action per Flow (Gemini translate). See `designs/Idiomas.dc.html` for the dictionary keys (`nav.*`, `record`, `t.*`, `audio`, `ago`, `comment`, `share`, …) and the live‑swap pattern.
- Use a standard i18n lib (e.g. `next-intl`). Spanish copy is **Mexican register** — keep the warm, plain tone in all strings.

---

## Screens / Views
All screens are responsive (desktop + phone shown side by side in each design file). "Chrome" = translatable; "content" = user data.

### 1. El Pub (timeline) — `designs/El Pub.dc.html`
- **Purpose:** infinite feed of Flows; the home. Public (browse without account).
- **Layout (desktop):** 3‑column app shell — left rail (236px: logo, nav [El Pub, Explorar, Mensajes (unread dot), Notificaciones, Perfil], grana "Grabar un Flow" CTA), center column (sticky glass tag‑filter chip row + vertical list of Flow cards), right rail (296px: "Hoy en el Pub" trending tags w/ counts, "Voces para seguir" w/ follow buttons). **Phone:** top bar (logo + bell + avatar), horizontal tag chips, card list, bottom nav (Pub, Explorar, center grana record FAB, Mensajes, Perfil).
- **Flow card:** generated cover (16:9) with badges (`● Audio`, `9 min`) bottom‑left; body padding 22–24; title Fraunces 500 24–25; 2‑line excerpt Fraunces `texto-sec`; inline mini audio player (vírgula line); footer with avatar byline + actions (like w/ count, comment w/ count, share). Hover lifts card. Like animates heart to grana + count ±1 + pop sound.
- **Tag filter:** chips `Todos` + categories; selecting filters the visible cards (client filter on `tags`).
- **Record button:** if not authenticated → open auth modal ("Para grabar un Flow, entra a FlowPub" with Continuar con Google / Crear cuenta con correo); else → recording flow.
- **State:** session/user, active tag, like state per Flow, theme.

### 2. Grabar un Flow (create) — `designs/Grabar un Flow.dc.html`
- **Purpose:** the core creation act. A 5‑step state machine.
- **Steps:** `record` (big record button, countdown from 09:00, hint) → `recording` (live REC timer turning grana in the last minute, animated waveform bars, **live transcript** filling word‑by‑word, stop button) → `processing` (FlowMark ink‑draw animation; "Puliendo tu voz…" then "Generando la portada…") → `edit` → `published`.
- **Edit step:** cover preview + **Regenerar portada** (cycles the 4 art directions); editable **title**; **markdown toolbar** (H2, bold, italic, quote, list, link — markdown only, no rich HTML); editable body (Fraunces); **Editar / Vista previa** toggle (renders markdown); **Ver transcript original** disclosure (the raw STT); **tags** selector (choose up to **3** of the 12, hard cap with shake feedback + counter); footer Guardar borrador / **Publicar Flow**.
- **Published step:** success with the assembled card preview + "Ver en el Pub" / "Grabar otro".
- **Limits (configurable in admin):** max duration default **9:00** (1–15); max tags default **3** (1–5).
- **State:** step, elapsedSeconds, transcriptRaw, bodyMarkdown, title, selectedTags[], coverVariant, viewMode(edit|preview).
- **Desktop** also shows the composer as a two‑pane "Componer" view with a step indicator (Grabar ✓ · Pulir ✓ · Editar • · Publicar).

### 3. Flow abierto (read + comments) — `designs/Flow abierto.dc.html`
- **Purpose:** read/listen to one Flow and discuss.
- **Layout:** centered reading column (max 720). Kicker tags → big title (Fraunces 400, 46) → byline (avatar, time, "9 min de audio", **Seguir**) → cover → full‑width **audio player** (vírgula, `03:41 / 09:00`) → **Publicación / Transcript original** segmented toggle → article (rendered markdown: paragraphs, blockquote w/ grana left‑border, list, em/strong) → engagement bar (like, comment count, share, save) → **Comentarios**.
- **Comments:** composer with **Escribir / Comentar con voz** tabs. Text → posts a text comment. Voice → record bar (waveform + timer) → on stop posts a **voice comment** = mini player + **Ver transcript** disclosure (raw STT of the comment, unpolished per spec). Each comment has like + reply. New comments prepend with a rise animation and bump the count.
- **Phone:** stacked reading view + sticky bottom composer (input + mic + send).
- **State:** articleView(pub|raw), comments[], composer tab, recording state.

### 4. Reproductor / "Reproduciendo" — `designs/Reproductor.dc.html`
- **Purpose:** immersive now‑playing where the **player lives over the cover** and the cover comes alive on play (the user's signature request).
- **Phone (full‑bleed):** living cover = breathing radial glow + Turrell aperture rings (scale) + rotating dashed ring + drifting geometric shards + light **sheen** sweep + rising particles + grain. Glass top bar (minimize / "Reproduciendo · Arte" / share). Center **glass play button** with concentric **ripple** rings (only animate while playing). Bottom **glass info sheet**: avatar + title + equalizer bars + **karaoke transcript** (words illuminate to champagne `#F6D49A` with glow as playback advances) + vírgula progress + time + transport controls (−15s / play / +15s).
- **Desktop:** the same treatment as an in‑feed card whose cover animates on play with a glass player bar pinned over the image bottom.
- **Mechanics:** animations are CSS `@keyframes` toggled via `animation-play-state` paused↔running; progress + karaoke index driven by a timer from `elapsed/total`. In production bind to the real `<audio>` `timeupdate`. Honor `prefers-reduced-motion`.

### 5. Onboarding — `designs/Onboarding.dc.html`
- **Purpose:** first run → account → pick 3 topics → quick profile → enter.
- **Welcome (hypnotic):** dark brand panel with drifting grana/ocre **blurred blobs**, rotating rings, breathing FlowMark, tagline, and a **glass auth sheet** (Continuar con Google / Crear con correo; "Inicia sesión"; Turnstile note). Desktop shows brand panel left + step content right; phone is full‑screen steps.
- **Themes step:** "¿Qué te mueve?" grid of the 12 categories; select **exactly 3** (counter `n/3`, 4th selection blocked); Continuar enabled at 3.
- **Profile step:** avatar (tap to set, shows initial), **Nombre**, **@usuario** (sanitized `[a-z0-9_]`, live availability ≥3 chars), **Bio** (optional).
- **Ready step:** "Tu Pub está listo, {firstName}" + chosen topic chips + "Entrar al Pub" / "Grabar mi primer Flow".
- **State:** step, selectedTags[], name, username, bio, avatar.

### 6. Perfil — `designs/Perfil.dc.html`
- **Purpose:** a user's profile + their Flows; edit own profile.
- **Layout:** generative banner (Turrell/Flavin motif) → overlapping avatar → name (Fraunces 32) / `@user` / bio / location · "En FlowPub desde 2024" / topic chips → **stats** (Flows · Seguidores · Siguiendo) → tabs (**Flows / Me gusta / Borradores**) → grid of cover thumbnails (desktop 3‑col 16:11; phone 2‑col 1:1; each = cover + title + duration/♥). Drafts show a "Borrador · mm:ss / sin publicar" placeholder.
- **Edit profile (modal / bottom sheet):** change photo (cycles avatar color here; real = upload to Storage), Nombre, @usuario, Bio → **Guardar** updates the header live; avatar initial follows the name.
- **Other people's profiles:** show **Seguir / Siguiendo** + **Mensaje** instead of Edit.
- **State:** profile fields, active tab, follow state, edit‑modal open.

### 7. Mensajería — `designs/Mensajeria.dc.html`
- **Purpose:** private DMs, **text + voice** (voice‑first brand).
- **Desktop:** two‑pane — conversation list (avatar, name, last‑message preview, time, unread count) + thread pane (header w/ "En línea", message bubbles [incoming = surface‑2 left; outgoing = grana right], **voice messages** = mini player + duration + **Ver transcript**, composer w/ text input + mic + send).
- **Phone:** list ↔ thread navigation (tap conversation → thread, back → list).
- **Voice message:** record bar replaces composer (waveform + timer + stop); on stop appends a voice bubble with auto transcript.
- **Realtime:** Supabase Realtime on `messages`. **State:** conversations[], activeConversation, messages[], recording.

### 8. Notificaciones — `designs/Notificaciones.dc.html`
- **Purpose:** activity feed. Types: **like, follow, comment (text), voice‑comment, mention, new‑flow** (from people you follow).
- **Layout:** grouped by time (Hoy / Esta semana). Each row = actor avatar with a small **action badge** (heart/user‑plus/comment/mic colored by type) + text (`**Actor** action [quote] · time`) + right side (Flow thumbnail, **Seguir** button for follows, or voice mini‑player + **Ver transcript** for voice). Unread rows tinted `grana-wash` with a dot. Header **Marcar todo como leído**; filter **Todas / Sin leer**.
- **State:** notifications[], filter, unread set. Realtime insert on `notifications`.

### 9. Panel de control (admin) — `designs/Panel de control.dc.html`
- **Purpose:** internal admin to configure and edit everything. **Gate by role** (`profiles.role = 'admin'`).
- **Shell:** left admin nav (Resumen, Flows, Usuarios, Temas, Ajustes) + content top bar (section title + search).
- **Resumen:** stat cards (Usuarios, Flows publicados, Minutos transcritos [Gemini], Activos hoy) + "Flows por día" bar chart (7d) + "Temas más activos" bars.
- **Flows:** table (cover, title, author, tag, status [Publicado/Destacado/Reportado], actions: destacar / ocultar).
- **Usuarios:** table (avatar, name/@user, role, #flows, status [Verificada/Activo/Suspendido], actions).
- **Temas:** the 12 categories as rows with **active toggle** + edit + **Añadir tema** (the source of truth for onboarding's choices + Pub filters).
- **Ajustes (the config surface):**
  - *General:* Registro abierto (toggle); Idioma por defecto (Automático/Español/English); Tema por defecto (Sistema/Claro/Oscuro).
  - *Inteligencia · Gemini:* Transcripción automática; Pulido del texto con IA; Generación de portada; Estilo de portada (Aleatorio/Collage 90s/Turrell/Flavin/Escher).
  - *Grabación:* Duración máxima (slider 1–15 min, default 9:00); Temas por Flow (slider 1–5, default 3).
  - *Integraciones:* Supabase (status), Resend (toggle), Cloudflare Turnstile (toggle).
  - *Experimental:* **UI generativa (beta)** toggle — the future direction (see below).
- **Phone:** compact metrics grid + quick toggles. **Controls:** custom switches, native selects, range sliders (value labels update live).

### 10. Idiomas (i18n demo) — `designs/Idiomas.dc.html`
- Reference implementation of OS detection + live ES/EN interface translation + the "content stays original / Traducir" rule. Use its dictionary keys as the basis for the real i18n catalog.

---

## Data model (Supabase / Postgres) — suggested
- **profiles** `(id [=auth.uid], username unique, display_name, bio, avatar_url, location, role ['user'|'admin'], lang, theme, created_at)`
- **tags** `(id, slug, name_es, name_en, active bool, sort)` — managed in admin.
- **flows** `(id, author_id→profiles, title, body_md, transcript_raw, audio_url, duration_s, cover_kind ['escher'|'turrell'|'flavin'|'collage'], cover_svg|cover_url, lang, status ['draft'|'published'|'hidden'|'reported'|'featured'], like_count, comment_count, created_at)`
- **flow_tags** `(flow_id, tag_id)` — max 3 per flow (enforce app + check).
- **comments** `(id, flow_id, author_id, kind ['text'|'voice'], body_text, audio_url, transcript_raw, like_count, parent_id nullable, created_at)`
- **likes** `(user_id, flow_id|comment_id, created_at)`
- **follows** `(follower_id, followee_id, created_at)`
- **conversations** `(id, created_at)` + **conversation_members** `(conversation_id, user_id)`
- **messages** `(id, conversation_id, sender_id, kind ['text'|'voice'], body_text, audio_url, transcript_raw, created_at)`
- **notifications** `(id, user_id [recipient], actor_id, type ['like'|'follow'|'comment'|'voice'|'mention'|'flow'], flow_id?, comment_id?, read bool, created_at)`
- **settings** `(key, value jsonb)` — admin config (limits, feature flags, default lang/theme).

Enable **RLS** everywhere. Storage buckets: `audio` (flows + comments + messages), `avatars`, `covers`. Use Postgres triggers (or Edge functions) to fan‑out **notifications** and maintain counts.

---

## Key flows & APIs
- **Auth:** Supabase Auth — Google OAuth + email/password. Turnstile token verified server‑side on signup. New users → onboarding (pick 3 tags → profile).
- **Publish pipeline (server routes):** `POST /api/flows/transcribe` (audio→raw text, streaming for live view) · `POST /api/flows/polish` (raw→markdown article + suggested title + suggested tags) · `POST /api/flows/cover` (kind→SVG/PNG) · `POST /api/flows` (persist). Gemini prompts should: keep the speaker's voice, remove filler/false starts, output **markdown only** (## / ** / * / > / - / links), in the **same language** as the speech.
- **Voice comments / messages:** record → upload → transcribe (raw, unpolished) → store both audio + transcript; UI shows audio with on‑demand transcript.
- **Translate a Flow:** on demand, Gemini translates `body_md` to the viewer's language; cache per (flow, lang).
- **Realtime:** subscribe to `messages`, `notifications`, and live `comments`/`likes` on an open Flow.

---

## "UI generativa" (north star — build toward it)
The app should evolve toward **Generative UI**: instead of a fixed template, an LLM orchestrates each Flow's presentation (layout, emphasis, scale) from its content and the session context, while the brand stays constant. Design accordingly: keep everything driven by **tokens + a small set of composable components**, separate content from layout, and gate the experimental path behind the admin **UI generativa** flag. Rule of thumb from the design system: what may vary is *rhythm and typographic scale*, never the palette or the mark; grana only ever means record/publish/now‑playing.

---

## Suggested build order
1. **Foundation:** Next.js + Tailwind (encode tokens as CSS variables + the light/dark semantic layer), fonts, FlowMark, base components (Button, Chip, Avatar, Card, AudioPlayer[vírgula], Switch), i18n, theme + sound providers.
2. **Auth + onboarding** (Supabase, Google, Turnstile, profile, 3 tags).
3. **El Pub** read‑only (flows feed + cards + tag filter).
4. **Create flow** pipeline (record → Gemini transcribe/polish → cover → edit → publish).
5. **Flow page** (read, transcript toggle, audio, comments text+voice).
6. **Profiles + follows**, **Reproductor** (bind animation to real audio).
7. **Mensajería** + **Notificaciones** (Realtime).
8. **Admin panel** + settings.
9. **Polish:** dark mode across all, motion, sounds, accessibility (focus rings = grana, 44px hit targets, reduced‑motion), i18n catalog completion.

## Accessibility
Focus ring = grana 2px offset (never default blue). Hit targets ≥44px. All animation respects `prefers-reduced-motion`. Provide a sound mute. Maintain AA contrast (the dark tokens are tuned for this). `<html lang>` follows the active language.

## Files
`designs/*.dc.html` — the 10 high‑fidelity references (+ `support.js` runtime so they open in a browser):
`El Pub` · `Grabar un Flow` · `Flow abierto` · `Reproductor` · `Onboarding` · `Perfil` · `Mensajeria` · `Notificaciones` · `Panel de control` · `Idiomas`.
