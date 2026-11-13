import { ImageResponse } from "next/og";

export const alt = "Legacy Group – Mariano Quarto, Oristano. Six Teams. One Legacy.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

const TEAM_COLORS = ["#f2eee6", "#0b0b0b", "#e9b230", "#b8b2a6", "#a0642d", "#c8102e"];

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "70px 80px",
          background: "linear-gradient(180deg, #10284a, #0a1b33)",
          color: "#f4f6fa",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 8, color: "#d4ad55", textTransform: "uppercase" }}>School Year 2026–2027</div>
        <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1, textTransform: "uppercase", marginTop: 14 }}>Legacy Group</div>
        <div style={{ fontSize: 40, letterSpacing: 6, color: "#b9c2ce", textTransform: "uppercase", marginTop: 18 }}>Mariano Quarto · Oristano</div>
        <div style={{ fontSize: 36, marginTop: 30 }}>Six Teams. One Legacy.</div>
        <div style={{ display: "flex", gap: 14, marginTop: 40 }}>
          {TEAM_COLORS.map((c) => (
            <div key={c} style={{ width: 70, height: 14, borderRadius: 7, background: c, border: "2px solid #27456e" }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
