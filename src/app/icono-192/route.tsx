import { ImageResponse } from "next/og";
import { VIRGULA } from "@/lib/virgula";

// Icono PWA 192×192: vírgula tinta sobre amate, full-bleed (apto maskable).
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F2EFE8",
        }}
      >
        <svg width={128} height={128} viewBox="0 0 200 200" fill="none">
          <path
            d={VIRGULA}
            stroke="#1A1714"
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
