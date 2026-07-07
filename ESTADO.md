# ESTADO — FlowPub (handoff entre sesiones)

> Dónde nos quedamos y cómo seguir. Léelo al retomar (junto con `CLAUDE.md`).
> Última actualización: **sesión 4, cierre — 2026-07-02 (invitaciones + PWA +
> a11y oscuro + PUSH A PRODUCCIÓN)**.

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
