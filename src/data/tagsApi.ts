import { createClient } from "@/lib/supabase/server";
import type { TagRow } from "./tags";

// Lectura server-side de la tabla `tags` (fuente de verdad del onboarding +
// filtros del Pub). RLS: anon puede leer las activas.
export type { TagRow } from "./tags";

export async function fetchTags(): Promise<TagRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, slug, name_es, name_en")
    .eq("active", true)
    .order("sort", { ascending: true });

  if (error || !data) return [];
  return data.map((t) => ({
    id: t.id as number,
    slug: t.slug as string,
    nameEs: t.name_es as string,
    nameEn: t.name_en as string,
  }));
}
