/** Mette insieme tutti i calcoli per un dataset. Usato sia dal server sia dal browser. */
import type { Activity, Team, Tiebreak } from "../types";
import { badgesOf, type BadgeInput } from "./badges";
import { history, previousPositions, standings, teamOfMap, type TeamOf } from "./core";
import { moments } from "./moments";
import { records } from "./records";
import { weekRows, windows } from "./week";

export interface ModelInput {
  teams: Team[];
  acts: Activity[];
  tiebreak: Tiebreak;
  today: string;
}

export function buildModel({ teams, acts, tiebreak, today }: ModelInput) {
  const teamOf: TeamOf = teamOfMap(teams);
  const now = standings(teams, acts, teamOf, tiebreak);
  const prevPos = previousPositions(teams, acts, teamOf, tiebreak);
  const hist = history(teams, acts, teamOf, tiebreak);
  const week = weekRows(teams, acts, teamOf, tiebreak, today);
  const badgeInput: BadgeInput = { acts, hist, now, week, teams };
  return {
    teams,
    acts,
    teamOf,
    today,
    started: acts.length > 0,
    now,
    prevPos,
    hist,
    week,
    windows: windows(today),
    records: records(teams, acts, teamOf, hist),
    moments: moments(teams, acts, teamOf, hist),
    badgesOf: (g: Team) => badgesOf(g, badgeInput),
  };
}

export type Model = ReturnType<typeof buildModel>;
