import type { NextConfig } from "next";

// Cabeceras de seguridad "seguras": no rompen Supabase/Gemini/Turnstile/Google
// (a diferencia de una CSP con script-src estricto, que exige probar cada host
// en vivo antes de encenderla). Anti-clickjacking, anti-MIME-sniffing, fuga de
// referer acotada, y HTTPS forzado. La CSP completa entra cuando se pueda
// verificar en prod sin tumbar el OAuth ni el widget de Turnstile.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Defensa extra de clickjacking (frame-ancestors gana sobre X-Frame-Options
  // en navegadores modernos); no restringe scripts, así que no rompe nada.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), camera=(), microphone=(self)",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // La «webxperience» de brag es una pieza estática autocontenida en
  // `public/brag/` (HTML + Three.js + assets). El rewrite deja que la URL
  // limpia `flowpub.app/brag` sirva su index sin exponer el `.html`.
  async rewrites() {
    return [{ source: "/brag", destination: "/brag/index.html" }];
  },
};

export default nextConfig;
