/**
 * Formula ufficiale del punteggio (vedi Regolamento):
 * PUNTI = POSIZIONE × LIVELLO × TIPO + PARTECIPAZIONE
 */
export type Level = 1 | 2 | 3;
export type FormulaKind = "collettivo" | "singolo";

/** Punti di posizione: dal 6° posto in poi 0. */
export const POSITION_PTS = [10, 8, 6, 4, 2] as const;
export const KIND_MULT: Record<FormulaKind, number> = { collettivo: 2, singolo: 1 };

export const positionPts = (pos: number) => (Number.isInteger(pos) && pos >= 1 && pos <= POSITION_PTS.length ? POSITION_PTS[pos - 1] : 0);

/** "merito" = riconoscimento (collaborazione, aiuto, ...): vale come la partecipazione, 1 × livello. */
export type Result = { pos: number } | { merit: true };

export interface FormulaInput {
  level: Level;
  kind: FormulaKind;
  /** l'attività prevede il punto di partecipazione */
  participation: boolean;
}

export function formulaPoints(r: Result, f: FormulaInput): { pts: number; calc: string } {
  if ("merit" in r) return { pts: f.level, calc: `riconoscimento = ${f.level}` };
  const p = positionPts(r.pos);
  const part = f.participation ? f.level : 0;
  const pts = p * f.level * KIND_MULT[f.kind] + part;
  if (!p) return { pts, calc: part ? `solo partecipazione = ${part}` : "nessun punto" };
  return { pts, calc: `${p} × ${f.level} × ${KIND_MULT[f.kind]}${part ? ` + ${part}` : ""} = ${pts}` };
}

/**
 * Controllo dei pari merito: a pari merito le classi prendono la posizione più alta
 * e la successiva viene saltata (due prime → la seguente è terza).
 * Restituisce gli avvisi (vuoto se le posizioni sono coerenti).
 */
export function checkPositions(positions: number[]): string[] {
  const ps = positions.filter((p) => Number.isInteger(p) && p >= 1).sort((a, b) => a - b);
  const out: string[] = [];
  const count = new Map<number, number>();
  ps.forEach((p) => count.set(p, (count.get(p) ?? 0) + 1));
  [...count.keys()].forEach((p) => {
    // quante classi stanno davanti a p: la posizione corretta è (davanti + 1)
    const ahead = ps.filter((x) => x < p).length;
    if (p !== ahead + 1 && p <= POSITION_PTS.length)
      out.push(`${p}° posto: davanti ci sono ${ahead} ${ahead === 1 ? "classe" : "classi"}, quindi dovrebbe essere ${ahead + 1}°.`);
  });
  return out;
}
