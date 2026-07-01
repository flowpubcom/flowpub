import { createClient } from "@/lib/supabase/server";
import type { Flow, Profile } from "./types";
import type { CoverKind } from "@/lib/covers";

// Lecturas server-side de `flows` (El Pub + Flow abierto). Mapea las filas de
// Supabase a nuestro tipo `Flow`. RLS decide visibilidad (published/featured, o
// el autor sus propios borradores).

const SELECT =
  "id,title,body_md,transcript_raw,audio_url,duration_s,cover_kind,like_count,comment_count,created_at," +
  "author:profiles(id,username,display_name,avatar_url)," +
  "flow_tags(tags(slug,name_es,name_en,sort))";

function excerptOf(md: string, max = 180): string {
  const plain = md
    .replace(/[#>*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 80 ? cut.slice(0, sp) : cut).trim()}…`;
}

function ageMinutesFrom(createdAt: string | null): number {
  if (!createdAt) return 0;
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.max(1, Math.round(ms / 60000));
}

function mapRow(r: any): Flow | null {
  const a = r.author;
  if (!a) return null; // sin autor visible, no lo mostramos

  const author: Profile = {
    id: a.id,
    username: a.username,
    displayName: a.display_name || a.username,
    avatarUrl: a.avatar_url ?? null,
  };

  const tags = (r.flow_tags ?? [])
    .map((ft: any) => ft.tags)
    .filter(Boolean)
    .sort((x: any, y: any) => (x.sort ?? 0) - (y.sort ?? 0));
  const primary = tags[0];

  const bodyMd: string = r.body_md ?? "";

  return {
    id: r.id,
    title: r.title ?? "",
    excerpt: excerptOf(bodyMd),
    author,
    durationSeconds: r.duration_s ?? 0,
    ageMinutes: ageMinutesFrom(r.created_at),
    tag: primary?.name_es ?? "",
    coverKind: (r.cover_kind ?? "collage") as CoverKind,
    likeCount: r.like_count ?? 0,
    commentCount: r.comment_count ?? 0,
    liked: false,
    bodyMd: bodyMd || undefined,
    transcriptRaw: r.transcript_raw ?? undefined,
  };
}

/** Timeline del Pub: publicados/destacados, más recientes primero. */
export async function fetchFlows(): Promise<Flow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flows")
    .select(SELECT)
    .in("status", ["published", "featured"])
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapRow).filter((f): f is Flow => f !== null);
}

/** Un Flow por id (RLS decide si es visible para quien lo pide). */
export async function fetchFlow(id: string): Promise<Flow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flows")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data);
}
