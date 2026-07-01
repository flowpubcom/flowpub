import { cn } from "@/lib/cn";
import { FlowMark } from "./FlowMark";
import { Wordmark } from "./Wordmark";

export interface LogoProps {
  className?: string;
  markSize?: number;
  textSize?: number;
  breathe?: boolean;
  /** Solo la vírgula, sin wordmark. */
  markOnly?: boolean;
}

/** Marca completa: vírgula + wordmark, en color tinta (ink). */
export function Logo({
  className,
  markSize = 30,
  textSize = 24,
  breathe = true,
  markOnly = false,
}: LogoProps) {
  return (
    <span
      className={cn("fp-logo inline-flex items-center gap-2 text-ink", className)}
    >
      <FlowMark size={markSize} breathe={breathe} />
      {!markOnly && <Wordmark size={textSize} />}
    </span>
  );
}
