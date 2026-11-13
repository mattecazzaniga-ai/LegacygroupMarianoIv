/**
 * Genera gli stemmi in /public/loghi:
 *   <id>-128.webp, <id>-256.webp  (sito)   ·   <id>-og.png (anteprime social)
 *
 * - Se nella cartella principale c'è index3.html, estrae gli stemmi originali da lì.
 * - Altrimenti crea stemmi provvisori (scudo con colore e iniziale della squadra).
 *
 * Uso:  node scripts/loghi.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const TEAMS = [
  ["componidori", "Componidori", "#f2eee6"],
  ["mamuthone", "Mamuthone", "#0b0b0b"],
  ["janas", "Janas", "#e9b230"],
  ["giganti", "Giganti di Mont'e Prama", "#b8b2a6"],
  ["shardana", "Shardana", "#a0642d"],
  ["issohadores", "Issohadores", "#c8102e"],
];
const OUT = "public/loghi";
mkdirSync(OUT, { recursive: true });

function placeholder(name, color) {
  const lum = (h) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const fg = lum(color) > 0.5 ? "#0a1b33" : "#f4f6fa";
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="460" height="510" viewBox="0 0 460 510">
  <path d="M230 12 L438 70 V250 C438 380 340 462 230 498 C120 462 22 380 22 250 V70 Z" fill="${color}" stroke="#d4ad55" stroke-width="18"/>
  <text x="230" y="330" text-anchor="middle" font-family="Arial Narrow, Arial, sans-serif" font-weight="900" font-size="250" fill="${fg}">${name[0]}</text>
</svg>`);
}

const html = existsSync("index3.html") ? readFileSync("index3.html", "utf8") : null;
const sizes = {};
for (const [id, name, color] of TEAMS) {
  let src;
  if (html) {
    const m = html.match(new RegExp(`id:"${id}"[^}]*?logo:"data:image/webp;base64,([A-Za-z0-9+/=]+)"`));
    if (!m) throw new Error(`Stemma di ${id} non trovato in index3.html`);
    src = Buffer.from(m[1], "base64");
  } else {
    src = await sharp(placeholder(name, color)).png().toBuffer();
  }
  const meta = await sharp(src).metadata();
  sizes[id] = { w: meta.width, h: meta.height };
  for (const w of [128, 256]) await sharp(src).resize({ width: w }).webp({ quality: 82, effort: 6 }).toFile(`${OUT}/${id}-${w}.webp`);
  await sharp(src).resize({ width: 360 }).png({ compressionLevel: 9 }).toFile(`${OUT}/${id}-og.png`);
  console.log(`${id}: ${meta.width}×${meta.height} ${html ? "(originale)" : "(provvisorio)"}`);
}
writeFileSync(
  "lib/logos.json",
  JSON.stringify({ source: html ? "index3.html" : "provvisori", sizes }, null, 2) + "\n",
);
