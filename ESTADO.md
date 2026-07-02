# ESTADO — FlowPub (handoff entre sesiones)

> Dónde nos quedamos y cómo seguir. Léelo al retomar (junto con `CLAUDE.md`).
> Última actualización: **sesión 3, cierre — 2026-07-01 (lectura inline + edición
> + limpieza + OpenGraph)**.

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
