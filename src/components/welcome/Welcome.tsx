"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Globe,
  MessageCircle,
  Mic,
  Moon,
  PenLine,
  Quote,
  Send,
  User,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { FlowMark, Wordmark } from "@/components/brand";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/chrome/ThemeToggle";
import { LangToggle } from "@/components/chrome/LangToggle";
import { useTheme } from "@/providers/ThemeProvider";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";

// Fondo Three.js: solo cliente (WebGL). El gradiente/glow de CSS sostienen el
// fondo si no carga.
const ThreeStage = dynamic(() => import("./ThreeStage"), { ssr: false });

type Lang = "es" | "en";

const COPY: Record<Lang, {
  enter: string; pub: string;
  eyebrow: string; tagline: string; sub: string; cta: string; secondary: string; scroll: string;
  s2eyebrow: string; s2title: string; s2body: string;
  s3eyebrow: string; s3title: string;
  steps: { t: string; d: string }[];
  s4eyebrow: string; s4title: string; s4body: string;
  features: { t: string; d: string }[];
  s5eyebrow: string; s5title: string; s5body: string; s5cta: string;
  made: string; free: string; altPub: string; altFlowMobile: string;
}> = {
  es: {
    enter: "Entrar",
    pub: "El Pub",
    eyebrow: "Beta abierta",
    tagline: "La voz que se vuelve publicación.",
    sub: "Tocas grabar. Hablas hasta tres minutos. FlowPub lo vuelve un artículo con su portada —y guarda tu voz tal cual.",
    cta: "Grabar un Flow",
    secondary: "Explorar el Pub",
    scroll: "Desliza",
    s2eyebrow: "Por qué la voz",
    s2title: "Antes de la escritura, fue la voz.",
    s2body:
      "El relato es una de las piedras angulares de lo humano; la tradición oral, una de sus formas más hondas de conservar y de conectar. FlowPub devuelve la voz al centro —no un feed más, un lugar para ser escuchado.",
    s3eyebrow: "Así funciona",
    s3title: "Tres toques y ya.",
    steps: [
      { t: "Graba", d: "Toca el botón y habla. Sin guion, sin cámara, sin pose." },
      { t: "Se pule", d: "Gemini transcribe y ordena tus palabras en un artículo —sin perder tu voz." },
      { t: "Se publica", d: "Con una portada abstracta y tu audio original, siempre a un toque." },
    ],
    s4eyebrow: "El Pub",
    s4title: "Un timeline de voces reales.",
    s4body:
      "Cualquiera escucha y lee. Quien se registra publica, comenta —con texto o con voz—, sigue a otras voces y se escribe en privado.",
    features: [
      { t: "Comentarios de voz", d: "Con «Ver transcript» siempre a la mano." },
      { t: "Seguir y mensajes", d: "Voces que te mueven; conversaciones privadas." },
      { t: "Notificaciones en vivo", d: "Likes, respuestas y seguidores al momento." },
      { t: "Claro y oscuro", d: "Un códice de día y de noche." },
      { t: "Español e inglés", d: "El chrome se adapta a tu idioma." },
      { t: "Transcript crudo", d: "Tu voz original, siempre visible. Sin trucos." },
    ],
    s5eyebrow: "Es tu turno",
    s5title: "¿Listo? Saca el Flow.",
    s5body: "Escuchar el Pub es libre. Para publicar tu voz, entra —toma menos de un minuto.",
    s5cta: "Grabar un Flow",
    made: "Hecho por Julio Sahagún Sánchez",
    free: "Gratis · Beta abierta",
    altPub: "El Pub de FlowPub en escritorio",
    altFlowMobile: "Un Flow en móvil",
  },
  en: {
    enter: "Sign in",
    pub: "The Pub",
    eyebrow: "Open beta",
    tagline: "The voice that becomes a post.",
    sub: "Tap record. Talk for up to three minutes. FlowPub turns it into an article with its own cover —and keeps your voice, untouched.",
    cta: "Record a Flow",
    secondary: "Explore the Pub",
    scroll: "Scroll",
    s2eyebrow: "Why voice",
    s2title: "Before writing, there was the voice.",
    s2body:
      "Storytelling is one of the cornerstones of being human; oral tradition, one of its deepest ways to preserve and to connect. FlowPub puts the voice back at the center —not one more feed, a place to be heard.",
    s3eyebrow: "How it works",
    s3title: "Three taps, done.",
    steps: [
      { t: "Record", d: "Tap the button and talk. No script, no camera, no pose." },
      { t: "It's polished", d: "Gemini transcribes and shapes your words into an article —your voice intact." },
      { t: "It's published", d: "With an abstract cover and your original audio, always one tap away." },
    ],
    s4eyebrow: "The Pub",
    s4title: "A timeline of real voices.",
    s4body:
      "Anyone can listen and read. Registered users publish, comment —by text or voice—, follow other voices and message privately.",
    features: [
      { t: "Voice comments", d: "With “View transcript” always at hand." },
      { t: "Follow & messages", d: "Voices that move you; private conversations." },
      { t: "Live notifications", d: "Likes, replies and followers in real time." },
      { t: "Light & dark", d: "A codex by day and by night." },
      { t: "Spanish & English", d: "The chrome adapts to your language." },
      { t: "Raw transcript", d: "Your original voice, always visible. No tricks." },
    ],
    s5eyebrow: "Your turn",
    s5title: "Ready? Let it Flow.",
    s5body: "Listening to the Pub is free. To publish your voice, sign in —it takes under a minute.",
    s5cta: "Record a Flow",
    made: "Made by Julio Sahagún Sánchez",
    free: "Free · Open beta",
    altPub: "FlowPub's Pub on desktop",
    altFlowMobile: "A Flow on mobile",
  },
};

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.16 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-flow motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function Section({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative mx-auto flex min-h-[92vh] w-full max-w-[1080px] flex-col justify-center px-6 py-24",
        className,
      )}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-grana-text">
      {children}
    </p>
  );
}

export function Welcome() {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const { play } = useSound();
  const router = useRouter();
  const c = COPY[lang];
  const barRef = useRef<HTMLDivElement>(null);

  // Barra de progreso de scroll (grana). Sin re-render: toca el DOM directo.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        const p = Math.min(1, Math.max(0, window.scrollY / max));
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const record = () => {
    play("rec");
    router.push("/componer");
  };

  const stepIcons = [Mic, PenLine, Send];
  const featIcons = [Volume2, User, Bell, Moon, Globe, Quote];
  const shotDesktop = `/shots/pub-desktop-${theme}.png`;
  const shotMobile = `/shots/flow-mobile-${theme}.png`;

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* progreso */}
      <div
        ref={barRef}
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left scale-x-0 bg-grana"
        aria-hidden
      />

      {/* fondo generativo + glow (fijo detrás) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-1/2 top-[10%] h-[62vmin] w-[62vmin] -translate-x-1/2 rounded-full opacity-70 blur-[90px]"
          style={{ background: "radial-gradient(circle, var(--grana-wash), transparent 70%)" }}
        />
        <div
          className="absolute bottom-[6%] right-[8%] h-[42vmin] w-[42vmin] rounded-full opacity-40 blur-[100px]"
          style={{ background: "radial-gradient(circle, var(--champagne), transparent 70%)" }}
        />
        <ThreeStage dark={theme === "dark"} />
      </div>

      {/* header */}
      <header className="glass sticky top-0 z-40 border-b border-line-soft">
        <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between px-6 py-3">
          <Link
            href="/"
            aria-label="FlowPub"
            className="fp-logo inline-flex items-center gap-2 text-ink"
          >
            <FlowMark size={26} />
            <Wordmark size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <LangToggle className="hidden sm:inline-flex" />
            <ThemeToggle />
            <Link
              href="/entrar"
              onClick={() => play("click")}
              className="ml-1 hidden rounded-pill border border-line-2 px-4 py-1.5 font-sans text-[14px] font-semibold text-ink transition-colors hover:bg-[var(--hover)] sm:inline-block"
            >
              {c.enter}
            </Link>
          </div>
        </div>
      </header>

      {/* ── hero ── */}
      <Section className="items-center text-center">
        <Reveal>
          <FlowMark size={76} className="mx-auto mb-7 text-grana" />
        </Reveal>
        <Reveal delay={80}>
          <Eyebrow>{c.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={140}>
          <h1 className="font-serif text-[clamp(2.4rem,6vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.01em] text-ink">
            {c.tagline}
          </h1>
        </Reveal>
        <Reveal delay={220}>
          <p className="mx-auto mt-6 max-w-[42ch] font-sans text-[clamp(1rem,2.2vw,1.2rem)] leading-relaxed text-text-2">
            {c.sub}
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={record} className="px-7">
              <Mic size={18} />
              {c.cta}
            </Button>
            <Link
              href="/"
              onClick={() => play("click")}
              className="inline-flex h-12 items-center gap-2 rounded-pill border border-line-2 px-6 font-sans text-[15px] font-semibold text-ink transition-colors hover:bg-[var(--hover)]"
            >
              {c.secondary}
              <ArrowRight size={17} />
            </Link>
          </div>
          <p className="mt-4 font-mono text-[12px] text-text-2">{c.free}</p>
        </Reveal>
        <div
          className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 text-text-2"
          aria-hidden
        >
          <span className="font-sans text-[11px] uppercase tracking-[0.16em]">
            {c.scroll}
          </span>
          <ChevronDown size={18} className="fp-breathe" />
        </div>
      </Section>

      {/* ── por qué la voz ── */}
      <Section>
        <Reveal>
          <Quote size={30} className="mb-6 text-ocre" />
          <Eyebrow>{c.s2eyebrow}</Eyebrow>
          <h2 className="max-w-[16ch] font-serif text-[clamp(2rem,5vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.01em] text-ink">
            {c.s2title}
          </h2>
          <p className="mt-6 max-w-[54ch] font-sans text-[clamp(1rem,2.2vw,1.28rem)] leading-relaxed text-text-2">
            {c.s2body}
          </p>
        </Reveal>
      </Section>

      {/* ── así funciona ── */}
      <Section>
        <Reveal>
          <Eyebrow>{c.s3eyebrow}</Eyebrow>
          <h2 className="mb-12 font-serif text-[clamp(2rem,5vw,3.4rem)] font-medium tracking-[-0.01em] text-ink">
            {c.s3title}
          </h2>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-3">
          {c.steps.map((s, i) => {
            const Icon = stepIcons[i];
            return (
              <Reveal key={s.t} delay={i * 110}>
                <div className="h-full rounded-card border border-line bg-surface/70 p-7 backdrop-blur-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-tile bg-grana-wash text-grana-text">
                      <Icon size={20} />
                    </span>
                    <span className="font-mono text-[13px] text-text-3">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="font-serif text-[1.5rem] font-medium text-ink">
                    {s.t}
                  </h3>
                  <p className="mt-2 font-sans text-[15px] leading-relaxed text-text-2">
                    {s.d}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* ── el Pub (producto) ── */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <Eyebrow>{c.s4eyebrow}</Eyebrow>
              <h2 className="font-serif text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.1] tracking-[-0.01em] text-ink">
                {c.s4title}
              </h2>
              <p className="mt-5 max-w-[46ch] font-sans text-[clamp(1rem,2vw,1.18rem)] leading-relaxed text-text-2">
                {c.s4body}
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shotDesktop}
                alt={c.altPub}
                className="w-full rounded-lg border border-line shadow-[var(--shadow-window)]"
                loading="lazy"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shotMobile}
                alt={c.altFlowMobile}
                className="absolute -bottom-8 -right-4 hidden w-[30%] rounded-[18px] border border-line-2 shadow-[var(--shadow-window)] sm:block"
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── features ── */}
      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {c.features.map((f, i) => {
            const Icon = featIcons[i];
            return (
              <Reveal key={f.t} delay={(i % 3) * 90}>
                <div className="flex h-full gap-4 rounded-card border border-line bg-surface/60 p-6 backdrop-blur-sm">
                  <span className="mt-0.5 text-ocre">
                    <Icon size={22} />
                  </span>
                  <div>
                    <h3 className="font-sans text-[16px] font-semibold text-ink">
                      {f.t}
                    </h3>
                    <p className="mt-1 font-sans text-[14px] leading-relaxed text-text-2">
                      {f.d}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* ── cierre / CTA ── */}
      <Section className="items-center text-center">
        <Reveal>
          <FlowMark size={56} className="mx-auto mb-7 text-grana" />
          <Eyebrow>{c.s5eyebrow}</Eyebrow>
          <h2 className="font-serif text-[clamp(2.4rem,6vw,4rem)] font-medium leading-[1.05] tracking-[-0.01em] text-ink">
            {c.s5title}
          </h2>
          <p className="mx-auto mt-5 max-w-[40ch] font-sans text-[clamp(1rem,2.2vw,1.2rem)] leading-relaxed text-text-2">
            {c.s5body}
          </p>
          <div className="mt-9 flex justify-center">
            <Button size="lg" onClick={record} className="px-8">
              <Mic size={18} />
              {c.s5cta}
            </Button>
          </div>
        </Reveal>
        <footer className="mt-24 flex flex-col items-center gap-3">
          <Link href="/" aria-label="FlowPub" className="fp-logo text-ink">
            <Wordmark size={22} />
          </Link>
          <a
            href="https://juliosahagunsanchez.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-[13px] text-grana-text transition-opacity hover:opacity-80"
          >
            {c.made}
          </a>
          <p className="font-mono text-[12px] text-text-2">flowpub.app</p>
        </footer>
      </Section>
    </div>
  );
}
