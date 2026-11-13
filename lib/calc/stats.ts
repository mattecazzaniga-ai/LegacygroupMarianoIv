/**
 * Statistiche che tengono conto del punteggio variabile: ogni sfida ha i suoi punti,
 * quindi accanto ai totali usiamo misure confrontabili (quota dei punti di ogni sfida,
 * media sulle attività a cui si è preso parte) e diciamo sempre il criterio.
 */
import type { Activity, Team } from "../types";
import { actPts, sum, winnersOf, type HistEntry, type TeamOf } from "./core";

export const round1 = (v: number) => Math.round(v * 10) / 10;

/** Punti totali assegnati in un'attività (a tutte le classi). */
export const actTotal = (a: Activity) => sum(a.awards.map((w) => w.pts));

export interface Avg {
  pts: number;
  /** attività in cui ha preso punti */
  n: number;
  /** punti ÷ attività con punti */
  avg: number;
}

export function teamAvg(g: Team, acts: Activity[], teamOf: TeamOf): Avg {
  const per = acts.map((a) => actPts(a, g, teamOf)).filter((v) => v !== 0);
  const pts = sum(per);
  return { pts, n: per.length, avg: per.length ? round1(pts / per.length) : 0 };
}

export function classAvg(c: string, acts: Activity[]): Avg {
  const per = acts.map((a) => sum(a.awards.filter((w) => w.cls === c).map((w) => w.pts))).filter((v) => v !== 0);
  const pts = sum(per);
  return { pts, n: per.length, avg: per.length ? round1(pts / per.length) : 0 };
}

/**
 * Quota media: per ogni attività, la parte dei punti assegnati presa dalla squadra;
 * poi la media su tutte le attività (0% dove non ha preso punti). Le quote delle sei
 * squadre sommano a 100%, quindi il confronto è omogeneo anche se le sfide valgono punti diversi.
 */
export function avgShare(g: Team, acts: Activity[], teamOf: TeamOf): number {
  const valid = acts.filter((a) => actTotal(a) > 0);
  if (!valid.length) return 0;
  return sum(valid.map((a) => actPts(a, g, teamOf) / actTotal(a))) / valid.length;
}

/** Punti per tipologia di attività ("Altro" se manca il tipo), dal più alto. */
export function ptsByType(acts: Activity[], filter?: (cls: string) => boolean): { type: string; pts: number; n: number }[] {
  const m = new Map<string, { pts: number; n: number }>();
  acts.forEach((a) => {
    const pts = sum(a.awards.filter((w) => !filter || filter(w.cls)).map((w) => w.pts));
    if (!pts) return;
    const k = a.type.trim() || "Altro";
    const v = m.get(k) ?? { pts: 0, n: 0 };
    m.set(k, { pts: v.pts + pts, n: v.n + 1 });
  });
  return [...m.entries()].map(([type, v]) => ({ type, ...v })).sort((a, b) => b.pts - a.pts || a.type.localeCompare(b.type));
}

/** Il migliore secondo `v`, tra chi ha almeno `minN` attività (se nessuno, tra chi ne ha almeno una). */
export function bestBy<T extends { a: Avg }>(rows: T[], minN = 2): T | null {
  const pool = rows.filter((r) => r.a.n >= minN).length ? rows.filter((r) => r.a.n >= minN) : rows.filter((r) => r.a.n > 0);
  return pool.reduce<T | null>((b, r) => (!b || r.a.avg > b.a.avg ? r : b), null);
}

export interface Match {
  a: Activity;
  ptsA: number;
  ptsB: number;
  /** "A" | "B" | "pari" */
  res: "A" | "B" | "pari";
  /** deciso dalla squadra vincitrice indicata dagli organizzatori */
  byWinner: boolean;
}

/**
 * Scontri diretti: solo le sfide in cui hanno preso punti ENTRAMBE le squadre
 * (cioè hanno gareggiato nella stessa attività). Esito: la vincitrice indicata dagli
 * organizzatori se è una delle due, altrimenti chi ha fatto più punti in quella sfida.
 */
export function headToHead(A: Team, B: Team, hist: HistEntry[], teams: Team[]): Match[] {
  return hist
    .filter((h) => h.ap[A.id] > 0 && h.ap[B.id] > 0)
    .map((h) => {
      const w = winnersOf(h, teams)[0];
      const byWinner = !!w && (w.id === A.id || w.id === B.id);
      const res = byWinner ? (w!.id === A.id ? "A" : "B") : h.ap[A.id] > h.ap[B.id] ? "A" : h.ap[B.id] > h.ap[A.id] ? "B" : "pari";
      return { a: h.a, ptsA: h.ap[A.id], ptsB: h.ap[B.id], res, byWinner } as Match;
    });
}

/** Posizione di una squadra nella singola attività (1 = più punti), null se non ha preso punti. */
export function placeIn(h: HistEntry, g: Team, teams: Team[]): number | null {
  const v = h.ap[g.id];
  if (v <= 0) return null;
  return 1 + teams.filter((t) => h.ap[t.id] > v).length;
}
