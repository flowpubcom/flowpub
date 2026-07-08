"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Lock,
  Moon,
  Sun,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { FlowMark, Wordmark } from "@/components/brand";
import { Cover } from "@/components/cover";
import { useI18n } from "@/providers/I18nProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useSound } from "@/providers/SoundProvider";

// Manual de marca FlowPub, vivo y bilingüe (switch ES/EN real vía setLang
// global). Copy colocado con `tr(es, en)` — más legible que un diccionario
// aparte para una página única. Todo por tokens; los hex «crudos» aquí son la
// paleta bloqueada que el manual DOCUMENTA (su única sede legítima, como el OG).

// ── la vírgula: un solo path (vinculante, = FlowMark) ───────────────────────
const VIRGULA =
  "M 96 176 C 140 172 176 140 176 100 C 176 56 140 24 100 24 C 60 24 26 56 26 100 C 26 138 56 166 96 156 C 130 148 150 124 150 100 C 150 76 130 60 108 64 C 92 67 86 80 92 92";

// ── paleta base (fija en ambos temas) ───────────────────────────────────────
const BASE = [
  { name: "tinta", hex: "#1A1714", role: ["Tinta: texto y trazo", "Ink: text & stroke"] },
  { name: "grana", hex: "#C0303A", reserved: true, role: ["Acento — reservado", "Accent — reserved"] },
  { name: "grana-700", hex: "#9A2530", role: ["Grana profundo", "Deep grana"] },
  { name: "ocre", hex: "#D98A3D", role: ["Acento cálido", "Warm accent"] },
  { name: "amate", hex: "#F2EFE8", role: ["Lienzo", "Canvas"] },
  { name: "amate-2", hex: "#E6DFD0", role: ["Lienzo en sombra", "Canvas shade"] },
  { name: "papel", hex: "#FBFAF6", role: ["Cards", "Cards"] },
  { name: "champagne", hex: "#F6D49A", role: ["Palabra activa (karaoke)", "Active word (karaoke)"] },
  { name: "ok", hex: "#2E9A5B", role: ["Éxito", "Success"] },
] as const;

// ── roles semánticos (claro ↔ oscuro) ───────────────────────────────────────
const SEMANTIC = [
  { name: "ink", light: "#1A1714", dark: "#F2EFE8", role: ["Texto principal", "Primary text"] },
  { name: "ink-on", light: "#F2EFE8", dark: "#1A1714", role: ["Texto sobre tinta", "Text on ink"] },
  { name: "text-2", light: "#6E685D", dark: "#B3AB9D", role: ["Texto secundario (AA)", "Secondary text (AA)"] },
  { name: "text-3", light: "#9C968A", dark: "#867F72", role: ["Texto mute", "Muted text"] },
  { name: "surface", light: "#FBFAF6", dark: "#1E1A16", role: ["Superficie", "Surface"] },
  { name: "surface-2", light: "#F8F5EF", dark: "#191510", role: ["Superficie 2", "Surface 2"] },
  { name: "surface-3", light: "#F2EFE8", dark: "#2A241D", role: ["Superficie 3", "Surface 3"] },
  { name: "grana-text", light: "#C0303A", dark: "#EC9DA2", role: ["Grana como texto (AA)", "Grana as text (AA)"] },
] as const;

const SOUNDS = [
  { type: "rec", hz: "220 Hz", label: ["Grabar", "Record"] },
  { type: "pop", hz: "700 Hz", label: ["Confirmar", "Confirm"] },
  { type: "click", hz: "400 Hz", label: ["Clic", "Click"] },
  { type: "soft", hz: "320 Hz", label: ["Suave", "Soft"] },
  { type: "tick", hz: "540 Hz", label: ["Tick", "Tick"] },
] as const;

const COVERS = [
  { kind: "escher", seed: "arte", label: ["Escher · LeWitt", "Escher · LeWitt"], note: ["Isométrico imposible", "Impossible isometric"] },
  { kind: "turrell", seed: "ciencia", label: ["Turrell", "Turrell"], note: ["Apertura de luz", "Light aperture"] },
  { kind: "flavin", seed: "cultura", label: ["Flavin", "Flavin"], note: ["Neón", "Neon"] },
  { kind: "collage", seed: "viajes", label: ["Collage 90s", "90s collage"], note: ["Ben-Day · papel", "Ben-Day · paper"] },
] as const;

const SECTIONS = [
  { id: "marca", label: ["La marca", "The mark"] },
  { id: "wordmark", label: ["Wordmark", "Wordmark"] },
  { id: "color", label: ["Color", "Color"] },
  { id: "tipografia", label: ["Tipografía", "Typography"] },
  { id: "movimiento", label: ["Movimiento", "Motion"] },
  { id: "sonido", label: ["Sonido", "Sound"] },
  { id: "portadas", label: ["Portadas", "Covers"] },
  { id: "voz", label: ["Voz y tono", "Voice & tone"] },
  { id: "descargas", label: ["Descargas", "Downloads"] },
] as const;

// ── activos descargables ────────────────────────────────────────────────────
function virgulaSvg(color = "#1A1714"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none">
  <path d="${VIRGULA}" stroke="${color}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
}

function lockupSvg(color = "#1A1714"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200" viewBox="0 0 640 200" fill="none">
  <path d="${VIRGULA}" stroke="${color}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="212" y="134" font-family="Fraunces, Georgia, serif" font-size="108" font-weight="500" letter-spacing="-1.5" fill="${color}"><tspan font-style="italic">Flow</tspan>Pub</text>
</svg>
`;
}

const TOKENS_CSS = `/* FlowPub — tokens de marca «tinta, grana y amate» */
:root {
  --tinta: #1a1714;
  --grana: #c0303a;      /* reservado: grabar, publicar, like, CTA, focus */
  --grana-700: #9a2530;
  --ocre: #d98a3d;
  --amate: #f2efe8;
  --amate-2: #e6dfd0;
  --papel: #fbfaf6;
  --champagne: #f6d49a;
  --ok: #2e9a5b;

  --ink: #1a1714;
  --ink-on: #f2efe8;
  --text-2: #6e685d;
  --text-3: #9c968a;
  --surface: #fbfaf6;
  --surface-2: #f8f5ef;
  --surface-3: #f2efe8;
  --grana-text: #c0303a;
  --line: rgba(26, 23, 20, 0.12);
}
[data-theme="dark"] {
  --ink: #f2efe8;
  --ink-on: #1a1714;
  --text-2: #b3ab9d;
  --text-3: #867f72;
  --surface: #1e1a16;
  --surface-2: #191510;
  --surface-3: #2a241d;
  --grana-text: #ec9da2;
  --line: rgba(242, 239, 232, 0.12);
}
`;

function tokensJson(): string {
  const base = Object.fromEntries(BASE.map((c) => [c.name, c.hex]));
  const light = Object.fromEntries(SEMANTIC.map((c) => [c.name, c.light]));
  const dark = Object.fromEntries(SEMANTIC.map((c) => [c.name, c.dark]));
  return JSON.stringify(
    {
      name: "FlowPub",
      palette: "tinta, grana y amate",
      base,
      semantic: { light, dark },
      typography: { serif: "Fraunces", sans: "Hanken Grotesk", mono: "Space Mono" },
    },
    null,
    2,
  );
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── piezas ──────────────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-grana-text">
      {children}
    </p>
  );
}

function Section({
  id,
  n,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string;
  n: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line py-14 lg:py-20">
      <div className="mb-8 flex items-start gap-4">
        <span className="mt-1 font-mono text-[13px] text-text-2">{n}</span>
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-1 font-serif text-[clamp(28px,4vw,40px)] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
            {title}
          </h2>
          {intro && (
            <p className="mt-3 max-w-[62ch] font-serif text-[17px] leading-relaxed text-text-2">
              {intro}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function DownloadButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fp-hit-y inline-flex items-center gap-2 rounded-pill border border-line-2 bg-surface px-4 py-2 font-sans text-[13px] font-semibold text-ink transition-colors duration-150 ease-flow hover:border-ink hover:bg-ink hover:text-ink-on"
    >
      <Download size={15} />
      {label}
    </button>
  );
}

function Swatch({
  name,
  bg,
  hexLabel,
  role,
  reserved,
  dual,
}: {
  name: string;
  bg: string;
  hexLabel: string;
  role: string;
  reserved?: boolean;
  dual?: { light: string; dark: string };
}) {
  const { lang } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hexLabel);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard bloqueado: no pasa nada */
    }
  };
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {dual ? (
        <div className="flex h-20">
          <div className="flex-1" style={{ background: dual.light }} />
          <div className="flex-1" style={{ background: dual.dark }} />
        </div>
      ) : (
        <div className="h-20" style={{ background: bg }} />
      )}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-mono text-[12px] font-bold text-ink">
              {name}
            </p>
            {reserved && (
              <span
                className="inline-flex items-center gap-0.5 rounded-pill bg-grana-wash px-1.5 py-px font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-grana-700"
                title={lang === "es" ? "Reservado" : "Reserved"}
              >
                <Lock size={9} aria-hidden />
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate font-sans text-[11px] text-text-2">{role}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label={`${lang === "es" ? "Copiar" : "Copy"} ${hexLabel}`}
          className="fp-hit grid h-7 w-7 flex-none place-items-center rounded-md text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
        >
          {copied ? <Check size={14} className="text-ok" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── manual ──────────────────────────────────────────────────────────────────
export function BrandGuide() {
  const { lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const { play } = useSound();
  const tr = (es: string, en: string) => (lang === "es" ? es : en);

  return (
    <div className="min-h-dvh">
      {/* barra superior */}
      <header className="glass sticky top-0 z-20 border-b border-line-soft">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <Link href="/" aria-label="FlowPub" className="flex items-center gap-2 text-ink">
            <FlowMark size={26} />
            <Wordmark size={20} />
            <span className="rounded-pill border border-line-2 bg-surface-2 px-1.5 py-[3px] font-mono text-[9px] font-bold uppercase leading-none tracking-[0.16em] text-text-2">
              beta
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {/* switch de idioma */}
            <div
              role="group"
              aria-label={tr("Idioma", "Language")}
              className="flex items-center rounded-pill border border-line-2 bg-surface p-[3px]"
            >
              {(["es", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "fp-hit-y rounded-pill px-2.5 py-1 font-sans text-[12px] font-semibold uppercase transition-colors duration-150",
                    lang === l
                      ? "bg-ink text-ink-on"
                      : "text-text-2 hover:text-ink",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label={tr("Cambiar tema", "Toggle theme")}
              className="fp-hit-y grid h-9 w-9 place-items-center rounded-pill border border-line-2 bg-surface text-text-2 transition-colors hover:text-ink"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link
              href="/"
              className="hidden rounded-pill bg-grana px-4 py-2 font-sans text-[13px] font-semibold text-white shadow-[var(--shadow-grana)] transition-transform duration-150 ease-flow active:scale-[.96] sm:inline-flex"
            >
              {tr("Ir al Pub", "Go to the Pub")}
            </Link>
          </div>
        </div>
        {/* nav de secciones */}
        <nav className="border-t border-line-soft">
          <div className="mx-auto flex max-w-[1080px] gap-1 overflow-x-auto px-4 py-2 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="fp-hit-y flex-none rounded-pill px-3 py-1.5 font-sans text-[12.5px] font-medium text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
              >
                {tr(s.label[0], s.label[1])}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 pb-24 lg:px-8">
        {/* hero */}
        <section className="py-16 lg:py-24">
          <Eyebrow>{tr("Identidad de marca", "Brand identity")}</Eyebrow>
          <h1 className="mt-3 max-w-[16ch] font-serif text-[clamp(40px,8vw,76px)] font-medium leading-[0.98] tracking-[-0.03em] text-ink">
            {tr("La voz que se vuelve publicación.", "The voice that becomes a publication.")}
          </h1>
          <p className="mt-6 max-w-[60ch] font-serif text-[19px] leading-relaxed text-text-2">
            {tr(
              "FlowPub es voice-first: hablas y la voz se vuelve un artículo con portada, sin perder nunca el audio ni el transcript. Esta es su identidad —«tinta, grana y amate», un códice mesoamericano hecho software— y cómo usarla bien.",
              "FlowPub is voice-first: you speak and your voice becomes an article with a cover, never losing the audio or the transcript. This is its identity — “ink, grana and amate,” a Mesoamerican codex turned software — and how to use it well.",
            )}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-8">
            <FlowMark size={92} strokeWidth={13} className="text-ink" />
            <div className="h-14 w-px bg-line" aria-hidden />
            <div>
              <Wordmark size={44} />
              <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.2em] text-text-2">
                Speak · Flow · Publish
              </p>
            </div>
          </div>
        </section>

        {/* 01 · la marca */}
        <Section
          id="marca"
          n="01"
          eyebrow={tr("La marca", "The mark")}
          title={tr("La vírgula", "The vírgula")}
          intro={tr(
            "La vírgula es la voluta de la palabra en los códices: el aliento que se vuelve signo. Es un solo trazo monolínea —una gota dorada que gira—, con puntas redondas. Está viva: se dibuja al aparecer, respira en reposo y se inclina al pasar el cursor.",
            "The vírgula is the speech scroll of the codices: breath turning into sign. It’s a single monoline stroke — a golden drop that curls — with round caps. It’s alive: it draws itself in, breathes at rest, and tilts on hover.",
          )}
        >
          <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <div className="grid place-items-center rounded-card border border-line bg-surface py-16">
              <FlowMark size={168} strokeWidth={13} className="text-ink" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-card border border-line bg-surface p-5">
                <p className="font-sans text-[13px] font-semibold text-ink">
                  {tr("Reglas", "Rules")}
                </p>
                <ul className="mt-3 flex flex-col gap-2 font-sans text-[13.5px] leading-snug text-text-2">
                  <li>{tr("• Un solo path. Nunca la redibujes ni la rellenes.", "• A single path. Never redraw or fill it.")}</li>
                  <li>{tr("• Trazo = color de texto (currentColor); puntas redondas.", "• Stroke = text color (currentColor); round caps.")}</li>
                  <li>{tr("• Aire libre alrededor ≥ el 40% de su alto.", "• Clear space around it ≥ 40% of its height.")}</li>
                  <li>{tr("• Tamaño mínimo 20 px; por debajo pierde la voluta.", "• Minimum size 20 px; below that the curl is lost.")}</li>
                  <li>{tr("• No la rotes, deformes ni le pongas sombra dura.", "• Don’t rotate, distort, or hard-shadow it.")}</li>
                </ul>
              </div>
              <div className="rounded-card border border-line bg-surface-2 p-5">
                <p className="font-sans text-[12px] leading-snug text-text-2">
                  {tr(
                    "Es la única «emoji» de la marca. En claro va en tinta; en oscuro, en amate. El acento grana se reserva para lo vivo (grabar, publicar).",
                    "It’s the brand’s only “emoji.” On light it’s ink; on dark, amate. The grana accent is reserved for what’s alive (record, publish).",
                  )}
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* 02 · wordmark */}
        <Section
          id="wordmark"
          n="02"
          eyebrow={tr("Wordmark", "Wordmark")}
          title="FlowPub"
          intro={tr(
            "El wordmark se compone en Fraunces: «Flow» en itálica (la voz, en movimiento) y «Pub» en romana (lo que queda publicado). Juntos, la vírgula y el wordmark forman el lockup.",
            "The wordmark is set in Fraunces: “Flow” in italic (the voice, in motion) and “Pub” in roman (what stays published). Together, the vírgula and the wordmark form the lockup.",
          )}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid place-items-center rounded-card border border-line bg-surface py-14">
              <Wordmark size={56} />
            </div>
            <div className="flex items-center justify-center gap-4 rounded-card border border-line bg-surface py-14">
              <FlowMark size={56} strokeWidth={14} className="text-ink" />
              <Wordmark size={44} />
            </div>
          </div>
          <p className="mt-4 font-sans text-[13px] text-text-2">
            {tr(
              "En texto corrido se escribe «FlowPub», una sola palabra, sin espacio. Nunca «Flowpub» ni «FLOWPUB».",
              "In running text it’s written “FlowPub,” one word, no space. Never “Flowpub” or “FLOWPUB.”",
            )}
          </p>
        </Section>

        {/* 03 · color */}
        <Section
          id="color"
          n="03"
          eyebrow={tr("Color", "Color")}
          title={tr("Tinta, grana y amate", "Ink, grana and amate")}
          intro={tr(
            "La paleta nace del códice: la tinta negra, la grana cochinilla (ese rojo que México le dio al mundo) y el amate, el papel de corteza. La grana está reservada: grabar, publicar, like activo, CTA primario y el focus ring. Nada más es rojo.",
            "The palette comes from the codex: black ink, cochineal grana (the red Mexico gave the world), and amate, bark paper. Grana is reserved: record, publish, active like, primary CTA, and the focus ring. Nothing else is red.",
          )}
        >
          <p className="mb-3 font-sans text-[13px] font-semibold text-ink">
            {tr("Paleta base (fija en ambos temas)", "Base palette (fixed in both themes)")}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {BASE.map((c) => (
              <Swatch
                key={c.name}
                name={c.name}
                bg={c.hex}
                hexLabel={c.hex}
                role={tr(c.role[0], c.role[1])}
                reserved={Boolean((c as { reserved?: boolean }).reserved)}
              />
            ))}
          </div>

          <p className="mb-3 mt-8 font-sans text-[13px] font-semibold text-ink">
            {tr("Roles semánticos (claro ↔ oscuro)", "Semantic roles (light ↔ dark)")}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {SEMANTIC.map((c) => (
              <Swatch
                key={c.name}
                name={c.name}
                bg={c.light}
                hexLabel={`${c.light} / ${c.dark}`}
                role={tr(c.role[0], c.role[1])}
                dual={{ light: c.light, dark: c.dark }}
              />
            ))}
          </div>
          <p className="mt-4 font-sans text-[12px] text-text-2">
            {tr(
              "Los acentos (grana, ocre) no cambian entre temas; solo voltean las superficies y el texto. El contraste se mide en vivo: el texto secundario cumple AA.",
              "Accents (grana, ocre) don’t change between themes; only surfaces and text flip. Contrast is measured live: secondary text meets AA.",
            )}
          </p>
        </Section>

        {/* 04 · tipografía */}
        <Section
          id="tipografia"
          n="04"
          eyebrow={tr("Tipografía", "Typography")}
          title={tr("Tres voces", "Three voices")}
          intro={tr(
            "Cada familia tiene un papel. Fraunces es la voz; Hanken Grotesk, el chrome; Space Mono, los datos. No se mezclan roles.",
            "Each family has a role. Fraunces is the voice; Hanken Grotesk, the chrome; Space Mono, the data. Roles don’t mix.",
          )}
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-card border border-line bg-surface p-6">
              <div className="flex items-baseline justify-between">
                <Eyebrow>{tr("La voz", "The voice")}</Eyebrow>
                <span className="font-mono text-[11px] text-text-2">Fraunces · 400 / 500</span>
              </div>
              <p className="mt-2 font-serif text-[34px] font-medium leading-tight text-ink">
                {tr("Habla. FlowPub lo vuelve publicación.", "Speak. FlowPub turns it into a publication.")}
              </p>
              <p className="mt-1 font-sans text-[12.5px] text-text-2">
                {tr(
                  "Serif con optical sizing: titulares, cuerpo del artículo, transcripts. La itálica marca «Flow».",
                  "Serif with optical sizing: headlines, article body, transcripts. Italic marks “Flow.”",
                )}
              </p>
            </div>
            <div className="rounded-card border border-line bg-surface p-6">
              <div className="flex items-baseline justify-between">
                <Eyebrow>{tr("El chrome", "The chrome")}</Eyebrow>
                <span className="font-mono text-[11px] text-text-2">Hanken Grotesk · 400 / 500 / 600</span>
              </div>
              <p className="mt-2 font-sans text-[26px] font-semibold text-ink">
                {tr("Grabar · Publicar · Seguir · Ajustes", "Record · Publish · Follow · Settings")}
              </p>
              <p className="mt-1 font-sans text-[12.5px] text-text-2">
                {tr("Sans para la interfaz: botones, labels, navegación.", "Sans for the interface: buttons, labels, navigation.")}
              </p>
            </div>
            <div className="rounded-card border border-line bg-surface p-6">
              <div className="flex items-baseline justify-between">
                <Eyebrow>{tr("Los datos", "The data")}</Eyebrow>
                <span className="font-mono text-[11px] text-text-2">Space Mono · 400 / 700</span>
              </div>
              <p className="mt-2 font-mono text-[24px] text-ink">
                {tr("02:47 · 1.2k · 18+ · hace 3 min", "02:47 · 1.2k · 18+ · 3 min ago")}
              </p>
              <p className="mt-1 font-sans text-[12.5px] text-text-2">
                {tr("Mono para lo medido: duraciones, contadores, timestamps.", "Mono for the measured: durations, counters, timestamps.")}
              </p>
            </div>
          </div>
        </Section>

        {/* 05 · movimiento */}
        <Section
          id="movimiento"
          n="05"
          eyebrow={tr("Movimiento", "Motion")}
          title={tr("Calmo, sin rebote", "Calm, no bounce")}
          intro={tr(
            "Todo se mueve con un mismo easing y tres duraciones. Nada rebota. La marca respira; las partículas van a la deriva. Y todo se apaga bajo prefers-reduced-motion.",
            "Everything moves with one easing and three durations. Nothing bounces. The mark breathes; particles drift. And it all switches off under prefers-reduced-motion.",
          )}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-card border border-line bg-surface p-5">
              <p className="font-mono text-[12px] text-text-2">easing</p>
              <p className="mt-1 font-mono text-[15px] text-ink">cubic-bezier(.22,1,.36,1)</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-5">
              <p className="font-mono text-[12px] text-text-2">{tr("duraciones", "durations")}</p>
              <p className="mt-1 font-mono text-[15px] text-ink">140 · 240 · 320 ms</p>
            </div>
            <div className="grid place-items-center rounded-card border border-line bg-surface p-5">
              <FlowMark size={44} strokeWidth={14} className="text-ink" />
              <p className="mt-2 font-mono text-[11px] text-text-2">{tr("respira (hover: inclina)", "breathes (hover: tilts)")}</p>
            </div>
          </div>
        </Section>

        {/* 06 · sonido */}
        <Section
          id="sonido"
          n="06"
          eyebrow={tr("Sonido", "Sound")}
          title={tr("Cinco blips", "Five blips")}
          intro={tr(
            "El sonido de FlowPub son osciladores sine con envolvente exponencial de ~140 ms — nada de samples. Discretos, atados a gestos reales, y siempre con silencio global. Toca para escucharlos.",
            "FlowPub’s sound is sine oscillators with an ~140 ms exponential envelope — no samples. Discreet, tied to real gestures, and always with a global mute. Tap to hear them.",
          )}
        >
          <div className="flex flex-wrap gap-3">
            {SOUNDS.map((s) => (
              <button
                key={s.type}
                type="button"
                onClick={() => play(s.type)}
                className="fp-hit-y inline-flex items-center gap-2.5 rounded-pill border border-line-2 bg-surface px-4 py-2.5 font-sans text-[13px] font-semibold text-ink transition-colors duration-150 ease-flow hover:border-ink"
              >
                <Volume2 size={15} className="text-grana-text" />
                {tr(s.label[0], s.label[1])}
                <span className="font-mono text-[11px] font-normal text-text-2">{s.hz}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* 07 · portadas */}
        <Section
          id="portadas"
          n="07"
          eyebrow={tr("Portadas", "Covers")}
          title={tr("Cuatro direcciones de arte", "Four art directions")}
          intro={tr(
            "Cada Flow recibe una portada 16:9 abstracta, generada por semilla —barata, on-brand y determinista— con la paleta bloqueada y grano. Cuatro lenguajes, un mismo códice.",
            "Each Flow gets an abstract 16:9 cover, seeded — cheap, on-brand and deterministic — with the locked palette and grain. Four languages, one codex.",
          )}
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {COVERS.map((c) => (
              <figure key={c.kind} className="overflow-hidden rounded-card border border-line bg-surface">
                <div className="aspect-video">
                  <Cover kind={c.kind} seed={c.seed} />
                </div>
                <figcaption className="px-3 py-2.5">
                  <p className="font-sans text-[12.5px] font-semibold text-ink">{tr(c.label[0], c.label[1])}</p>
                  <p className="font-sans text-[11px] text-text-2">{tr(c.note[0], c.note[1])}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>

        {/* 08 · voz y tono */}
        <Section
          id="voz"
          n="08"
          eyebrow={tr("Voz y tono", "Voice & tone")}
          title={tr("Cálido y llano", "Warm and plain")}
          intro={tr(
            "FlowPub habla en español mexicano: cálido, directo, un poco íntimo —como quien te cuenta algo de cerca—. Sin corporativismo, sin gritar, sin emojis (la única es la vírgula).",
            "FlowPub speaks warmly and plainly: direct, a little intimate — like someone telling you something up close. No corporate-speak, no shouting, no emojis (the only one is the vírgula).",
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-card border border-line bg-surface p-6">
              <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-ok">
                {tr("Sí", "Do")}
              </p>
              <ul className="mt-3 flex flex-col gap-2 font-serif text-[15px] leading-snug text-ink">
                <li>{tr("«Habla hasta 3 minutos y lo volvemos publicación.»", "“Speak up to 3 minutes and we turn it into a publication.”")}</li>
                <li>{tr("«Tu voz, siempre disponible: el transcript no se esconde.»", "“Your voice, always available: the transcript is never hidden.”")}</li>
                <li>{tr("«Sé la primera voz de este tema.»", "“Be the first voice on this topic.”")}</li>
              </ul>
            </div>
            <div className="rounded-card border border-line bg-surface p-6">
              <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-grana-text">
                {tr("No", "Don’t")}
              </p>
              <ul className="mt-3 flex flex-col gap-2 font-serif text-[15px] leading-snug text-text-2">
                <li>{tr("«¡SUBE TU CONTENIDO AHORA!» (gritos, signos de más)", "“UPLOAD YOUR CONTENT NOW!” (shouting, exclamation pile-ups)")}</li>
                <li>{tr("«Leverage nuestra plataforma de audio-publishing.»", "“Leverage our audio-publishing platform.”")}</li>
                <li>{tr("«Haz clic aquí para más información.»", "“Click here for more information.”")}</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 font-sans text-[13px] text-text-2">
            {tr(
              "El chrome se traduce ES/EN; el contenido de un Flow se queda en su idioma (con «Traducir» opcional). La unidad es el «Flow»; el timeline es «el Pub».",
              "The chrome is translated ES/EN; a Flow’s content stays in its language (with optional “Translate”). The unit is the “Flow”; the timeline is “the Pub.”",
            )}
          </p>
        </Section>

        {/* 09 · descargas */}
        <Section
          id="descargas"
          n="09"
          eyebrow={tr("Descargas", "Downloads")}
          title={tr("Materiales", "Materials")}
          intro={tr(
            "Todo lo esencial para usar la marca bien. La vírgula es un SVG exacto; los tokens vienen listos para pegar en CSS o consumir como JSON.",
            "Everything essential to use the brand well. The vírgula is an exact SVG; the tokens come ready to paste into CSS or consume as JSON.",
          )}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DownloadButton
              label={tr("Vírgula (SVG)", "Vírgula (SVG)")}
              onClick={() => download("flowpub-virgula.svg", virgulaSvg(), "image/svg+xml")}
            />
            <DownloadButton
              label={tr("Lockup (SVG)", "Lockup (SVG)")}
              onClick={() => download("flowpub-lockup.svg", lockupSvg(), "image/svg+xml")}
            />
            <DownloadButton
              label={tr("Tokens (CSS)", "Tokens (CSS)")}
              onClick={() => download("flowpub-tokens.css", TOKENS_CSS, "text/css")}
            />
            <DownloadButton
              label={tr("Tokens (JSON)", "Tokens (JSON)")}
              onClick={() => download("flowpub-tokens.json", tokensJson(), "application/json")}
            />
            <a
              href="/icono-512"
              download="flowpub-icono-512.png"
              className="fp-hit-y inline-flex items-center gap-2 rounded-pill border border-line-2 bg-surface px-4 py-2 font-sans text-[13px] font-semibold text-ink transition-colors duration-150 ease-flow hover:border-ink hover:bg-ink hover:text-ink-on"
            >
              <Download size={15} />
              {tr("Ícono 512 (PNG)", "Icon 512 (PNG)")}
            </a>
            <a
              href="https://fonts.google.com/specimen/Fraunces"
              target="_blank"
              rel="noopener noreferrer"
              className="fp-hit-y inline-flex items-center gap-2 rounded-pill border border-line-2 bg-surface px-4 py-2 font-sans text-[13px] font-semibold text-ink transition-colors duration-150 ease-flow hover:border-ink"
            >
              {tr("Tipografías", "Typefaces")}
              <ArrowUpRight size={15} className="text-text-2" />
            </a>
          </div>
          <p className="mt-4 font-sans text-[12px] text-text-2">
            {tr(
              "El lockup en SVG usa Fraunces por nombre; para materiales finales, instala Fraunces, Hanken Grotesk y Space Mono (Google Fonts, licencia abierta) o convierte el texto a trazos.",
              "The SVG lockup references Fraunces by name; for final assets, install Fraunces, Hanken Grotesk and Space Mono (Google Fonts, open license) or outline the text.",
            )}
          </p>
        </Section>

        {/* pie */}
        <footer className="border-t border-line py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-ink">
              <FlowMark size={22} />
              <Wordmark size={17} />
            </div>
            <p className="font-sans text-[12px] text-text-2">
              {tr("Hecho por", "Made by")}{" "}
              <a
                href="https://juliosahagunsanchez.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-grana-text hover:opacity-80"
              >
                Julio Sahagún Sánchez
              </a>{" "}
              · flowpub.app
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
