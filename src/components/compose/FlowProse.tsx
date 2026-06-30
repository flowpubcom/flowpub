import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/cn";

// Renderiza markdown (subconjunto de la marca) con tokens: cuerpo Fraunces,
// blockquote con barra grana. Reusado por el composer y la página del Flow.
export function FlowProse({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  return (
    <div className={cn("font-serif text-ink", className)}>
      <ReactMarkdown
        components={{
          h2: ({ children }) => (
            <h2 className="mb-3 mt-7 font-serif text-[24px] font-medium leading-snug text-ink first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 font-serif text-[20px] font-medium text-ink">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-[18px] leading-[1.7] text-ink">{children}</p>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-5 border-l-2 border-grana pl-4 text-[18px] italic leading-[1.6] text-text-2">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1.5 pl-5 text-[18px] leading-[1.6] text-ink marker:text-text-3">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-[18px] leading-[1.6] text-ink marker:text-text-3">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-ink">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-grana underline underline-offset-2 hover:text-grana-700"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-6 border-line" />,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
