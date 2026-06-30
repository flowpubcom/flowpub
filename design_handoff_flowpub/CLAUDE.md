# CLAUDE.md — FlowPub

> Project rules for Claude Code. Read this first, every session. Full spec: `design_handoff_flowpub/README.md`; visual references: `design_handoff_flowpub/designs/*.dc.html`. Place this file at the repository root.

## What FlowPub is
A **voice‑first social publishing app**. One unit of content = a **Flow**: tap record → speak → Gemini transcribes → Gemini polishes into a markdown article → an abstract 16:9 cover is generated. The published Flow shows the AI‑edited text but always exposes the **raw transcript**. Anyone can browse the timeline (**el Pub**); only registered users publish. Flows are liked, shared, and commented with **text or voice** (voice items always offer "ver transcript"). Users have profiles, follow each other, DM (text + voice), get notifications. There's an admin panel. Bilingual ES/EN (auto from OS), light + dark.

## Stack (do not substitute without asking)
Next.js (App Router) + React + TypeScript on **Vercel** · **Supabase** (Postgres + Auth + Storage + Realtime + RLS) · **Google OAuth** + email · **Resend** (email) · **Cloudflare Turnstile** (signup/login) · **Google Gemini** (STT, polish, cover, translate). Domain **flowpub.lat**.

## Golden rules
1. The `designs/*.dc.html` files are **references, not code to copy**. Recreate them in React with our component library; match them pixel‑accurately (this is hi‑fi).
2. **All secrets and AI/Gemini calls run server‑side** (route handlers / Edge). Never expose keys to the client.
3. **Enable RLS on every table.** Default‑deny; write explicit policies.
4. Style only via the **design tokens** below (CSS variables). Never hardcode hex outside the token layer. Never invent colors/type/spacing outside the system.
5. Keep **content separate from layout** — we are building toward "UI generativa" (LLM‑orchestrated presentation). Composable, token‑driven components only.

## Design system (binding)
**Palette — "tinta, grana y amate" (Mesoamerican codex).** Light: `tinta #1A1714` (ink/text), `grana #C0303A` (accent), `grana-700 #9A2530`, `grana-wash #F6E6E4`, `ocre #D98A3D`, `amate #F2EFE8` (canvas), `amate-2 #E6DFD0`, `papel #FBFAF6` (cards), `texto-sec #6E685D`, `texto-mute #9C968A`, `linea rgba(26,23,20,.12)`, `linea-fuerte rgba(26,23,20,.24)`, ok `#2E9A5B`.

**`grana` is reserved** for: record, publish, like‑active, now‑playing, primary CTAs, focus rings. Nothing else is red.

**Dark theme** = a semantic token layer that flips on `[data-theme="dark"]` (persist `localStorage('fp-theme')`, default to OS). Map roles, don't blanket‑invert: `--ink #1A1714↔#F2EFE8`, `--ink-on #F2EFE8↔#1A1714`, `--surface #FBFAF6↔#1E1A16`, `--surface-2 #F8F5EF↔#191510`, `--surface-3 #F2EFE8↔#2A241D`, `--text-2 #6E685D↔#B3AB9D`, `--text-3 #9C968A↔#867F72`, lines flip to `rgba(242,239,232,*)`. Accent colors (grana/ocre) and device bezels/covers stay fixed. (Full table in README.)

**Type:** **Fraunces** (serif) = the voice — titles, article body, transcripts, avatar initials (italic). **Hanken Grotesk** (sans) = the chrome — UI/buttons/labels. **Space Mono** = data — durations, counters, timestamps. Spacing base‑4 (4…96). Radius: card 16, pill 999, md 8, lg 14.

**Brand mark (FlowMark):** the monoline *vírgula* (speech‑scroll) — single SVG path, `stroke=currentColor`, round caps (path in README). Wordmark "*Flow*Pub" (Flow italic). The **audio player is a vírgula line**, not a generic waveform; progress = grana stroke via `stroke-dashoffset`.

**Covers:** abstract 16:9 SVG in 4 art directions — Escher/LeWitt isometric, Turrell aperture, Flavin neon, Lichtenstein/90s collage — palette‑locked, grain overlay. Prefer **parametric SVG templates seeded per Flow** over image‑gen.

**No emoji** anywhere. The brand's only "emoji" is the vírgula / gold drop.

## Voice & i18n
Spanish, **Mexican register** — warm, plain, a little intimate; "la voz que se vuelve publicación". Translate **chrome only**; a Flow's content stays in its language with an opt‑in **Traducir** (Gemini). Detect via `navigator.language`/`Accept-Language` (`es*`→ES else EN), allow override, set `<html lang>`. Use `next-intl`; seed the catalog from `designs/Idiomas.dc.html` keys.

## Motion, sound, a11y
Easing `cubic-bezier(.22,1,.36,1)`, durations 140/240/320ms, **no bounce**. Subtle ambient (drifting particles, breathing logo). Light WebAudio **blips** on interactions (provide a mute). **Respect `prefers-reduced-motion`** (disable animation). Focus ring = grana (never default blue). Hit targets ≥44px. Maintain AA contrast.

## Data model (Supabase) — see README for columns
`profiles · tags · flows · flow_tags (max 3) · comments (text|voice) · likes · follows · conversations · conversation_members · messages (text|voice) · notifications · settings`. Storage buckets: `audio`, `avatars`, `covers`. Fan out notifications + maintain counts via triggers/Edge fns.

## Publish pipeline (server)
`transcribe` (audio→raw, stream for live view) → `polish` (raw→markdown, keep the speaker's voice, strip filler, **markdown only**, same language, suggest title+tags) → `cover` (kind→SVG/PNG) → persist `flows`. Voice comments/messages: store audio **and** unpolished transcript.

## Build order (milestones)
1) Foundation (tokens + dark layer, fonts, FlowMark, base components, i18n/theme/sound providers) → 2) Auth + onboarding (Google + Turnstile + 3 tags) → 3) El Pub feed → 4) Create‑flow pipeline → 5) Flow page (read, transcript toggle, audio, comments) → 6) Profiles/follows + Reproductor (bind to real `<audio>`) → 7) Mensajería + Notificaciones (Realtime) → 8) Admin + settings → 9) Polish (dark everywhere, motion, a11y, i18n).

## Definition of done (per screen)
Matches the `.dc.html` reference in light **and** dark; keyboard‑accessible with grana focus; reduced‑motion safe; strings in the i18n catalog (ES+EN); no client‑side secrets; RLS policies written and tested.
