import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flowpub.lat";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Privadas o sin valor para búsqueda: fuera del índice.
        disallow: ["/api/", "/auth/", "/componer", "/entrar", "/styleguide"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
