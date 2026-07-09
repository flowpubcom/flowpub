// Datos del pitch deck (/deck). Narrativa + modelo financiero (verificado jul 2026).
// El copy es la fuente de verdad del deck; el detalle vive en design_handoff / ESTADO.
// Bilingüe ES/EN: cada string de contenido vive como `bi(es, en)` y el Deck lo
// resuelve con el idioma global (useI18n).

export type Visual =
  | "opening"
  | "noise"
  | "karaoke"
  | "record"
  | "pipeline"
  | "features"
  | "brand"
  | "generative"
  | "state"
  | "founder"
  | "braid"
  | "ask"
  | "finance"
  | "closing";

/** String bilingüe: el Deck elige `es` o `en` según el idioma global. */
export interface Bi {
  es: string;
  en: string;
}

const bi = (es: string, en: string): Bi => ({ es, en });

export interface Slide {
  id: string;
  kicker: Bi;
  title: Bi;
  body: Bi;
  bullets: Bi[];
  visual: Visual;
  layout: "split" | "center" | "full";
}

export const SLIDES: Slide[] = [
  {
    id: "apertura",
    kicker: bi("FlowPub", "FlowPub"),
    title: bi(
      "Antes de la escritura, ya contábamos historias",
      "Before writing, we were already telling stories",
    ),
    body: bi(
      "La voz es una de las piedras angulares de lo humano. Antes del alfabeto, la tradición oral guardó y conectó a generaciones enteras. FlowPub la devuelve al centro.",
      "Voice is one of the cornerstones of being human. Before the alphabet, oral tradition preserved and connected whole generations. FlowPub puts it back at the center.",
    ),
    bullets: [
      bi("«La voz que se vuelve publicación»", "“The voice that becomes a publication”"),
      bi("Voice-first, no un pódcast más", "Voice-first — not another podcast"),
    ],
    visual: "opening",
    layout: "center",
  },
  {
    id: "problema",
    kicker: bi("El problema", "The problem"),
    title: bi("Los feeds se quedaron sin alma", "Feeds have lost their soul"),
    body: bi(
      "Publicar hoy es teclear texto plano en cajas iguales. El tono, la duda, la calidez de una persona hablando se pierden. Scroll infinito, cero presencia. Conectamos menos aunque publiquemos más.",
      "Publishing today means typing plain text into identical boxes. The tone, the hesitation, the warmth of a person speaking — all lost. Infinite scroll, zero presence. We connect less even as we post more.",
    ),
    bullets: [
      bi("El texto plano aplana a la persona", "Plain text flattens the person"),
      bi("Formatos idénticos, timelines sin voz", "Identical formats, voiceless timelines"),
      bi("La atención se mide; la conexión, no", "Attention gets measured; connection doesn't"),
    ],
    visual: "noise",
    layout: "split",
  },
  {
    id: "insight",
    kicker: bi("La insight", "The insight"),
    title: bi("La voz carga lo que el texto no puede", "Voice carries what text cannot"),
    body: bi(
      "Escuchar a alguien tiene una profundidad que leerlo no da. El relato oral es una de las mayores formas humanas de conservar y de conectar. Ahí hay una red social esperando a existir.",
      "Listening to someone has a depth that reading them never reaches. Oral storytelling is one of humanity's greatest ways of preserving and connecting. Right there, a social network is waiting to exist.",
    ),
    bullets: [
      bi(
        "Timbre, ritmo y pausa dicen tanto como las palabras",
        "Timbre, rhythm and pauses say as much as the words",
      ),
      bi(
        "Grabar es más íntimo —y más rápido— que escribir",
        "Recording is more intimate — and faster — than writing",
      ),
      bi(
        "La tradición oral como producto, no como nostalgia",
        "Oral tradition as a product, not as nostalgia",
      ),
    ],
    visual: "karaoke",
    layout: "split",
  },
  {
    id: "solucion",
    kicker: bi("La solución", "The solution"),
    title: bi(
      "Hablas tres minutos. Sale una publicación",
      "You talk for three minutes. Out comes a publication",
    ),
    body: bi(
      "FlowPub convierte tu voz en un artículo con portada, sin que dejes de sonar a ti. La unidad es el «Flow»: tocas grabar, hablas, y en segundos tienes algo publicable y bello.",
      "FlowPub turns your voice into an article with a cover — without you ever ceasing to sound like you. The unit is the “Flow”: you tap record, you speak, and in seconds you have something publishable and beautiful.",
    ),
    bullets: [
      bi("Grabar → pulir → portada, en un gesto", "Record → polish → cover, in one gesture"),
      bi(
        "Conserva tu voz: quita muletillas, no inventa",
        "It keeps your voice: trims filler words, never invents",
      ),
      bi(
        "Siempre expone el transcript crudo, sin trampa",
        "The raw transcript is always exposed — no tricks",
      ),
    ],
    visual: "record",
    layout: "split",
  },
  {
    id: "pipeline",
    kicker: bi("Cómo funciona", "How it works"),
    title: bi("De aliento a artículo", "From breath to article"),
    body: bi(
      "Cuatro pasos server-side sobre Google Gemini. Grabas ≤3 min; se transcribe en vivo; se pule a markdown conservando tu voz; se genera una portada abstracta determinista por Flow.",
      "Four server-side steps on Google Gemini. You record ≤3 min; it transcribes live; it's polished into markdown that keeps your voice; a deterministic abstract cover is generated per Flow.",
    ),
    bullets: [
      bi(
        "Transcribe — audio → crudo (stream en vivo)",
        "Transcribe — audio → raw (live stream)",
      ),
      bi(
        "Pule — crudo → markdown, mismo idioma, sin inventar",
        "Polish — raw → markdown, same language, nothing invented",
      ),
      bi(
        "Portada — SVG paramétrico 16:9, on-brand, por Flow",
        "Cover — parametric 16:9 SVG, on-brand, per Flow",
      ),
      bi(
        "Publica — versión pulida + transcript crudo, siempre",
        "Publish — polished version + raw transcript, always",
      ),
    ],
    visual: "pipeline",
    layout: "split",
  },
  {
    id: "features",
    kicker: bi("Ya construido", "Already built"),
    title: bi(
      "Una red social completa, no un demo",
      "A complete social network, not a demo",
    ),
    body: bi(
      "No es solo el grabador. Es el Pub entero: timeline público, interacción por voz y texto, mensajería privada, y todo bilingüe en claro y oscuro.",
      "It's not just the recorder. It's the whole Pub: a public timeline, voice and text interaction, private messaging — all of it bilingual, in light and dark.",
    ),
    bullets: [
      bi(
        "El Pub: timeline público; publicar solo con cuenta",
        "The Pub: public timeline; publishing requires an account",
      ),
      bi(
        "Comentarios y mensajes en texto o voz («Ver transcript»)",
        "Comments and messages in text or voice (“View transcript”)",
      ),
      bi(
        "Like, seguir, notificaciones, perfiles, panel admin",
        "Likes, follows, notifications, profiles, admin panel",
      ),
      bi(
        "Radio del Pub, filtros por duración y tema",
        "Pub radio, filters by duration and topic",
      ),
      bi(
        "Bilingüe ES/EN; login con Google o correo",
        "Bilingual ES/EN; sign in with Google or email",
      ),
    ],
    visual: "features",
    layout: "split",
  },
  {
    id: "marca",
    kicker: bi("La experiencia", "The experience"),
    title: bi("Tinta, grana y amate", "Tinta, grana y amate"),
    body: bi(
      "Una identidad de códice mesoamericano: cálida, impresa, con carácter. Nada de gris de dashboard. Fraunces es la voz, Hanken el chrome, Space Mono los datos. La única emoji es la vírgula dorada.",
      "A Mesoamerican-codex identity: warm, printed, with character. No dashboard gray. Fraunces is the voice, Hanken the chrome, Space Mono the data. The only emoji is the vírgula (the golden comma).",
    ),
    bullets: [
      bi(
        "Paleta bloqueada: grana reservada a grabar/publicar/like",
        "Locked palette: grana reserved for record/publish/like",
      ),
      bi(
        "Claro y oscuro de verdad, no un filtro invertido",
        "True light and dark modes, not an inverted filter",
      ),
      bi(
        "Portadas abstractas con grano, en cuatro direcciones de arte",
        "Abstract covers with grain, in four art directions",
      ),
      bi(
        "Movimiento sutil, accesible, reduce-motion-safe",
        "Subtle motion, accessible, reduce-motion-safe",
      ),
    ],
    visual: "brand",
    layout: "split",
  },
  {
    id: "norte",
    kicker: bi("El norte", "True north"),
    title: bi("Cada Flow, presentado por una IA", "Every Flow, presented by an AI"),
    body: bi(
      "El horizonte es UI generativa: un LLM orquesta la presentación de cada Flow —ritmo, énfasis, escala tipográfica— desde su propio contenido. La marca constante; el layout, vivo.",
      "The horizon is generative UI: an LLM orchestrates each Flow's presentation — rhythm, emphasis, type scale — from its own content. The brand stays constant; the layout comes alive.",
    ),
    bullets: [
      bi(
        "Contenido separado del layout, todo por tokens",
        "Content separated from layout, everything through tokens",
      ),
      bi(
        "Varía el ritmo y la escala; nunca la paleta ni la marca",
        "Rhythm and scale vary; the palette and the brand never do",
      ),
      bi(
        "Un set chico de componentes componibles como base",
        "A small set of composable components as the base",
      ),
    ],
    visual: "generative",
    layout: "split",
  },
  {
    id: "estado",
    kicker: bi("Estado", "Status"),
    title: bi(
      "No lo vamos a lanzar. Ya está vivo",
      "We're not going to launch it. It's already live",
    ),
    body: bi(
      "FlowPub corre en producción, en flowpub.app, listo para probarse en beta abierta. No es un pitch de idea: es un producto que puedes abrir y usar ahora mismo, hoy.",
      "FlowPub runs in production at flowpub.app, ready to try in open beta. This isn't an idea pitch: it's a product you can open and use right now, today.",
    ),
    bullets: [
      bi(
        "Vivo en flowpub.app — beta abierta lista para probar",
        "Live at flowpub.app — open beta ready to try",
      ),
      bi(
        "Pipeline completo funcionando sobre Gemini",
        "Full pipeline running on Gemini",
      ),
      bi("Next.js en Vercel + Supabase", "Next.js on Vercel + Supabase"),
      bi(
        "Un solo fundador, de cero a red social en producción",
        "A single founder, from zero to a social network in production",
      ),
    ],
    visual: "state",
    layout: "split",
  },
  {
    id: "fundador",
    kicker: bi("El fundador", "The founder"),
    title: bi("Julio Sahagún: barro y código", "Julio Sahagún: clay and code"),
    body: bi(
      "Artista plástico y explorador digital. Vendió su primera web en 2000; 200+ proyectos interactivos; nómada por 49 países. Para él, la tecnología es material de escultura —a veces es cerámica, a veces una red social.",
      "Visual artist and digital explorer. Sold his first website in 2000; 200+ interactive projects; a nomad across 49 countries. To him, technology is sculpting material — sometimes it's ceramics, sometimes a social network.",
    ),
    bullets: [
      bi(
        "Licenciatura en Artes Plásticas, U. de Guanajuato",
        "BFA in Visual Arts, University of Guanajuato",
      ),
      bi(
        "Individuales: Museo Casa Diego Rivera (2022), Antropología de Xalapa (2025)",
        "Solo shows: Museo Casa Diego Rivera (2022), Museum of Anthropology, Xalapa (2025)",
      ),
      bi(
        "Cofundador de Espacio Mutante — 7+ años de arte colectivo",
        "Co-founder of Espacio Mutante — 7+ years of collective art",
      ),
      bi(
        "También desarrolla Oraculos.app y Gulu.art",
        "Also builds Oraculos.app and Gulu.art",
      ),
      bi(
        "Escribe código desde el bosque de niebla de Zoncuantla",
        "Writes code from the cloud forest of Zoncuantla",
      ),
    ],
    visual: "founder",
    layout: "split",
  },
  {
    id: "ahora",
    kicker: bi("Por qué ahora", "Why now"),
    title: bi(
      "La voz y la IA por fin se juntaron bien",
      "Voice and AI finally came together right",
    ),
    body: bi(
      "La transcripción y el pulido con LLM recién llegaron a ser buenos, baratos y rápidos. La grabación de voz nunca fue tan natural. La ventana para una red voice-first, con gusto, está abierta.",
      "Transcription and LLM polishing only recently became good, cheap and fast. Recording your voice has never felt this natural. The window for a voice-first network with taste is open.",
    ),
    bullets: [
      bi(
        "STT y pulido de calidad, a costo marginal, en segundos",
        "Quality STT and polishing, at marginal cost, in seconds",
      ),
      bi(
        "Nadie ha hecho voice-first con esta dirección de arte",
        "No one has done voice-first with this art direction",
      ),
      bi("Producto en la mano, no en el roadmap", "Product in hand, not on a roadmap"),
    ],
    visual: "braid",
    layout: "split",
  },
  {
    id: "peticion",
    kicker: bi("La petición", "The ask"),
    title: bi("Un año de vida para que crezca", "A year of life so it can grow"),
    body: bi(
      "Buscamos recursos para financiar un año completo de FlowPub: mantener la infraestructura viva y dar espacio a que la beta se vuelva comunidad. Stack lean, un fundador full-stack, costos en USD.",
      "We're raising resources to fund one full year of FlowPub: keeping the infrastructure alive and giving the beta room to become a community. Lean stack, one full-stack founder, costs in USD.",
    ),
    bullets: [
      bi("Objetivo: 12 meses de runway", "Goal: 12 months of runway"),
      bi(
        "Infra controlada: Vercel + Supabase + Gemini",
        "Infrastructure under control: Vercel + Supabase + Gemini",
      ),
      bi(
        "Sin equipo que escalar aún: eficiencia por diseño",
        "No team to scale yet: efficiency by design",
      ),
      bi(
        "Cada dólar compra tiempo de producto, no overhead",
        "Every dollar buys product time, not overhead",
      ),
    ],
    visual: "ask",
    layout: "center",
  },
  {
    id: "finanzas",
    kicker: bi("Los números", "The numbers"),
    title: bi("Tres escenarios, honestos", "Three honest scenarios"),
    body: bi(
      "Mantener FlowPub vivo cuesta poquísimo; el grueso de lo que pedimos es músculo de crecimiento. Precios verificados en julio 2026.",
      "Keeping FlowPub alive costs very little; the bulk of the ask is growth muscle. Prices verified in July 2026.",
    ),
    bullets: [],
    visual: "finance",
    layout: "full",
  },
  {
    id: "cierre",
    kicker: bi("Ahora te toca", "Your turn now"),
    title: bi("¡Saca el Flow!", "¡Saca el Flow! — let it out"),
    body: bi(
      "La voz fue lo primero que nos hizo humanos y comunidad. FlowPub la pone de nuevo al centro —y ya está viva. Abre flowpub.app, toca grabar, y escúchate publicar.",
      "Voice was the first thing that made us human — and made us community. FlowPub puts it back at the center, and it's already alive. Open flowpub.app, tap record, and hear yourself publish.",
    ),
    bullets: [
      bi("flowpub.app · beta abierta", "flowpub.app · open beta"),
      bi("La voz que se vuelve publicación", "The voice that becomes a publication"),
    ],
    visual: "closing",
    layout: "center",
  },
];

// ── modelo financiero ───────────────────────────────────────────────────────
export const ASK = { amountUsd: 20000, mxn: 360000, months: 12 };

export interface Tier {
  name: Bi;
  annualUsd: number;
  monthlyUsd: number;
  summary: Bi;
  recommended: boolean;
}

export const TIERS: Tier[] = [
  {
    name: bi("Austero", "Austere"),
    annualUsd: 2058,
    monthlyUsd: 172,
    summary: bi(
      "El piso. Solo infra + herramienta de desarrollo. Crecimiento orgánico, cero publicidad.",
      "The floor. Infra + dev tooling only. Organic growth, zero advertising.",
    ),
    recommended: false,
  },
  {
    name: bi("Base", "Base"),
    annualUsd: 18858,
    monthlyUsd: 1572,
    summary: bi(
      "Recomendado. Infra con margen + primeras inversiones de crecimiento (ads de prueba y micro-creadores).",
      "Recommended. Infra with headroom + first growth bets (test ads and micro-creators).",
    ),
    recommended: true,
  },
  {
    name: bi("Ambicioso", "Ambitious"),
    annualUsd: 81498,
    monthlyUsd: 6792,
    summary: bi(
      "El acelerador. Campañas sostenidas y varios creadores, con la infra dimensionada a 200k+ usuarios.",
      "The accelerator. Sustained campaigns and several creators, with infra sized for 200k+ users.",
    ),
    recommended: false,
  },
];

// Desglose del escenario Base por rubro (anual, USD). Suma = 18,858.
export const BASE_BREAKDOWN = [
  {
    label: bi("Crecimiento — publicidad + creadores", "Growth — advertising + creators"),
    usd: 13200,
    kind: "growth" as const,
  },
  {
    label: bi("IA + desarrollo — Claude Code + Gemini", "AI + development — Claude Code + Gemini"),
    usd: 3360,
    kind: "keep" as const,
  },
  {
    label: bi("Contingencia — herramientas / legal", "Contingency — tooling / legal"),
    usd: 1200,
    kind: "keep" as const,
  },
  {
    label: bi("Infraestructura — Vercel + Supabase", "Infrastructure — Vercel + Supabase"),
    usd: 840,
    kind: "keep" as const,
  },
  {
    label: bi("Correo + seguridad — Resend + Turnstile", "Email + security — Resend + Turnstile"),
    usd: 240,
    kind: "keep" as const,
  },
  {
    label: bi("Dominio — flowpub.app", "Domain — flowpub.app"),
    usd: 18,
    kind: "keep" as const,
  },
];

export const FINANCE_NOTES: Bi[] = [
  bi(
    "≈ $0.006 por Flow en Gemini: transcribir 3 min de voz, pulirlos y sembrar la portada.",
    "≈ $0.006 per Flow on Gemini: transcribing 3 min of voice, polishing it and seeding the cover.",
  ),
  bi(
    "Turnstile gratis; portadas SVG paramétricas (no image-gen): costo marginal.",
    "Turnstile is free; parametric SVG covers (no image-gen): marginal cost.",
  ),
  bi(
    "70% de la petición es crecimiento; solo ~30% es mantener la app viva.",
    "70% of the ask is growth; only ~30% keeps the app alive.",
  ),
];
