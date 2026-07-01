import type { Lang } from "@/lib/i18n/dictionaries";

// Tipo + helper de tags (puros; sin dependencias server-only para poder usarse
// en Client Components). El fetch server-side vive en `tagsApi.ts`.

export interface TagRow {
  id: number;
  slug: string;
  nameEs: string;
  nameEn: string;
}

/** Nombre localizado de un tag según el idioma del chrome. */
export function tagName(tag: TagRow, lang: Lang): string {
  return lang === "en" ? tag.nameEn : tag.nameEs;
}
