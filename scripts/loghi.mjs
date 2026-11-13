/**
 * Genera gli stemmi del sito in /public/loghi a partire dai PNG ritagliati in /stemmi:
 *   <id>-128.webp, <id>-256.webp  (sito)   ·   <id>-og.png (anteprime social)
 * e scrive le proporzioni in lib/logos.json.
 *
 * Per cambiare uno stemma: sostituisci stemmi/<id>.png (sfondo trasparente) e lancia
 *   node scripts/loghi.mjs
 * Per ritagliare un'immagine con più stemmi su sfondo bianco: scripts/taglia_stemmi.py
 */
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const IDS = ["componidori", "mamuthones", "eleonora", "giganti", "shardana", "mariano-iv"];
const OUT = "public/loghi";
mkdirSync(OUT, { recursive: true });

const sizes = {};
for (const id of IDS) {
  const src = `stemmi/${id}.png`;
  const meta = await sharp(src).metadata();
  sizes[id] = { w: meta.width, h: meta.height };
  for (const w of [128, 256]) await sharp(src).resize({ width: w }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(`${OUT}/${id}-${w}.webp`);
  await sharp(src).resize({ width: 360 }).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(`${OUT}/${id}-og.png`);
  console.log(`${id}: ${meta.width}×${meta.height}`);
}
writeFileSync("lib/logos.json", JSON.stringify({ source: "stemmi/*.png", sizes }, null, 2) + "\n");
