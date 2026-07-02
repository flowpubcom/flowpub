import { NextResponse } from "next/server";

// Versión del deploy (SHA de Vercel). El cliente la compara al volver a la
// pestaña: si cambió, ofrece recargar — nadie se queda en una versión vieja.
export const dynamic = "force-dynamic";

export function GET() {
  const v =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.VERCEL_DEPLOYMENT_ID ??
    "dev";
  return NextResponse.json(
    { v },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
