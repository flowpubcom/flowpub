import type { CoverKind } from "@/lib/covers";

export type AvatarColor = "ink" | "grana" | "ocre";

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarColor?: AvatarColor;
  avatarUrl?: string | null;
}

export interface Flow {
  id: string;
  title: string;
  excerpt: string;
  author: Profile;
  durationSeconds: number;
  /** Antigüedad en minutos (mock). Real = derivado de created_at al leer. */
  ageMinutes: number;
  /** Tag primario (etiqueta visible). */
  tag: string;
  /** Slug del tag primario (filtros + páginas /tema/[slug]). */
  tagSlug?: string;
  coverKind: CoverKind;
  /** Foto subida por el autor; null = portada generativa (coverKind). */
  coverUrl?: string | null;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  /** Artículo pulido (markdown). Si falta, el lector arma uno del excerpt. */
  bodyMd?: string;
  /** Transcript crudo original. */
  transcriptRaw?: string;
  /** URL del audio real (Storage). */
  audioUrl?: string | null;
  /** Fecha de publicación ISO (SEO: JSON-LD, OpenGraph, sitemap). */
  createdAt?: string;
  /** Idioma del contenido (para el «Traducir» opt-in). */
  lang?: string;
  /** Estado del lector actual (enriquecido server-side si hay sesión). */
  saved?: boolean;
  followingAuthor?: boolean;
  /** draft | published | … (solo se expone al autor vía RLS). */
  status?: string;
}

export interface TrendingTag {
  name: string;
  slug: string;
  flows: number;
}
