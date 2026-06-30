// Motor de sonido de la interfaz — «blips» WebAudio (oscilador sine, envelope
// exponencial ~140ms). No viene en los .dc.html; aquí está la fuente de verdad.
// Frecuencias tomadas del design-map: rec/pop/click/soft/tick.

export type BlipType = "rec" | "pop" | "click" | "soft" | "tick";

const FREQ: Record<BlipType, number> = {
  rec: 220,
  pop: 700,
  click: 400,
  soft: 320,
  tick: 540,
};

export interface SoundEngine {
  /** Reproduce un blip. Debe llamarse desde un gesto real del usuario. */
  blip: (type: BlipType, volume?: number) => void;
  /** Reanuda el AudioContext (útil tras el primer gesto). */
  resume: () => void;
}

/**
 * Crea el motor de sonido. El AudioContext se construye perezosamente en el
 * primer uso y se reanuda si el navegador lo dejó suspendido (autoplay policy).
 */
export function createSoundEngine(): SoundEngine {
  let ctx: AudioContext | null = null;

  function ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }

  function blip(type: BlipType, volume = 1) {
    const ac = ensure();
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(FREQ[type], now);

    const peak = Math.max(0.0002, 0.05 * volume);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  return { blip, resume: () => void ensure() };
}
