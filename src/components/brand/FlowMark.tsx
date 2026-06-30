import { cn } from "@/lib/cn";

// La vírgula (voluta de la palabra mesoamericana) — UN solo path, monolínea,
// stroke=currentColor, caps redondos. El path es vinculante (handoff README).
const VIRGULA =
  "M 96 176 C 140 172 176 140 176 100 C 176 56 140 24 100 24 C 60 24 26 56 26 100 C 26 138 56 166 96 156 C 130 148 150 124 150 100 C 150 76 130 60 108 64 C 92 67 86 80 92 92";

export interface FlowMarkProps
  extends Omit<React.SVGProps<SVGSVGElement>, "viewBox"> {
  size?: number;
  strokeWidth?: number;
  /** Respira (idle ambiente). Apagado dentro de prefers-reduced-motion. */
  breathe?: boolean;
  title?: string;
}

export function FlowMark({
  size = 30,
  strokeWidth = 14,
  breathe = false,
  title = "FlowPub",
  className,
  ...props
}: FlowMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      role="img"
      aria-label={title}
      className={cn(breathe && "fp-breathe", className)}
      {...props}
    >
      <path
        d={VIRGULA}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
