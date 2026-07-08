import { Globe } from "lucide-react";
import { hostLabel, safeHref, socialUrl, type Social } from "@/lib/links";
import type { PublicProfile } from "@/data/profilesApi";

// Fila de enlaces del perfil: web + redes. Íconos monolínea propios (stroke =
// currentColor, marca-neutrales). Las ligas se ARMAN desde el handle limpio y
// la web pasa por safeHref → solo http(s) llega a un href (sin XSS por enlaces).

function IgIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <path d="M5 4 L19 20 M19 4 L5 20" />
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden>
      <circle cx="8.5" cy="17.5" r="3" />
      <path d="M11.5 17.5 V4.5 c0 2.6 2 4.5 4.7 4.5" strokeLinecap="round" />
    </svg>
  );
}
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="4" />
      <path d="M10.2 9.3 L15 12 L10.2 14.7 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const SOCIAL_META: { key: Social; Icon: () => React.ReactElement; name: string }[] = [
  { key: "instagram", Icon: IgIcon, name: "Instagram" },
  { key: "x", Icon: XIcon, name: "X" },
  { key: "tiktok", Icon: TikTokIcon, name: "TikTok" },
  { key: "youtube", Icon: YouTubeIcon, name: "YouTube" },
];

export function SocialLinks({
  website,
  socials,
}: {
  website: PublicProfile["website"];
  socials: PublicProfile["socials"];
}) {
  const web = safeHref(website);
  const webHost = web ? hostLabel(web) : "";
  const items = SOCIAL_META.filter((s) => socials[s.key]);
  if (!web && items.length === 0) return null;

  const cls =
    "grid h-9 w-9 place-items-center rounded-pill border border-line-2 text-text-2 transition-colors hover:border-ink hover:text-ink";

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      {web && (
        <a
          href={web}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={webHost}
          title={webHost}
          className={cls}
        >
          <Globe size={16} strokeWidth={1.8} />
        </a>
      )}
      {items.map(({ key, Icon, name }) => {
        const handle = socials[key]!;
        return (
          <a
            key={key}
            href={socialUrl(key, handle)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={`${name}: @${handle}`}
            title={`${name} · @${handle}`}
            className={cls}
          >
            <Icon />
          </a>
        );
      })}
    </div>
  );
}
