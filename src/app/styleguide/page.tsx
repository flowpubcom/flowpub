"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FlowMark, Logo, Wordmark } from "@/components/brand";
import {
  AudioPlayer,
  Avatar,
  Button,
  Card,
  Chip,
  Modal,
  Slider,
  Switch,
} from "@/components/ui";
import { Cover, type CoverKind } from "@/components/cover";
import { ThemeToggle, SoundToggle, LangToggle } from "@/components/chrome";

// Styleguide vivo — verifica tokens, tipografía, marca y la librería base en
// claro Y oscuro.

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line py-12">
      {eyebrow && (
        <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
          {eyebrow}
        </p>
      )}
      <h2 className="mb-7 font-serif text-[28px] font-normal tracking-[-0.02em] text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

const PALETTE = [
  { name: "tinta", var: "--tinta" },
  { name: "grana", var: "--grana" },
  { name: "grana-700", var: "--grana-700" },
  { name: "grana-wash", var: "--grana-wash" },
  { name: "ocre", var: "--ocre" },
  { name: "amate", var: "--amate" },
  { name: "amate-2", var: "--amate-2" },
  { name: "papel", var: "--papel" },
  { name: "champagne", var: "--champagne" },
  { name: "ok", var: "--ok" },
];

const SEMANTIC = [
  { name: "ink", var: "--ink" },
  { name: "ink-on", var: "--ink-on" },
  { name: "surface", var: "--surface" },
  { name: "surface-2", var: "--surface-2" },
  { name: "surface-3", var: "--surface-3" },
  { name: "text-2", var: "--text-2" },
  { name: "text-3", var: "--text-3" },
  { name: "line", var: "--line" },
  { name: "line-2", var: "--line-2" },
];

const TAGS = ["Todos", "Arte", "Ciencia", "Libros", "Cultura", "Tecnología"];
const KINDS: CoverKind[] = ["escher", "turrell", "flavin", "collage"];

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="h-16 w-full" style={{ background: `var(${varName})` }} />
      <div className="px-3 py-2">
        <p className="font-sans text-[13px] font-semibold text-ink">{name}</p>
        <p className="font-mono text-[11px] text-text-3">{varName}</p>
      </div>
    </div>
  );
}

export default function Styleguide() {
  const [activeTag, setActiveTag] = useState("Todos");
  const [notify, setNotify] = useState(true);
  const [autoCover, setAutoCover] = useState(false);
  const [maxMin, setMaxMin] = useState(9);
  const [maxTags, setMaxTags] = useState(3);
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24">
      <header className="glass sticky top-0 z-10 -mx-6 mb-2 flex items-center justify-between gap-4 border-b border-line-soft px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Volver"
            className="grid h-9 w-9 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
          >
            <ArrowLeft size={18} />
          </Link>
          <Logo markSize={26} textSize={20} />
          <span className="font-mono text-[12px] text-text-3">· styleguide</span>
        </div>
        <div className="flex items-center gap-2">
          <LangToggle />
          <SoundToggle />
          <ThemeToggle />
        </div>
      </header>

      <div className="py-10">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
          FlowPub · sistema
        </p>
        <h1 className="mt-2 font-serif text-[clamp(34px,6vw,52px)] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
          tinta, grana y amate
        </h1>
        <p className="mt-3 max-w-xl font-sans text-[15px] text-text-2">
          Fundación de la interfaz. Todo por tokens; cambia el tema arriba para
          ver la capa clara/oscura voltear.
        </p>
      </div>

      <Section title="Paleta" eyebrow="color">
        <p className="mb-3 font-sans text-[13px] text-text-2">
          Paleta cruda (fija en ambos temas)
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {PALETTE.map((c) => (
            <Swatch key={c.name} name={c.name} varName={c.var} />
          ))}
        </div>
        <p className="mb-3 mt-8 font-sans text-[13px] text-text-2">
          Tokens semánticos (voltean en oscuro)
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {SEMANTIC.map((c) => (
            <Swatch key={c.name} name={c.name} varName={c.var} />
          ))}
        </div>
      </Section>

      <Section title="Tipografía" eyebrow="type">
        <div className="space-y-6">
          <div>
            <p className="mb-1 font-mono text-[11px] text-text-3">
              Fraunces · la voz · display 400
            </p>
            <p className="font-serif text-[56px] font-normal leading-[1.02] tracking-[-0.02em] text-ink">
              La voz que se vuelve publicación
            </p>
          </div>
          <div>
            <p className="mb-1 font-mono text-[11px] text-text-3">
              Fraunces · cuerpo de lectura · 400 · 1.7
            </p>
            <p className="max-w-xl font-serif text-[18px] leading-[1.7] text-ink">
              No es lo mismo escribir que hablar. La transcripción guarda las
              palabras, pero el audio guarda las dudas, las pausas, el cuerpo de
              quien habla.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            <p className="font-sans text-[15px] text-ink">
              Hanken Grotesk · el chrome
            </p>
            <p className="font-mono text-[14px] text-ink">
              Space Mono · 03:41 / 09:00
            </p>
          </div>
        </div>
      </Section>

      <Section title="Marca" eyebrow="brand">
        <div className="flex flex-wrap items-end gap-10">
          <div className="flex items-end gap-6 text-ink">
            <FlowMark size={24} />
            <FlowMark size={36} />
            <FlowMark size={56} />
            <FlowMark size={56} breathe />
          </div>
          <div className="text-grana">
            <FlowMark size={48} />
            <p className="mt-1 font-mono text-[11px] text-text-3">
              currentColor → grana
            </p>
          </div>
          <Logo markSize={34} textSize={26} />
          <Wordmark size={32} />
        </div>
      </Section>

      <Section title="Botones" eyebrow="ui · exemplar">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Grabar un Flow</Button>
          <Button variant="secondary">Seguir</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="primary" disabled>
            Deshabilitado
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">sm</Button>
          <Button size="md">md</Button>
          <Button size="lg">lg</Button>
        </div>
      </Section>

      <Section title="Chips de filtro" eyebrow="ui">
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <Chip
              key={tag}
              active={activeTag === tag}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </Chip>
          ))}
          <Chip count={42}>Con contador</Chip>
        </div>
      </Section>

      <Section title="Avatares" eyebrow="ui">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name="Julio" size={56} />
          <Avatar name="María" color="grana" size={48} />
          <Avatar name="Inés" color="ocre" size={48} />
          <Avatar name="Renata" size={40} />
          <Avatar name="Tomás" size={34} />
        </div>
      </Section>

      <Section title="Cards" eyebrow="ui">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="font-serif text-[20px] text-ink">Card base</p>
            <p className="mt-1 font-sans text-[14px] text-text-2">
              Superficie con borde y sombra suave.
            </p>
          </Card>
          <Card hover>
            <p className="font-serif text-[20px] text-ink">Card con hover</p>
            <p className="mt-1 font-sans text-[14px] text-text-2">
              Pasa el cursor: se eleva.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Reproductor (vírgula)" eyebrow="ui · firma">
        <div className="flex flex-col items-start gap-5">
          <AudioPlayer durationSeconds={540} />
          <div className="w-full max-w-lg">
            <AudioPlayer durationSeconds={221} variant="full" />
          </div>
        </div>
      </Section>

      <Section title="Switches" eyebrow="ui">
        <div className="flex flex-wrap items-center gap-8">
          <Switch
            checked={notify}
            onCheckedChange={setNotify}
            label="Notificaciones"
          />
          <Switch
            checked={autoCover}
            onCheckedChange={setAutoCover}
            label="Portada automática"
          />
          <Switch checked={false} onCheckedChange={() => {}} disabled label="Bloqueado" />
        </div>
      </Section>

      <Section title="Sliders (límites del admin)" eyebrow="ui">
        <div className="grid max-w-md gap-7">
          <Slider
            label="Duración máxima"
            min={1}
            max={15}
            value={maxMin}
            onChange={setMaxMin}
            format={(v) => `${v}:00`}
          />
          <Slider
            label="Temas por Flow"
            min={1}
            max={5}
            value={maxTags}
            onChange={setMaxTags}
          />
        </div>
      </Section>

      <Section title="Modal" eyebrow="ui">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Abrir modal
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Para grabar un Flow, entra a FlowPub"
          footer={
            <div className="flex flex-col gap-2">
              <Button fullWidth>Continuar con Google</Button>
              <button
                onClick={() => setOpen(false)}
                className="font-sans text-[13px] text-text-3 underline underline-offset-2"
              >
                Ahora no, sigo escuchando
              </button>
            </div>
          }
        >
          <p className="font-sans text-[14px] text-text-2">
            Cualquiera puede escuchar el Pub. Para publicar tu voz, crea tu
            cuenta —toma menos de un minuto.
          </p>
        </Modal>
      </Section>

      <Section title="Portadas generativas" eyebrow="brand · firma visual">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {KINDS.map((kind) => (
            <div
              key={kind}
              className="overflow-hidden rounded-card border border-line"
            >
              <Cover kind={kind} seed={`demo-${kind}`} />
              <p className="px-3 py-2 font-mono text-[11px] text-text-3">{kind}</p>
            </div>
          ))}
        </div>
        <p className="mb-3 mt-8 font-sans text-[13px] text-text-2">
          «auto» — la dirección de arte sale del seed (determinista)
        </p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {["barro", "ciudad", "archivo", "voz-7"].map((seed) => (
            <div
              key={seed}
              className="overflow-hidden rounded-card border border-line"
            >
              <Cover seed={seed} />
              <p className="px-3 py-2 font-mono text-[11px] text-text-3">
                seed · {seed}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
