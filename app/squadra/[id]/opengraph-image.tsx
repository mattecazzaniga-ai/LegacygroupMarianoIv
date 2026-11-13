import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { TEAMS } from "@/lib/teams";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";
export const generateStaticParams = () => TEAMS.map((t) => ({ id: t.id }));
export const alt = "Stemma della squadra – Legacy Group";

export default async function OG({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = TEAMS.find((x) => x.id === id) ?? TEAMS[0];
  const png = await readFile(join(process.cwd(), "public", "loghi", `${t.id}-og.png`));
  const src = `data:image/png;base64,${png.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 60, padding: "60px 80px", background: "linear-gradient(180deg, #10284a, #0a1b33)", color: "#f4f6fa", borderTop: `16px solid ${t.color}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={330} alt="" style={{ objectFit: "contain" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, letterSpacing: 8, color: "#d4ad55", textTransform: "uppercase" }}>Legacy Group</div>
          <div style={{ fontSize: t.name.length > 14 ? 76 : 110, fontWeight: 900, lineHeight: 1, textTransform: "uppercase", marginTop: 14, maxWidth: 680 }}>{t.name}</div>
          <div style={{ fontSize: 34, color: "#b9c2ce", marginTop: 22 }}>{`${t.classes.length} classi · ${t.cname}`}</div>
          <div style={{ fontSize: 30, color: "#98a8bf", marginTop: 12 }}>Mariano Quarto · Oristano · 2026/27</div>
        </div>
      </div>
    ),
    size,
  );
}
