import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Lecturas server-side del panel de control. Todas asumen que la página ya
// verificó el rol admin (el gate vive en app/admin/page.tsx); aun sin él, la
// RLS solo dejaría ver lo público.

export interface AdminMetrics {
  users: number;
  publishedFlows: number;
  voiceMinutes: number;
  comments: number;
  /** Flows por día, últimos 7 (lunes…domingo relativo a hoy). */
  flowsPerDay: { label: string; count: number }[];
  /** Temas más activos con % del total de asignaciones. */
  topTags: { name: string; pct: number }[];
}

/** ¿El usuario con sesión es admin? (gate del panel). */
export const fetchIsAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return data?.role === "admin";
});

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

export const fetchAdminMetrics = cache(async (): Promise<AdminMetrics> => {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const [users, published, comments, durations, recent, tagCounts] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("flows")
        .select("id", { count: "exact", head: true })
        .in("status", ["published", "featured"]),
      supabase.from("comments").select("id", { count: "exact", head: true }),
      supabase
        .from("flows")
        .select("duration_s")
        .in("status", ["published", "featured"])
        .limit(2000),
      supabase
        .from("flows")
        .select("created_at")
        .gte("created_at", since.toISOString())
        .limit(2000),
      supabase
        .from("tags")
        .select("name_es,flow_tags(count)")
        .eq("active", true),
    ]);

  const voiceSeconds = (durations.data ?? []).reduce(
    (acc, r) => acc + ((r.duration_s as number) ?? 0),
    0,
  );

  // Cubeta por día local, de hace 6 días a hoy.
  const buckets: { label: string; count: number }[] = [];
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(dayKey(d));
    buckets.push({ label: DAY_LABELS[d.getDay()], count: 0 });
  }
  for (const r of recent.data ?? []) {
    const k = (r.created_at as string).slice(0, 10);
    const idx = keys.indexOf(k);
    if (idx >= 0) buckets[idx].count += 1;
  }

  const withCounts = (tagCounts.data ?? [])
    .map((t) => ({
      name: t.name_es as string,
      count: (t.flow_tags?.[0]?.count as number) ?? 0,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
  const totalTagged = withCounts.reduce((a, t) => a + t.count, 0) || 1;
  const topTags = withCounts.slice(0, 4).map((t) => ({
    name: t.name,
    pct: Math.round((t.count / totalTagged) * 100),
  }));

  return {
    users: users.count ?? 0,
    publishedFlows: published.count ?? 0,
    voiceMinutes: Math.round(voiceSeconds / 60),
    comments: comments.count ?? 0,
    flowsPerDay: buckets,
    topTags,
  };
});

export interface AdminFlowRow {
  id: string;
  title: string;
  author: string;
  username: string;
  tag: string;
  status: string;
  createdAt: string;
}

/** Todos los Flows (el admin ve todo por RLS), más recientes primero. */
export const fetchAdminFlows = cache(async (): Promise<AdminFlowRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flows")
    .select(
      "id,title,status,created_at," +
        "author:profiles!author_id(username,display_name)," +
        "flow_tags(tags(name_es,sort))",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    title: r.title || "(sin título)",
    author: r.author?.display_name || r.author?.username || "—",
    username: r.author?.username ?? "",
    tag: (r.flow_tags ?? [])
      .map((ft: any) => ft.tags)
      .filter(Boolean)
      .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))[0]?.name_es ?? "—",
    status: r.status ?? "published",
    createdAt: r.created_at,
  }));
});

export interface AdminUserRow {
  id: string;
  displayName: string;
  username: string;
  role: string;
  flows: number;
  sinceYear: number | null;
}

export const fetchAdminUsers = cache(async (): Promise<AdminUserRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    // Hint !author_id: profiles↔flows también se conecta vía likes/saves.
    .select("id,username,display_name,role,created_at,flows!author_id(count)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    displayName: r.display_name || r.username,
    username: r.username,
    role: r.role ?? "user",
    flows: (r.flows?.[0]?.count as number) ?? 0,
    sinceYear: r.created_at ? new Date(r.created_at).getFullYear() : null,
  }));
});

export interface AdminTagRow {
  id: number;
  slug: string;
  nameEs: string;
  nameEn: string;
  active: boolean;
  flows: number;
}

/** Todos los tags (activos e inactivos; la RLS deja al admin ver ambos). */
export const fetchAdminTags = cache(async (): Promise<AdminTagRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id,slug,name_es,name_en,active,sort,flow_tags(count)")
    .order("sort");
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    slug: r.slug,
    nameEs: r.name_es,
    nameEn: r.name_en,
    active: !!r.active,
    flows: (r.flow_tags?.[0]?.count as number) ?? 0,
  }));
});

export type AdminSettings = Record<string, any>;

/** settings completo (limits/features/defaults) como mapa key→value. */
export const fetchAdminSettings = cache(async (): Promise<AdminSettings> => {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key,value");
  const out: AdminSettings = {};
  for (const r of data ?? []) out[r.key as string] = r.value;
  return out;
});
