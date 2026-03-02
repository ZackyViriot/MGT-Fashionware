import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MGT Fashion — Curated vintage-inspired streetwear";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-2px",
          }}
        >
          MGT
        </div>
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.5)",
            marginTop: 16,
            letterSpacing: "4px",
            textTransform: "uppercase",
          }}
        >
          Fashion
        </div>
        <div
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.3)",
            marginTop: 24,
          }}
        >
          Curated vintage-inspired streetwear and independent fashion
        </div>
      </div>
    ),
    { ...size }
  );
}
