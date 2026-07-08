// Datos del pitch deck (/deck). Narrativa + modelo financiero (verificado jul 2026).
// El copy es la fuente de verdad del deck; el detalle vive en design_handoff / ESTADO.

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

export interface Slide {
  id: string;
  kicker: string;
  title: string;
  body: string;
  bullets: string[];
  visual: Visual;
  layout: "split" | "center" | "full";
}

export const SLIDES: Slide[] = [
  {
    id: "apertura",
    kicker: "FlowPub",
    title: "Antes de la escritura, ya contábamos historias",
    body: "La voz es una de las piedras angulares de lo humano. Antes del alfabeto, la tradición oral guardó y conectó a generaciones enteras. FlowPub la devuelve al centro.",
    bullets: ["«La voz que se vuelve publicación»", "Voice-first, no un pódcast más"],
    visual: "opening",
    layout: "center",
  },
  {
    id: "problema",
    kicker: "El problema",
    title: "Los feeds se quedaron sin alma",
    body: "Publicar hoy es teclear texto plano en cajas iguales. El tono, la duda, la calidez de una persona hablando se pierden. Scroll infinito, cero presencia. Conectamos menos aunque publiquemos más.",
    bullets: [
      "El texto plano aplana a la persona",
      "Formatos idénticos, timelines sin voz",
      "La atención se mide; la conexión, no",
    ],
    visual: "noise",
    layout: "split",
  },
  {
    id: "insight",
    kicker: "La insight",
    title: "La voz carga lo que el texto no puede",
    body: "Escuchar a alguien tiene una profundidad que leerlo no da. El relato oral es una de las mayores formas humanas de conservar y de conectar. Ahí hay una red social esperando a existir.",
    bullets: [
      "Timbre, ritmo y pausa dicen tanto como las palabras",
      "Grabar es más íntimo —y más rápido— que escribir",
      "La tradición oral como producto, no como nostalgia",
    ],
    visual: "karaoke",
    layout: "split",
  },
  {
    id: "solucion",
    kicker: "La solución",
    title: "Hablas tres minutos. Sale una publicación",
    body: "FlowPub convierte tu voz en un artículo con portada, sin que dejes de sonar a ti. La unidad es el «Flow»: tocas grabar, hablas, y en segundos tienes algo publicable y bello.",
    bullets: [
      "Grabar → pulir → portada, en un gesto",
      "Conserva tu voz: quita muletillas, no inventa",
      "Siempre expone el transcript crudo, sin trampa",
    ],
    visual: "record",
    layout: "split",
  },
  {
    id: "pipeline",
    kicker: "Cómo funciona",
    title: "De aliento a artículo",
    body: "Cuatro pasos server-side sobre Google Gemini. Grabas ≤3 min; se transcribe en vivo; se pule a markdown conservando tu voz; se genera una portada abstracta determinista por Flow.",
    bullets: [
      "Transcribe — audio → crudo (stream en vivo)",
      "Pule — crudo → markdown, mismo idioma, sin inventar",
      "Portada — SVG paramétrico 16:9, on-brand, por Flow",
      "Publica — versión pulida + transcript crudo, siempre",
    ],
    visual: "pipeline",
    layout: "split",
  },
  {
    id: "features",
    kicker: "Ya construido",
    title: "Una red social completa, no un demo",
    body: "No es solo el grabador. Es el Pub entero: timeline público, interacción por voz y texto, mensajería privada, y todo bilingüe en claro y oscuro.",
    bullets: [
      "El Pub: timeline público; publicar solo con cuenta",
      "Comentarios y mensajes en texto o voz («Ver transcript»)",
      "Like, seguir, notificaciones, perfiles, panel admin",
      "Radio del Pub, filtros por duración y tema",
      "Bilingüe ES/EN; login con Google o correo",
    ],
    visual: "features",
    layout: "split",
  },
  {
    id: "marca",
    kicker: "La experiencia",
    title: "Tinta, grana y amate",
    body: "Una identidad de códice mesoamericano: cálida, impresa, con carácter. Nada de gris de dashboard. Fraunces es la voz, Hanken el chrome, Space Mono los datos. La única emoji es la vírgula dorada.",
    bullets: [
      "Paleta bloqueada: grana reservada a grabar/publicar/like",
      "Claro y oscuro de verdad, no un filtro invertido",
      "Portadas abstractas con grano, en cuatro direcciones de arte",
      "Movimiento sutil, accesible, reduce-motion-safe",
    ],
    visual: "brand",
    layout: "split",
  },
  {
    id: "norte",
    kicker: "El norte",
    title: "Cada Flow, presentado por una IA",
    body: "El horizonte es UI generativa: un LLM orquesta la presentación de cada Flow —ritmo, énfasis, escala tipográfica— desde su propio contenido. La marca constante; el layout, vivo.",
    bullets: [
      "Contenido separado del layout, todo por tokens",
      "Varía el ritmo y la escala; nunca la paleta ni la marca",
      "Un set chico de componentes componibles como base",
    ],
    visual: "generative",
    layout: "split",
  },
  {
    id: "estado",
    kicker: "Estado",
    title: "No lo vamos a lanzar. Ya está vivo",
    body: "FlowPub corre en producción, en flowpub.app, listo para probarse en beta abierta. No es un pitch de idea: es un producto que puedes abrir y usar ahora mismo, hoy.",
    bullets: [
      "Vivo en flowpub.app — beta abierta lista para probar",
      "Pipeline completo funcionando sobre Gemini",
      "Next.js en Vercel + Supabase",
      "Un solo fundador, de cero a red social en producción",
    ],
    visual: "state",
    layout: "split",
  },
  {
    id: "fundador",
    kicker: "El fundador",
    title: "Julio Sahagún: barro y código",
    body: "Artista plástico y explorador digital. Vendió su primera web en 2000; 200+ proyectos interactivos; nómada por 49 países. Para él, la tecnología es material de escultura —a veces es cerámica, a veces una red social.",
    bullets: [
      "Licenciatura en Artes Plásticas, U. de Guanajuato",
      "Individuales: Museo Casa Diego Rivera (2022), Antropología de Xalapa (2025)",
      "Cofundador de Espacio Mutante — 7+ años de arte colectivo",
      "También desarrolla Oraculos.app y Gulu.art",
      "Escribe código desde el bosque de niebla de Zoncuantla",
    ],
    visual: "founder",
    layout: "split",
  },
  {
    id: "ahora",
    kicker: "Por qué ahora",
    title: "La voz y la IA por fin se juntaron bien",
    body: "La transcripción y el pulido con LLM recién llegaron a ser buenos, baratos y rápidos. La grabación de voz nunca fue tan natural. La ventana para una red voice-first, con gusto, está abierta.",
    bullets: [
      "STT y pulido de calidad, a costo marginal, en segundos",
      "Nadie ha hecho voice-first con esta dirección de arte",
      "Producto en la mano, no en el roadmap",
    ],
    visual: "braid",
    layout: "split",
  },
  {
    id: "peticion",
    kicker: "La petición",
    title: "Un año de vida para que crezca",
    body: "Buscamos recursos para financiar un año completo de FlowPub: mantener la infraestructura viva y dar espacio a que la beta se vuelva comunidad. Stack lean, un fundador full-stack, costos en USD.",
    bullets: [
      "Objetivo: 12 meses de runway",
      "Infra controlada: Vercel + Supabase + Gemini",
      "Sin equipo que escalar aún: eficiencia por diseño",
      "Cada dólar compra tiempo de producto, no overhead",
    ],
    visual: "ask",
    layout: "center",
  },
  {
    id: "finanzas",
    kicker: "Los números",
    title: "Tres escenarios, honestos",
    body: "Mantener FlowPub vivo cuesta poquísimo; el grueso de lo que pedimos es músculo de crecimiento. Precios verificados en julio 2026.",
    bullets: [],
    visual: "finance",
    layout: "full",
  },
  {
    id: "cierre",
    kicker: "Ahora te toca",
    title: "¡Saca el Flow!",
    body: "La voz fue lo primero que nos hizo humanos y comunidad. FlowPub la pone de nuevo al centro —y ya está viva. Abre flowpub.app, toca grabar, y escúchate publicar.",
    bullets: ["flowpub.app · beta abierta", "La voz que se vuelve publicación"],
    visual: "closing",
    layout: "center",
  },
];

// ── modelo financiero ───────────────────────────────────────────────────────
export const ASK = { amountUsd: 20000, mxn: 360000, months: 12 };

export const TIERS = [
  {
    name: "Austero",
    annualUsd: 2058,
    monthlyUsd: 172,
    summary: "El piso. Solo infra + herramienta de desarrollo. Crecimiento orgánico, cero publicidad.",
    recommended: false,
  },
  {
    name: "Base",
    annualUsd: 18858,
    monthlyUsd: 1572,
    summary: "Recomendado. Infra con margen + primeras inversiones de crecimiento (ads de prueba y micro-creadores).",
    recommended: true,
  },
  {
    name: "Ambicioso",
    annualUsd: 81498,
    monthlyUsd: 6792,
    summary: "El acelerador. Campañas sostenidas y varios creadores, con la infra dimensionada a 200k+ usuarios.",
    recommended: false,
  },
];

// Desglose del escenario Base por rubro (anual, USD). Suma = 18,858.
export const BASE_BREAKDOWN = [
  { label: "Crecimiento — publicidad + creadores", usd: 13200, kind: "growth" as const },
  { label: "IA + desarrollo — Claude Code + Gemini", usd: 3360, kind: "keep" as const },
  { label: "Contingencia — herramientas / legal", usd: 1200, kind: "keep" as const },
  { label: "Infraestructura — Vercel + Supabase", usd: 840, kind: "keep" as const },
  { label: "Correo + seguridad — Resend + Turnstile", usd: 240, kind: "keep" as const },
  { label: "Dominio — flowpub.app", usd: 18, kind: "keep" as const },
];

export const FINANCE_NOTES = [
  "≈ $0.006 por Flow en Gemini: transcribir 3 min de voz, pulirlos y sembrar la portada.",
  "Turnstile gratis; portadas SVG paramétricas (no image-gen): costo marginal.",
  "70% de la petición es crecimiento; solo ~30% es mantener la app viva.",
];
