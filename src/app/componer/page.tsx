import type { Metadata } from "next";
import { Composer } from "@/components/compose/Composer";
import { fetchTags } from "@/data/tagsApi";

export const metadata: Metadata = { title: "Nuevo Flow" };

// Grabar un Flow — del habla a la publicación (máquina de 5 pasos).
// Traemos los temas REALES de la BD (incluye ASMR y los creados por usuarios) y
// se los pasamos al composer; si la lectura falla, el TagPicker cae a la estática.
export default async function ComponerPage() {
  const tags = await fetchTags();
  const tagNames = tags.map((t) => t.nameEs);
  return <Composer availableTags={tagNames.length ? tagNames : undefined} />;
}
