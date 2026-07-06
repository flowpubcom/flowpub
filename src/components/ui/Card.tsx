import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Glow suave al pasar el cursor (Flow cards del Pub) — sin desplazarse. */
  hover?: boolean;
  /** Padding interno por defecto (p-6 ≈ 24px). */
  padded?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { hover = false, padded = true, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-card border border-line bg-surface shadow-[var(--shadow-card)]",
        padded && "p-6",
        hover &&
          "transition-shadow duration-200 ease-flow hover:shadow-[var(--shadow-glow)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
