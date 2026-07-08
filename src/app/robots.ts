import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Privadas, gateadas o sin valor para búsqueda: fuera del índice. Las
        // rutas gateadas redirigen a /entrar, así que dejarlas rastreables solo
        // desperdicia presupuesto y podría indexar pantallas de login.
        disallow: [
          "/api/",
          "/auth/",
          "/componer",
          "/entrar",
          "/restablecer",
          "/perfil",
          "/mensajes",
          "/notificaciones",
          "/admin",
          "/i/",
          "/styleguide",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
