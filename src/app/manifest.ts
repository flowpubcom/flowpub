import type { MetadataRoute } from "next";

// Manifiesto PWA: con esto (+ HTTPS) el navegador ofrece instalar FlowPub.
// Los iconos se generan de la vírgula en /icono-192 y /icono-512.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FlowPub",
    short_name: "FlowPub",
    description:
      "Transforma tu voz en publicaciones completas con IA. Graba hasta 3 minutos, obtén transcripción automática, edición e imágenes generativas al instante.",
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#f2efe8",
    theme_color: "#f4f1ea",
    lang: "es",
    icons: [
      { src: "/icono-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icono-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icono-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
