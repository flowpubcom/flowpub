// Normalización y saneo de enlaces del perfil (web + redes). Las redes se
// guardan como HANDLE limpio; la web como URL http(s) validada. Al renderizar
// se arma la liga canónica — así un `javascript:` u otro esquema NUNCA llega a
// un href (defensa contra XSS por enlaces del usuario).

export type Social = "instagram" | "x" | "tiktok" | "youtube";

/** Limpia un handle de red: quita @, URLs y deja solo caracteres válidos. */
export function normalizeHandle(raw: string): string {
  let h = raw.trim();
  // Si pegaron una URL, quédate con el último segmento del path.
  const urlMatch = h.match(/^https?:\/\/[^/]+\/(.+)$/i);
  if (urlMatch) h = urlMatch[1];
  h = h.replace(/[/?#].*$/, ""); // corta query/fragment/subpaths
  h = h.replace(/^@+/, ""); // @handle → handle
  h = h.replace(/[^a-zA-Z0-9._-]/g, ""); // solo caracteres de handle
  return h.slice(0, 40);
}

/**
 * Normaliza una web a una URL http(s) segura, o null si no es válida.
 * Rechaza esquemas peligrosos (javascript:, data:, etc.).
 */
export function normalizeWebsite(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  let url: URL;
  try {
    url = new URL(withProto);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname.includes(".")) return null; // exige un dominio con punto
  return url.toString();
}

/** Arma la liga canónica de una red a partir del handle limpio. */
export function socialUrl(platform: Social, handle: string): string {
  const h = normalizeHandle(handle);
  switch (platform) {
    case "instagram":
      return `https://instagram.com/${h}`;
    case "x":
      return `https://x.com/${h}`;
    case "tiktok":
      return `https://tiktok.com/@${h}`;
    case "youtube":
      return `https://youtube.com/@${h}`;
  }
}

/**
 * Defensa REAL al renderizar la web: parsea con `new URL` y exige http(s).
 * Devuelve la URL normalizada, o null si es inválida/peligrosa. Un valor
 * malformado guardado por REST (saltándose normalizeWebsite) ya no llega a un
 * href ni hace tronar un `new URL` aguas abajo.
 */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:"
      ? u.toString()
      : null;
  } catch {
    return null;
  }
}

/** Hostname legible de una URL ya validada (sin www.), o "" si no se puede. */
export function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
