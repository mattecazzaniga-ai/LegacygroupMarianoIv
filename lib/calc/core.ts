/**
 * Calcoli di base. Funzioni pure: stesso input, stesso output.
 * Portate da index3.html senza cambiare le regole.
 */
import type { Activity, Kind, Team, Tiebreak } from "../types";

export type TeamOf = Record<string, Team>;

export const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

export function teamOfMap(teams: Team[]): TeamOf {
  const m: TeamOf = {};
  teams.forEach((t) => t.classes.forEach((c) => (m[c] = t)));
  return m;
}

export const allClasses = (teams: Team[]) => teams.flatMap((t) => t.classes);

/** Punti di una squadra in una lista di attività. */
export function teamPts(team: Team, list: Activity[], teamOf: TeamOf): number {
  return sum(list.flatMap((a) => a.awards.filter((w) => teamOf[w.cls]?.id === team.id).map((w) => w.pts)));
}

/** Punti di una classe (opzionalmente solo di un tipo). */
export function classPts(code: string, list: Activity[], kind?: Kind | null): number {
  return sum(list.flatMap((a) => a.awards.filter((w) => w.cls === code && (!kind || w.kind === kind)).map((w) => w.pts)));
}

/** Numero di attività in cui la squadra ha preso almeno un'assegnazione. */
export function teamActs(team: Team, list: Activity[], teamOf: TeamOf): number {
  return list.filter((a) => a.awards.some((w) => teamOf[w.cls]?.id === team.id)).length;
}

/** Punti della squadra in una singola attività. */
export function actPts(a: Activity, team: Team, teamOf: TeamOf): number {
  return sum(a.awards.filter((w) => teamOf[w.cls]?.id === team.id).map((w) => w.pts));
}

export function lastActPts(team: Team, list: Activity[], teamOf: TeamOf): number {
  const a = list[list.length - 1];
  return a ? actPts(a, team, teamOf) : 0;
}

export interface StandingRow {
  team: Team;
  /** indice della squadra nell'elenco ufficiale (ultimo criterio d'ordine) */
  i: number;
  pts: number;
  /** attività con punti */
  n: number;
  /** punti nell'ultima attività della lista */
  last: number;
  /** posizione: squadre con gli stessi punti hanno la stessa posizione */
  pos: number;
}

/**
 * Classifica. Ordine: punti, poi spareggio, poi ordine delle squadre.
 * La posizione dipende SOLO dai punti (pari merito = stessa posizione).
 */
export function standings(teams: Team[], list: Activity[], teamOf: TeamOf, tiebreak: Tiebreak): StandingRow[] {
  const rows = teams.map((team, i) => ({
    team,
    i,
    pts: teamPts(team, list, teamOf),
    n: teamActs(team, list, teamOf),
    last: lastActPts(team, list, teamOf),
    pos: 0,
  }));
  const tb = (r: StandingRow) => (tiebreak === "attivita" ? r.n : tiebreak === "ultima" ? r.last : 0);
  rows.sort((a, b) => b.pts - a.pts || tb(b) - tb(a) || a.i - b.i);
  rows.forEach((r) => (r.pos = 1 + rows.filter((o) => o.pts > r.pts).length));
  return rows;
}

/**
 * Posizioni prima dell'ultima giornata di sfide (tutte le attività dell'ultima data).
 * null se non confrontabile: una sola giornata o nessun punto prima.
 */
export function previousPositions(
  teams: Team[],
  acts: Activity[],
  teamOf: TeamOf,
  tiebreak: Tiebreak,
): Record<string, number> | null {
  if (!acts.length) return null;
  const lastDay = acts[acts.length - 1].date;
  const before = acts.filter((a) => a.date < lastDay);
  if (!before.length) return null;
  const prev = standings(teams, before, teamOf, tiebreak);
  if (!prev.some((r) => r.pts > 0)) return null;
  return Object.fromEntries(prev.map((r) => [r.team.id, r.pos]));
}

/** Variazione di posizione: >0 = salita, <0 = discesa, 0 = stabile, null = non disponibile. */
export function variation(prevPos: Record<string, number> | null, teamId: string, pos: number): number | null {
  if (!prevPos) return null;
  return prevPos[teamId] - pos;
}

export interface HistEntry {
  a: Activity;
  k: number;
  st: StandingRow[];
  /** punti presi da ogni squadra in questa attività */
  ap: Record<string, number>;
  pos: Record<string, number>;
  /** punti totali dopo questa attività */
  pts: Record<string, number>;
  prevPos: Record<string, number> | null;
  /** classifica prima di questa attività (null per la prima) */
  before: StandingRow[] | null;
}

/** Classifica dopo ogni attività. */
export function history(teams: Team[], acts: Activity[], teamOf: TeamOf, tiebreak: Tiebreak): HistEntry[] {
  return acts.map((a, k) => {
    const st = standings(teams, acts.slice(0, k + 1), teamOf, tiebreak);
    const before = k > 0 ? standings(teams, acts.slice(0, k), teamOf, tiebreak) : null;
    return {
      a,
      k,
      st,
      before,
      ap: Object.fromEntries(teams.map((t) => [t.id, actPts(a, t, teamOf)])),
      pos: Object.fromEntries(st.map((r) => [r.team.id, r.pos])),
      pts: Object.fromEntries(st.map((r) => [r.team.id, r.pts])),
      prevPos: before && before.some((r) => r.pts > 0) ? Object.fromEntries(before.map((r) => [r.team.id, r.pos])) : null,
    };
  });
}

/** Unica squadra in testa (null se nessun punto o pari merito al primo posto). */
export function soleLeader(st: StandingRow[]): Team | null {
  return st[0] && st[0].pts > 0 && (!st[1] || st[1].pts < st[0].pts) ? st[0].team : null;
}

/**
 * Vincitrice di una sfida: solo quella indicata dagli organizzatori.
 * Non tutte le attività prevedono un vincitore (es. punti per collaborazione),
 * quindi non si deduce mai dai punti.
 */
export function winnersOf(h: Pick<HistEntry, "a">, teams: Team[]): Team[] {
  const t = h.a.winner ? teams.find((x) => x.id === h.a.winner) : undefined;
  return t ? [t] : [];
}
