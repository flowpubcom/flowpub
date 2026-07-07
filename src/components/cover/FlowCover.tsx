import { cn } from "@/lib/cn";
import { Cover, type CoverKind } from "./Cover";

/** Portada de un Flow: la foto del autor si subió una; si no, la generativa.
 *  Mismo contrato visual (16:9, slice) para que las cards no se enteren. */
export function FlowCover({
  coverUrl,
  kind,
  seed,
  title,
  className,
}: {
  coverUrl?: string | null;
  kind?: CoverKind | "auto";
  seed?: string | number;
  title?: string;
  className?: string;
}) {
  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt={title ?? ""}
        loading="lazy"
        className={cn("block aspect-[16/9] w-full object-cover", className)}
      />
    );
  }
  return <Cover kind={kind} seed={seed} title={title} className={className} />;
}
