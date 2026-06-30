import { cn } from "@/lib/cn";

export interface WordmarkProps {
  className?: string;
  /** Tamaño del texto en px. */
  size?: number;
}

/** «FlowPub» — «Flow» en itálica Fraunces, «Pub» romana. */
export function Wordmark({ className, size = 24 }: WordmarkProps) {
  return (
    <span
      className={cn("font-serif font-medium text-ink", className)}
      style={{ fontSize: size, letterSpacing: "-0.01em" }}
    >
      <span className="italic">Flow</span>
      Pub
    </span>
  );
}
