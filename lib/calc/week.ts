/**
 * Podio della settimana e Power Ranking.
 * Finestre (come in index3.html), con `today` = oggi a Oristano:
 *  - W0  = today − 7  → "ultimi 7 giorni" = attività con data ≥ W0
 *  - W1  = today − 14 → "7 giorni precedenti" = W1 ≤ data < W0
 *  - D30 = today − 30
 */
import { addDays } from "../dates";
import type { Activity, Team, Tiebreak } from "../types";
import { standings, teamPts, type StandingRow, type TeamOf } from "./core";

export const windows = (today: string) => ({ W0: addDays(today, -7), W1: addDays(today, -14), D30: addDays(today, -30) });

/** Punti della squadra con data in [from, to). */
export function rangePts(team: Team, acts: Activity[], teamOf: TeamOf, from: string, to = "9999"): number {
  return teamPts(team, acts.filter((a) => a.date >= from && a.date < to), teamOf);
}

export interface WeekRow extends StandingRow {
  /** punti nei 7 giorni precedenti */
  prevW: number;
}

export function weekRows(teams: Team[], acts: Activity[], teamOf: TeamOf, tiebreak: Tiebreak, today: string): WeekRow[] {
  const { W0, W1 } = windows(today);
  return standings(teams, acts.filter((a) => a.date >= W0), teamOf, tiebreak).map((r) => ({
    ...r,
    prevW: rangePts(r.team, acts, teamOf, W1, W0),
  }));
}

export interface PowerRow {
  team: Team;
  i: number;
  /** punteggio di forma = 2 × ultimi 7 gg + punti dall'8° al 30° giorno */
  sc: number;
  /** punti ultimi 7 giorni */
  w: number;
  /** punti dall'8° al 30° giorno */
  m: number;
  pos: number;
  /** posizione nella classifica ufficiale */
  off: number;
}

export function powerRows(
  teams: Team[],
  acts: Activity[],
  teamOf: TeamOf,
  official: StandingRow[],
  today: string,
): PowerRow[] {
  const { W0, D30 } = windows(today);
  const rows = teams.map((team, i) => {
    const w = rangePts(team, acts, teamOf, W0);
    const m = rangePts(team, acts, teamOf, D30, W0);
    return { team, i, sc: 2 * w + m, w, m, pos: 0, off: 0 };
  });
  // a parità di forma: più punti negli ultimi 30 giorni, poi ordine delle squadre
  rows.sort((a, b) => b.sc - a.sc || b.w + b.m - (a.w + a.m) || a.i - b.i);
  rows.forEach((r) => {
    r.pos = 1 + rows.filter((o) => o.sc > r.sc).length;
    r.off = official.find((x) => x.team.id === r.team.id)!.pos;
  });
  return rows;
}
