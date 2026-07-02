// Limpia archivos huérfanos de Storage (carpetas de uids que ya no existen en
// profiles). Supabase ya no permite DELETE directo sobre storage.objects
// (trigger protect_delete): hay que usar la Storage API — eso hace esto.
//
//   node scripts/limpia-storage.mjs            → dry-run: solo lista
//   node scripts/limpia-storage.mjs --borra    → borra de verdad
//
// Usa la SERVICE ROLE de .env.local (solo local; jamás en el cliente).
// Córrelo DESPUÉS de migration_06 (primero se van los perfiles demo; luego
// sus carpetas quedan huérfanas y este script las barre).

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const BUCKETS = ["audio", "avatars", "covers"];
const borrar = process.argv.includes("--borra");
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: profiles, error: pErr } = await sb.from("profiles").select("id");
if (pErr) {
  console.error("No pude leer profiles:", pErr.message);
  process.exit(1);
}
const vivos = new Set(profiles.map((p) => p.id));
console.log(`Perfiles vivos: ${vivos.size}`);

let totalHuerfanos = 0;
for (const bucket of BUCKETS) {
  // Nivel raíz = carpetas-uid (así lo exige la RLS de subida).
  const { data: folders, error } = await sb.storage.from(bucket).list("", { limit: 1000 });
  if (error) {
    console.error(`[${bucket}] no pude listar:`, error.message);
    continue;
  }
  for (const f of folders ?? []) {
    // Las carpetas vienen sin id; los archivos sueltos en raíz, con id.
    const esCarpeta = f.id === null || f.id === undefined;
    if (!esCarpeta || vivos.has(f.name)) continue;

    const { data: files, error: fErr } = await sb.storage
      .from(bucket)
      .list(f.name, { limit: 1000 });
    if (fErr) {
      console.error(`[${bucket}/${f.name}] no pude listar:`, fErr.message);
      continue;
    }
    const paths = (files ?? []).map((x) => `${f.name}/${x.name}`);
    if (!paths.length) continue;
    totalHuerfanos += paths.length;

    if (borrar) {
      const { error: rmErr } = await sb.storage.from(bucket).remove(paths);
      console.log(
        rmErr
          ? `[${bucket}] ERROR borrando ${f.name}: ${rmErr.message}`
          : `[${bucket}] borrados ${paths.length} de ${f.name}/`,
      );
    } else {
      for (const p of paths) console.log(`[${bucket}] huérfano: ${p}`);
    }
  }
}

console.log(
  totalHuerfanos === 0
    ? "Storage limpio: cero huérfanos."
    : borrar
      ? `Listo: ${totalHuerfanos} archivos huérfanos borrados.`
      : `${totalHuerfanos} huérfanos encontrados. Corre con --borra para eliminarlos.`,
);
