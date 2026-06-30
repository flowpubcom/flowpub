import type { Flow, Profile, TrendingTag } from "./types";
import { POLISHED_MD, RAW_TRANSCRIPT } from "./composeMock";

// Datos simulados (front-first). Se intercambian por consultas a Supabase
// en su fase. Copy en registro mexicano, a tono con la marca.

// Las 12 categorías: fuente de verdad para onboarding, filtros y el composer.
// (Luego las administra el panel.)
export const CATEGORIES = [
  "Arte",
  "Ciencia",
  "Libros",
  "Cultura",
  "Tecnología",
  "Viajes",
  "Cine",
  "Naturaleza",
  "Cocina",
  "Deportes",
  "Música",
  "Historia",
];

// Filtros de El Pub: «Todos» + las categorías activas.
export const TAGS = ["Todos", ...CATEGORIES.slice(0, 8)];

export const julio: Profile = { id: "u1", username: "julio", displayName: "Julio", avatarColor: "ink" };
export const maria: Profile = { id: "u2", username: "maria", displayName: "María", avatarColor: "grana" };
export const ines: Profile = { id: "u3", username: "ines", displayName: "Inés", avatarColor: "ocre" };
export const tomas: Profile = { id: "u4", username: "tomas", displayName: "Tomás", avatarColor: "grana" };
export const renata: Profile = { id: "u5", username: "renata", displayName: "Renata", avatarColor: "ink" };
export const sof: Profile = { id: "u6", username: "sof", displayName: "Sof", avatarColor: "ocre" };

export const FLOWS: Flow[] = [
  {
    id: "f1",
    title: "Nueve minutos sobre el barro",
    excerpt:
      "Hoy quiero hablar de algo que llevo pensando entre el barro y los datos: cómo lo que se moldea con las manos también guarda memoria, y por qué la voz es el primer molde.",
    author: julio,
    durationSeconds: 540,
    ageMinutes: 120,
    tag: "Arte",
    coverKind: "escher",
    likeCount: 128,
    commentCount: 14,
    liked: false,
    bodyMd: POLISHED_MD,
    transcriptRaw: RAW_TRANSCRIPT,
  },
  {
    id: "f2",
    title: "Cuando una voz se vuelve archivo",
    excerpt:
      "No es lo mismo escribir que hablar. La transcripción guarda las palabras, pero el audio guarda las dudas, las pausas, el cuerpo de quien habla.",
    author: maria,
    durationSeconds: 360,
    ageMinutes: 1440,
    tag: "Cultura",
    coverKind: "turrell",
    likeCount: 86,
    commentCount: 9,
    liked: false,
  },
  {
    id: "f3",
    title: "La ciencia también se cuenta en voz alta",
    excerpt:
      "Pasé años escribiendo papers que nadie leía completos. Hoy grabé en siete minutos la idea que de verdad importa, y por fin suena a lo que es.",
    author: ines,
    durationSeconds: 420,
    ageMinutes: 240,
    tag: "Ciencia",
    coverKind: "flavin",
    likeCount: 203,
    commentCount: 27,
    liked: true,
  },
  {
    id: "f4",
    title: "Un mapa hablado de la ciudad",
    excerpt:
      "Caminé sin Google Maps por una ciudad que no conocía y grabé lo que me iban diciendo los desconocidos. Un mapa que solo existe en voz.",
    author: tomas,
    durationSeconds: 300,
    ageMinutes: 480,
    tag: "Viajes",
    coverKind: "collage",
    likeCount: 54,
    commentCount: 6,
    liked: false,
  },
  {
    id: "f5",
    title: "Releer en voz alta lo que no entendí",
    excerpt:
      "Hay libros que solo se abren cuando los dices. Grabé el párrafo que llevo un año sin entender y, al oírme, por fin lo escuché.",
    author: renata,
    durationSeconds: 510,
    ageMinutes: 60,
    tag: "Libros",
    coverKind: "turrell",
    likeCount: 71,
    commentCount: 11,
    liked: false,
  },
  {
    id: "f6",
    title: "El cine que se escucha mejor que se ve",
    excerpt:
      "Cerré los ojos en la última función y descubrí otra película. Aquí va lo que oí cuando dejé de mirar.",
    author: sof,
    durationSeconds: 393,
    ageMinutes: 30,
    tag: "Cine",
    coverKind: "collage",
    likeCount: 39,
    commentCount: 4,
    liked: false,
  },
];

export const TRENDING: TrendingTag[] = [
  { name: "Arte", flows: 1200 },
  { name: "Cultura", flows: 860 },
  { name: "Ciencia", flows: 540 },
];

export const SUGGESTED: { profile: Profile; topics: string }[] = [
  { profile: renata, topics: "Libros · Cine" },
  { profile: tomas, topics: "Viajes · Naturaleza" },
  { profile: maria, topics: "Cultura · Arte" },
];
