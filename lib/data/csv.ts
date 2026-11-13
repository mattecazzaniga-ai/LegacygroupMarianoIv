/** Parser CSV (RFC 4180): virgolette, virgole e a capo dentro i campi, CRLF, BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let quoted = false;
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  while (i < s.length) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      quoted = true;
      i++;
    } else if (c === ",") {
      row.push(field);
      field = "";
      i++;
    } else if (c === "\r") {
      i++;
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
    } else {
      field += c;
      i++;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Normalizza un'intestazione: minuscole, senza accenti, spazi → "_". */
export const normHeader = (h: string) =>
  h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

/** Normalizza un testo libero per confronti (minuscole, senza accenti né simboli). */
export const normKey = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export interface Table {
  /** righe come oggetti {colonna: valore}, con il numero di riga del foglio */
  rows: { line: number; v: Record<string, string> }[];
  missing: string[];
}

/**
 * Converte il CSV in righe con nome di colonna. Le righe completamente vuote vengono saltate.
 * `line` è il numero di riga nel foglio (l'intestazione è la riga 1).
 */
export function toTable(text: string, required: string[]): Table {
  const all = parseCsv(text);
  const header = (all[0] || []).map(normHeader);
  const missing = required.filter((r) => !header.includes(r));
  const rows = all
    .slice(1)
    .map((cells, idx) => ({
      line: idx + 2,
      v: Object.fromEntries(header.map((h, j) => [h, (cells[j] ?? "").trim()])),
    }))
    .filter((r) => Object.values(r.v).some((x) => x !== ""));
  return { rows, missing };
}
