import { cn } from "@/lib/cn";

const ACCENTS = ["ink", "grana", "ocre"] as const;
type Accent = (typeof ACCENTS)[number];
export type AvatarColor = "auto" | Accent;

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  /** «auto» elige color por hash del name. */
  color?: AvatarColor;
  className?: string;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Color determinista de avatar a partir del nombre. */
export function pickAvatarColor(name: string): Accent {
  return ACCENTS[hash(name) % ACCENTS.length];
}

const BG: Record<Accent, string> = {
  ink: "bg-ink text-ink-on",
  grana: "bg-grana text-amate",
  ocre: "bg-ocre text-amate",
};

/** Avatar de imagen o inicial (Fraunces itálica). Los acentos no voltean. */
export function Avatar({
  name,
  src,
  size = 34,
  color = "auto",
  className,
}: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn("rounded-pill object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const resolved = color === "auto" ? pickAvatarColor(name) : color;
  const initial = (name?.trim()?.[0] ?? "·").toUpperCase();

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-grid select-none place-items-center rounded-pill font-serif italic leading-none",
        BG[resolved],
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.44) }}
    >
      {initial}
    </span>
  );
}
