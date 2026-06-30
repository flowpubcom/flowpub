// Generación determinista de portadas: el MISMO seed → la MISMA portada.
// RNG sembrado (mulberry32) + hash de string (FNV-1a).

export type CoverKind = "escher" | "turrell" | "flavin" | "collage";
export const COVER_KINDS: CoverKind[] = [
  "escher",
  "turrell",
  "flavin",
  "collage",
];

/** Paleta bloqueada de las portadas (única excepción al «nada de hex»). */
export const COVER_PALETTE = {
  tinta: "#1A1714",
  grana: "#C0303A",
  grana700: "#9A2530",
  ocre: "#D98A3D",
  amate: "#F2EFE8",
  amate2: "#E6DFD0",
  champagne: "#F6D49A",
  papel: "#FBFAF6",
} as const;

export function hashSeed(seed: string | number): number {
  const s = String(seed);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** PRNG determinista en [0,1). */
export function mulberry32(seedInt: number) {
  let a = seedInt >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function kindFromSeed(seed: string | number): CoverKind {
  return COVER_KINDS[hashSeed(seed) % COVER_KINDS.length];
}

/** Id seguro para sufijar filtros/gradientes (evita colisiones entre Covers). */
export function sanitizeId(seed: string | number): string {
  return String(seed).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "0";
}
