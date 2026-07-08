// Utilidades de formato. La capa de datos real reusará estas mismas funciones.

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** «9 min» — etiqueta de duración para los badges de portada. */
export function durationLabel(totalSeconds: number): string {
  return `${Math.max(1, Math.round(totalSeconds / 60))} min`;
}

/** «hace 2 h» / «2h ago» — desde antigüedad en minutos (sin Date → sin desfase SSR). */
export function relativeTime(ageMinutes: number, lang: "es" | "en" = "es"): string {
  if (ageMinutes < 60) {
    const m = Math.max(1, Math.round(ageMinutes));
    return lang === "es" ? `hace ${m} min` : `${m}m ago`;
  }
  if (ageMinutes < 1440) {
    const h = Math.round(ageMinutes / 60);
    return lang === "es" ? `hace ${h} h` : `${h}h ago`;
  }
  const d = Math.round(ageMinutes / 1440);
  return lang === "es" ? `hace ${d} d` : `${d}d ago`;
}

/** Primeras ~180 letras del markdown, sin marcas (extracto de tarjeta). */
export function excerptOf(md: string, max = 180): string {
  const plain = md
    .replace(/[#>*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 80 ? cut.slice(0, sp) : cut).trim()}…`;
}

/** 1200 → «1.2k». */
export function compactNumber(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
}

/** Umbrales de invitaciones canjeadas para cada estrella de la badge OG. */
export const OG_MILESTONES = [3, 6, 9] as const;

/** Nivel de badge OG por invitaciones canjeadas: 0 (sin badge) .. 3 (máximo). */
export function ogLevel(redemptions: number): 0 | 1 | 2 | 3 {
  if (redemptions >= OG_MILESTONES[2]) return 3;
  if (redemptions >= OG_MILESTONES[1]) return 2;
  if (redemptions >= OG_MILESTONES[0]) return 1;
  return 0;
}

/** Próximo umbral a alcanzar (null = ya tiene las 3 estrellas). */
export function nextOgMilestone(redemptions: number): number | null {
  const next = OG_MILESTONES.find((m) => redemptions < m);
  return next ?? null;
}

/** «7 de julio de 2026» / «July 7, 2026» — fecha completa de alta (perfil). */
export function fullDate(iso: string, lang: "es" | "en" = "es"): string {
  return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
