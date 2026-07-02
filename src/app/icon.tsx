import { ImageResponse } from "next/og";
import { VIRGULA } from "@/lib/virgula";

// Favicon generado: la vírgula en tinta sobre amate.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <svg width={24} height={24} viewBox="0 0 200 200" fill="none">
          <path
            d={VIRGULA}
            stroke="#1A1714"
            strokeWidth={18}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
