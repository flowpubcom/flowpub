// Rate-limit sencillo para las APIs que cuestan (Gemini). Server-only.
//
// Es best-effort: vive en la memoria de cada instancia serverless, así que un
// límite puede reiniciarse si Vercel levanta una instancia nueva. Para el caso
// que nos importa (alguien reintentando en loop y quemando la cuota) alcanza:
// los loops pegan a la instancia caliente. Si algún día hace falta un límite
// duro global, el camino es Upstash/Redis o una tabla en Supabase.

type Rule = { limit: number; windowMs: number };

const hits = new Map<string, number[]>();

// De vez en cuando barre llaves viejas para que el Map no crezca sin fin.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 10 * 60_000) return;
  lastSweep = now;
  for (const [key, times] of hits) {
    if (times.length === 0 || now - times[times.length - 1] > 60 * 60_000) {
      hits.delete(key);
    }
  }
}

export interface RateResult {
  ok: boolean;
  /** Segundos sugeridos de espera cuando ok=false (header Retry-After). */
  retryAfter: number;
}

/**
 * Registra un hit de `key` y evalúa las reglas (ráfaga + sostenida).
 * Devuelve ok=false si CUALQUIER regla se excede; el hit no se cuenta en ese
 * caso (rechazados no consumen cuota).
 */
export function rateLimit(key: string, rules: Rule[]): RateResult {
  const now = Date.now();
  sweep(now);

  const maxWindow = Math.max(...rules.map((r) => r.windowMs));
  const times = (hits.get(key) ?? []).filter((t) => now - t < maxWindow);

  let retryAfter = 0;
  for (const rule of rules) {
    const inWindow = times.filter((t) => now - t < rule.windowMs);
    if (inWindow.length >= rule.limit) {
      const oldest = inWindow[0];
      retryAfter = Math.max(
        retryAfter,
        Math.ceil((rule.windowMs - (now - oldest)) / 1000),
      );
    }
  }
  if (retryAfter > 0) {
    hits.set(key, times);
    return { ok: false, retryAfter };
  }

  times.push(now);
  hits.set(key, times);
  return { ok: true, retryAfter: 0 };
}

/** Reglas por ruta: ráfaga corta + tope sostenido por hora. */
export const RATE_RULES = {
  // Un Flow legítimo = 1 transcripción; 5/min ya es alguien en loop.
  transcribe: [
    { limit: 5, windowMs: 60_000 },
    { limit: 30, windowMs: 60 * 60_000 },
  ],
  polish: [
    { limit: 5, windowMs: 60_000 },
    { limit: 30, windowMs: 60 * 60_000 },
  ],
  // Traducir es más barato y un lector curioso traduce varios Flows seguidos.
  translate: [
    { limit: 10, windowMs: 60_000 },
    { limit: 60, windowMs: 60 * 60_000 },
  ],
} satisfies Record<string, Rule[]>;
