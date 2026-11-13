/**
 * Podio della settimana.
 * Finestre (come in index3.html), con `today` = oggi a Oristano:
 *  - W0  = today − 7  → "ultimi 7 giorni" = attività con data ≥ W0
 *  - W1  = today − 14 → "7 giorni precedenti" = W1 ≤ data < W0
 */
import { addDays } from "../dates";
import type { Activity, Team, Tiebreak } from "../types";
import { standings, teamPts, type StandingRow, type TeamOf } from "./core";

export const windows = (today: string) => ({ W0: addDays(today, -7), W1: addDays(today, -14) });

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
