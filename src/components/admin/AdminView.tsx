"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EyeOff, Globe, Plus, Search, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { Switch } from "@/components/ui";
import { useSound } from "@/providers/SoundProvider";
import { compactNumber } from "@/lib/format";
import {
  addTag,
  saveSetting,
  setFlowStatus,
  setTagActive,
  type FlowModStatus,
} from "@/data/adminClient";
import type {
  AdminAnalytics,
  AdminFlowRow,
  AdminMetrics,
  AdminSettings,
  AdminTagRow,
  AdminUserRow,
} from "@/data/adminApi";

// Panel de control (solo admin; el gate vive en la página). El copy es
// español fijo: pantalla de fundador, entra al barrido i18n de la fase 9.

type Section = "resumen" | "analytics" | "flows" | "usuarios" | "temas" | "ajustes";

const SECTIONS: [Section, string][] = [
  ["resumen", "Resumen"],
  ["analytics", "Analytics"],
  ["flows", "Flows"],
  ["usuarios", "Usuarios"],
  ["temas", "Temas"],
  ["ajustes", "Ajustes"],
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
      {children}
    </h3>
  );
}

function CardBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[14px] border border-line bg-surface p-4 shadow-[var(--shadow-card)]", className)}>
      {children}
    </div>
  );
}

export function AdminView({
  metrics,
  analytics,
  flows: initialFlows,
  users,
  tags: initialTags,
  settings: initialSettings,
}: {
  metrics: AdminMetrics;
  analytics: AdminAnalytics;
  flows: AdminFlowRow[];
  users: AdminUserRow[];
  tags: AdminTagRow[];
  settings: AdminSettings;
}) {
  const [section, setSection] = useState<Section>("resumen");
  const { play } = useSound();

  return (
    <div className="mx-auto max-w-[960px] px-4 pb-12 pt-6 lg:px-7">
      <h1 className="font-serif text-[26px] font-medium leading-[1.15] text-ink">
        Panel de control — configurar y editar todo
      </h1>
      <p className="mt-1 max-w-[60ch] font-sans text-[13px] text-text-2">
        Métricas, Flows, usuarios, temas y ajustes: IA (Gemini), grabación,
        integraciones y el interruptor de UI generativa.
      </p>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-line">
        {SECTIONS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              play("tick");
              setSection(key);
            }}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 font-sans text-[14px] transition-colors duration-150",
              section === key
                ? "border-grana font-semibold text-ink"
                : "border-transparent font-medium text-text-3 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {section === "resumen" && <ResumenSection metrics={metrics} />}
        {section === "analytics" && <AnalyticsSection analytics={analytics} />}
        {section === "flows" && <FlowsSection initial={initialFlows} />}
        {section === "usuarios" && <UsersSection users={users} />}
        {section === "temas" && <TagsSection initial={initialTags} />}
        {section === "ajustes" && <SettingsSection initial={initialSettings} />}
      </div>
    </div>
  );
}

// ── Resumen ──────────────────────────────────────────────────────────────────

function ResumenSection({ metrics }: { metrics: AdminMetrics }) {
  const maxDay = Math.max(1, ...metrics.flowsPerDay.map((d) => d.count));
  const stats: [string, string][] = [
    ["Usuarios", compactNumber(metrics.users)],
    ["Flows publicados", compactNumber(metrics.publishedFlows)],
    ["Min. de voz", compactNumber(metrics.voiceMinutes)],
    ["Comentarios", compactNumber(metrics.comments)],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <CardBox key={label}>
            <p className="font-sans text-[12px] font-medium text-text-3">{label}</p>
            <p className="mt-1 font-serif text-[28px] font-medium leading-none text-ink">
              {value}
            </p>
          </CardBox>
        ))}
      </div>

      <div className="grid gap-3.5 md:grid-cols-[1.5fr_1fr]">
        <CardBox>
          <div className="flex items-baseline justify-between">
            <Eyebrow>Flows por día</Eyebrow>
            <span className="font-mono text-[11px] text-text-3">últimos 7 días</span>
          </div>
          <div className="flex h-[120px] items-end gap-2.5">
            {metrics.flowsPerDay.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="font-mono text-[10px] text-text-3">{d.count || ""}</span>
                <div
                  className="w-full rounded-t-[4px] bg-grana-wash"
                  style={{
                    height: `${Math.max(4, Math.round((d.count / maxDay) * 84))}px`,
                    backgroundColor: d.count === maxDay ? "var(--grana)" : undefined,
                  }}
                  aria-hidden
                />
                <span className="font-mono text-[10px] uppercase text-text-3">{d.label}</span>
              </div>
            ))}
          </div>
        </CardBox>

        <CardBox>
          <Eyebrow>Temas más activos</Eyebrow>
          {metrics.topTags.length === 0 ? (
            <p className="font-sans text-[13px] text-text-3">Aún sin datos.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {metrics.topTags.map((t) => (
                <li key={t.name}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-serif text-[15px] text-ink">{t.name}</span>
                    <span className="font-mono text-[12px] text-text-3">{t.pct}%</span>
                  </div>
                  <div className="mt-1 h-[6px] overflow-hidden rounded-pill bg-surface-3">
                    <div
                      className="h-full rounded-pill bg-ocre"
                      style={{ width: `${t.pct}%` }}
                      aria-hidden
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBox>
      </div>
    </div>
  );
}

// ── Analytics (propias, privacy-first) ───────────────────────────────────────

const DEVICE_LABEL: Record<string, string> = {
  mobile: "Móvil",
  desktop: "Escritorio",
  "—": "Desconocido",
};
const LANG_LABEL: Record<string, string> = {
  es: "Español",
  en: "English",
  "—": "Desconocido",
};

function prettyPath(p: string): string {
  if (p === "/") return "/ (inicio)";
  return p.length > 30 ? p.slice(0, 29) + "…" : p;
}

/** Lista de barras horizontales (etiqueta · barra · conteo). */
function BarList({
  items,
  accent = "grana",
}: {
  items: { key: string; label: string; count: number }[];
  accent?: "grana" | "ocre";
}) {
  if (items.length === 0) {
    return <p className="font-sans text-[13px] text-text-3">Aún sin datos.</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.count));
  const bar = accent === "ocre" ? "bg-ocre" : "bg-grana";
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it) => (
        <li key={it.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate font-sans text-[13px] text-ink">{it.label}</span>
            <span className="font-mono text-[12px] text-text-3">{it.count}</span>
          </div>
          <div className="mt-1 h-[6px] overflow-hidden rounded-pill bg-surface-3">
            <div
              className={cn("h-full rounded-pill", bar)}
              style={{ width: `${Math.round((it.count / max) * 100)}%` }}
              aria-hidden
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Reparto compacto (dispositivo / idioma) como barritas con %. */
function Split({ items, total }: { items: { label: string; count: number }[]; total: number }) {
  if (items.length === 0) {
    return <p className="font-sans text-[12px] text-text-3">Sin datos.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it) => {
        const pct = Math.round((it.count / total) * 100);
        return (
          <li key={it.label} className="flex items-center gap-2.5">
            <span className="w-[74px] flex-none font-sans text-[12px] text-text-2">{it.label}</span>
            <div className="h-[6px] flex-1 overflow-hidden rounded-pill bg-surface-3">
              <div className="h-full rounded-pill bg-ocre" style={{ width: `${pct}%` }} aria-hidden />
            </div>
            <span className="w-[34px] flex-none text-right font-mono text-[11px] text-text-3">{pct}%</span>
          </li>
        );
      })}
    </ul>
  );
}

function AnalyticsSection({ analytics }: { analytics: AdminAnalytics }) {
  if (!analytics.hasData) {
    return (
      <CardBox className="px-5 py-10 text-center">
        <p className="font-serif text-[19px] text-ink">Aún sin datos</p>
        <p className="mx-auto mt-2 max-w-[48ch] font-sans text-[13.5px] text-text-2">
          En cuanto la gente navegue el sitio verás aquí las vistas, las páginas y
          los Flows más vistos, de dónde llega la gente y con qué dispositivo. Sin
          cookies de terceros, todo en tu propia base.
        </p>
        <p className="mt-3 font-mono text-[11px] text-text-3">
          ¿Recién corriste la migración 21? Dale unos minutos de tráfico y recarga.
        </p>
      </CardBox>
    );
  }

  const maxDay = Math.max(1, ...analytics.viewsByDay.map((d) => d.count));
  const stats: [string, number][] = [
    ["Vistas", analytics.totalViews],
    ["Sesiones", analytics.totalSessions],
    ["Cuentas nuevas", analytics.newUsers],
    ["Flows nuevos", analytics.newFlows],
  ];
  const devTotal = analytics.devices.reduce((a, d) => a + d.count, 0) || 1;
  const langTotal = analytics.langs.reduce((a, d) => a + d.count, 0) || 1;

  return (
    <div className="flex flex-col gap-4">
      <p className="font-sans text-[12px] text-text-3">
        Analítica propia · privacy-first · últimos {analytics.days} días
      </p>

      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <CardBox key={label}>
            <p className="font-sans text-[12px] font-medium text-text-3">{label}</p>
            <p className="mt-1 font-serif text-[28px] font-medium leading-none text-ink">
              {compactNumber(value)}
            </p>
          </CardBox>
        ))}
      </div>

      <div className="grid gap-3.5 md:grid-cols-[1.6fr_1fr]">
        <CardBox>
          <div className="flex items-baseline justify-between">
            <Eyebrow>Vistas por día</Eyebrow>
            <span className="font-mono text-[11px] text-text-3">{analytics.days} días</span>
          </div>
          <div className="flex h-[120px] items-end gap-[3px]">
            {analytics.viewsByDay.map((d, i) => (
              <div
                key={i}
                title={`${d.date}: ${d.count}`}
                className="flex-1 rounded-t-[3px] bg-grana-wash"
                style={{
                  height: `${Math.max(3, Math.round((d.count / maxDay) * 108))}px`,
                  backgroundColor: d.count === maxDay ? "var(--grana)" : undefined,
                }}
                aria-hidden
              />
            ))}
          </div>
        </CardBox>

        <CardBox>
          <Eyebrow>Dispositivo · idioma</Eyebrow>
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 font-sans text-[11px] font-medium text-text-3">Dispositivo</p>
              <Split
                items={analytics.devices.map((d) => ({ label: DEVICE_LABEL[d.device] ?? d.device, count: d.count }))}
                total={devTotal}
              />
            </div>
            <div>
              <p className="mb-2 font-sans text-[11px] font-medium text-text-3">Idioma</p>
              <Split
                items={analytics.langs.map((d) => ({ label: LANG_LABEL[d.lang] ?? d.lang, count: d.count }))}
                total={langTotal}
              />
            </div>
          </div>
        </CardBox>
      </div>

      <div className="grid gap-3.5 md:grid-cols-2">
        <CardBox>
          <Eyebrow>Páginas más vistas</Eyebrow>
          <BarList items={analytics.topPaths.map((p) => ({ key: p.path, label: prettyPath(p.path), count: p.count }))} />
        </CardBox>
        <CardBox>
          <Eyebrow>Flows más vistos</Eyebrow>
          {analytics.topFlows.length === 0 ? (
            <p className="font-sans text-[13px] text-text-3">Aún sin datos.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {analytics.topFlows.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3">
                  <Link href={`/flow/${f.id}`} className="min-w-0 truncate font-serif text-[14px] text-ink hover:underline">
                    {f.title}
                  </Link>
                  <span className="flex-none font-mono text-[12px] text-text-3">{f.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBox>
      </div>

      <CardBox>
        <Eyebrow>De dónde llega la gente</Eyebrow>
        {analytics.referrers.length === 0 ? (
          <p className="font-sans text-[13px] text-text-3">
            Casi todo es tráfico directo por ahora. Cuando te enlacen desde otras redes, aparecerá aquí.
          </p>
        ) : (
          <BarList
            items={analytics.referrers.map((r) => ({ key: r.host, label: r.host, count: r.count }))}
            accent="ocre"
          />
        )}
      </CardBox>
    </div>
  );
}

// ── Flows (moderación) ───────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  published: "Publicado",
  featured: "Destacado",
  hidden: "Oculto",
  draft: "Borrador",
  reported: "Reportado",
};

const STATUS_CLASS: Record<string, string> = {
  published: "bg-surface-3 text-text-2",
  featured: "bg-grana-wash text-grana-700",
  hidden: "bg-surface-3 text-text-3 line-through",
  draft: "border border-dashed border-line-2 text-text-3",
  reported: "bg-grana text-white",
};

function FlowsSection({ initial }: { initial: AdminFlowRow[] }) {
  const { play } = useSound();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        r.author.toLowerCase().includes(needle) ||
        r.tag.toLowerCase().includes(needle),
    );
  }, [rows, q]);

  const moderate = async (id: string, status: FlowModStatus) => {
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    play(status === "hidden" ? "soft" : "pop");
    const res = await setFlowStatus(id, status);
    if (!res.ok) {
      setRows(prev);
      play("soft");
    }
  };

  return (
    <div>
      <div className="relative mb-4 max-w-[320px]">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          aria-label="Buscar Flows"
          className="w-full rounded-pill border border-line-2 bg-surface py-2 pl-9 pr-4 font-sans text-[13px] text-ink outline-none focus:border-grana"
        />
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-line">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              {["Flow", "Autor", "Tema", "Estado · Acciones"].map((h) => (
                <th key={h} className="px-4 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-line-soft last:border-0">
                <td className="max-w-[260px] px-4 py-3">
                  <Link href={`/flow/${r.id}`} className="block truncate font-serif text-[15px] text-ink hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-3 font-sans text-[13px] text-text-2">
                  {r.author}
                </td>
                <td className="px-4 py-3 font-sans text-[13px] text-text-3">{r.tag}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-pill px-2.5 py-1 font-sans text-[11px] font-semibold", STATUS_CLASS[r.status] ?? STATUS_CLASS.published)}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    {r.status !== "draft" && (
                      <>
                        <button
                          type="button"
                          onClick={() => void moderate(r.id, r.status === "featured" ? "published" : "featured")}
                          aria-pressed={r.status === "featured"}
                          title={r.status === "featured" ? "Quitar destacado" : "Destacar"}
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-pill transition-colors hover:bg-[var(--hover)]",
                            r.status === "featured" ? "text-grana" : "text-text-3 hover:text-ink",
                          )}
                        >
                          <Star size={15} fill={r.status === "featured" ? "currentColor" : "none"} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void moderate(r.id, r.status === "hidden" ? "published" : "hidden")}
                          aria-pressed={r.status === "hidden"}
                          title={r.status === "hidden" ? "Volver a publicar" : "Ocultar"}
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-pill transition-colors hover:bg-[var(--hover)]",
                            r.status === "hidden" ? "text-grana" : "text-text-3 hover:text-ink",
                          )}
                        >
                          {r.status === "hidden" ? <Globe size={15} /> : <EyeOff size={15} />}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center font-sans text-[13px] text-text-3">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Usuarios ─────────────────────────────────────────────────────────────────

function UsersSection({ users }: { users: AdminUserRow[] }) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-line">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-surface-2">
            {["Usuario", "Rol", "Flows", "Desde"].map((h) => (
              <th key={h} className="px-4 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-line-soft last:border-0">
              <td className="px-4 py-3">
                <Link href={`/@${u.username}`} className="hover:underline">
                  <span className="font-sans text-[14px] font-semibold text-ink">{u.displayName}</span>{" "}
                  <span className="font-sans text-[12px] text-text-3">@{u.username}</span>
                </Link>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "rounded-pill px-2.5 py-1 font-sans text-[11px] font-semibold",
                    u.role === "admin" ? "bg-ink text-ink-on" : "bg-surface-3 text-text-2",
                  )}
                >
                  {u.role === "admin" ? "Admin" : "Voz"}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-[13px] text-text-2">{u.flows}</td>
              <td className="px-4 py-3 font-mono text-[13px] text-text-3">{u.sinceYear ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Temas ────────────────────────────────────────────────────────────────────

function TagsSection({ initial }: { initial: AdminTagRow[] }) {
  const { play } = useSound();
  const [tags, setTags] = useState(initial);
  const [nameEs, setNameEs] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (id: number, active: boolean) => {
    const prev = tags;
    setTags((ts) => ts.map((t) => (t.id === id ? { ...t, active } : t)));
    const res = await setTagActive(id, active);
    if (!res.ok) {
      setTags(prev);
      play("soft");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEs.trim() || adding) return;
    setAdding(true);
    setError(null);
    const res = await addTag(nameEs, nameEn);
    setAdding(false);
    if (!res.ok) {
      setError("No se pudo añadir. ¿Ya existe ese tema?");
      play("soft");
      return;
    }
    play("pop");
    window.location.reload(); // recarga simple: trae id/sort reales de la BD
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-[62ch] font-sans text-[13px] text-text-2">
        Activa, edita o añade los temas que los usuarios eligen al entrar (3) y
        para filtrar el Pub.
      </p>

      <div className="flex flex-col gap-1 rounded-[14px] border border-line bg-surface p-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-[var(--hover)]"
          >
            <div className="min-w-0">
              <p className="font-serif text-[16px] text-ink">
                {tag.nameEs}{" "}
                <span className="font-sans text-[12px] text-text-3">
                  · {tag.nameEn} · /tema/{tag.slug}
                </span>
              </p>
              <p className="font-mono text-[11px] text-text-3">
                {tag.flows === 1 ? "1 flow" : `${tag.flows} flows`}
              </p>
            </div>
            <Switch
              checked={tag.active}
              onCheckedChange={(v) => void toggle(tag.id, v)}
              label={`Tema ${tag.nameEs} activo`}
            />
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          value={nameEs}
          onChange={(e) => setNameEs(e.target.value)}
          placeholder="Nombre en español"
          aria-label="Nombre del tema en español"
          className="w-[200px] rounded-pill border border-line-2 bg-surface px-4 py-2.5 font-sans text-[14px] text-ink outline-none focus:border-grana"
        />
        <input
          type="text"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="Nombre en inglés"
          aria-label="Nombre del tema en inglés"
          className="w-[200px] rounded-pill border border-line-2 bg-surface px-4 py-2.5 font-sans text-[14px] text-ink outline-none focus:border-grana"
        />
        <button
          type="submit"
          disabled={!nameEs.trim() || adding}
          className="inline-flex h-[42px] items-center gap-2 rounded-pill bg-grana px-5 font-sans text-[14px] font-semibold text-white transition-colors hover:bg-grana-700 disabled:opacity-40"
        >
          <Plus size={16} />
          Añadir tema
        </button>
        {error && (
          <p role="status" className="w-full font-sans text-[13px] text-grana">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

// ── Ajustes ──────────────────────────────────────────────────────────────────

function SettingRow({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="font-sans text-[14px] font-semibold text-ink">{title}</p>
        <p className="font-sans text-[12.5px] text-text-3">{detail}</p>
      </div>
      <div className="flex-none">{children}</div>
    </div>
  );
}

function SegmentSelect<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  label: string;
}) {
  const { play } = useSound();
  return (
    <div className="inline-flex rounded-pill border border-line bg-surface-2 p-[3px]" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={String(v)}
          type="button"
          aria-pressed={value === v}
          onClick={() => {
            play("tick");
            onChange(v);
          }}
          className={cn(
            "rounded-pill px-3 py-1 font-sans text-[12px] font-semibold transition-colors duration-150",
            value === v
              ? "bg-surface text-ink shadow-[var(--shadow-thumb)]"
              : "text-text-3 hover:text-ink",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function SettingsSection({ initial }: { initial: AdminSettings }) {
  const { play } = useSound();
  const [limits, setLimits] = useState<Record<string, any>>(initial.limits ?? {});
  const [features, setFeatures] = useState<Record<string, any>>(initial.features ?? {});
  const [defaults, setDefaults] = useState<Record<string, any>>(initial.defaults ?? {});

  const patch = async (
    key: "limits" | "features" | "defaults",
    setter: React.Dispatch<React.SetStateAction<Record<string, any>>>,
    current: Record<string, any>,
    p: Record<string, unknown>,
  ) => {
    const prev = current;
    setter({ ...current, ...p });
    const res = await saveSetting(key, p);
    if (!res.ok) {
      setter(prev);
      play("soft");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <CardBox className="px-5">
        <Eyebrow>General</Eyebrow>
        <div className="divide-y divide-line-soft">
          <SettingRow title="Registro abierto" detail="Permite que cualquiera cree una cuenta.">
            <Switch
              checked={features.openRegistration !== false}
              onCheckedChange={(v) => void patch("features", setFeatures, features, { openRegistration: v })}
              label="Registro abierto"
            />
          </SettingRow>
          <SettingRow title="Idioma por defecto" detail="FlowPub detecta el idioma del sistema operativo.">
            <SegmentSelect
              value={(defaults.lang as string) ?? "auto"}
              options={[["auto", "Automático"], ["es", "Español"], ["en", "English"]]}
              onChange={(v) => void patch("defaults", setDefaults, defaults, { lang: v })}
              label="Idioma por defecto"
            />
          </SettingRow>
          <SettingRow title="Tema por defecto" detail="Apariencia para usuarios nuevos.">
            <SegmentSelect
              value={(defaults.theme as string) ?? "system"}
              options={[["system", "Sistema"], ["light", "Claro"], ["dark", "Oscuro"]]}
              onChange={(v) => void patch("defaults", setDefaults, defaults, { theme: v })}
              label="Tema por defecto"
            />
          </SettingRow>
        </div>
      </CardBox>

      <CardBox className="px-5">
        <Eyebrow>Grabación</Eyebrow>
        <div>
          <SettingRow title="Duración máxima" detail="Tope de cada grabación de Flow.">
            <SegmentSelect
              value={Number(limits.maxDurationSec ?? 180)}
              options={[[60, "1:00"], [120, "2:00"], [180, "3:00"]]}
              onChange={(v) => void patch("limits", setLimits, limits, { maxDurationSec: v })}
              label="Duración máxima"
            />
          </SettingRow>
          <SettingRow title="Temas por Flow" detail="Cuántos temas puede llevar una publicación.">
            <SegmentSelect
              value={Number(limits.maxTags ?? 3)}
              options={[[1, "1"], [2, "2"], [3, "3"]]}
              onChange={(v) => void patch("limits", setLimits, limits, { maxTags: v })}
              label="Temas por Flow"
            />
          </SettingRow>
        </div>
      </CardBox>

      <CardBox className="px-5">
        <Eyebrow>Integraciones</Eyebrow>
        <div>
          {(
            [
              ["Supabase", "Base de datos y autenticación.", "Conectado"],
              ["Resend · correos", "Notificaciones y verificación por email.", "Pendiente de SMTP"],
              ["Cloudflare Turnstile", "Protección anti-bots en el registro.", "Conectado"],
              ["Gemini", "Transcripción, pulido y traducción.", "Conectado"],
            ] as [string, string, string][]
          ).map(([name, detail, status]) => (
            <SettingRow key={name} title={name} detail={detail}>
              <span
                className={cn(
                  "rounded-pill px-2.5 py-1 font-sans text-[11px] font-semibold",
                  status === "Conectado" ? "bg-surface-3 text-ok" : "bg-surface-3 text-text-2",
                )}
              >
                {status}
              </span>
            </SettingRow>
          ))}
        </div>
      </CardBox>

      <CardBox className="px-5">
        <div className="flex items-baseline gap-2">
          <Eyebrow>Experimental</Eyebrow>
          <span className="rounded-pill bg-grana-wash px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-grana-700">
            beta
          </span>
        </div>
        <SettingRow title="UI generativa" detail="El layout de cada Flow se genera según su contenido. En construcción.">
          <Switch
            checked={features.generativeUI === true}
            onCheckedChange={(v) => void patch("features", setFeatures, features, { generativeUI: v })}
            label="UI generativa"
          />
        </SettingRow>
      </CardBox>
    </div>
  );
}
