import type { Metadata } from "next";
import { Composer } from "@/components/compose/Composer";

export const metadata: Metadata = { title: "Nuevo Flow" };

// Grabar un Flow — del habla a la publicación (máquina de 5 pasos).
export default function ComponerPage() {
  return <Composer />;
}
