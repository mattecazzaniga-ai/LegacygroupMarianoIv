/**
 * I 5 riconoscimenti automatici. Nessuna soglia di punti fissa: il punteggio cambia da una sfida
 * all'altra, quindi ogni riconoscimento confronta le squadre tra loro e si assegna solo con dati sufficienti.
 */
import type { Activity, Team } from "../types";
import { winnersOf, type HistEntry, type StandingRow } from "./core";
import type { WeekRow } from "./week";

export type BadgeIcon = "crown" | "flame" | "shield" | "star" | "bolt" | "up" | "pulse" | "team";

export interface BadgeInput {
  acts: Activity[];
  hist: HistEntry[];
  now: StandingRow[];
  week: WeekRow[];
  teams: Team[];
  /** posizioni prima dell'ultima giornata di sfide */
  prevPos: Record<string, number> | null;
}

export interface Badge {
  id: string;
  name: string;
  ic: BadgeIcon;
  rule: string;
  /** id delle squadre che lo detengono ora */
  owners: (x: BadgeInput) => string[];
}

/** Squadre con il valore massimo (>0). Con `unique` solo se la prima è da sola. */
function top(teams: Team[], v: (g: Team) => number, unique = false): string[] {
  const vals = teams.map((g) => ({ id: g.id, v: v(g) }));
  const max = Math.max(0, ...vals.map((x) => x.v));
  if (max <= 0) return [];
  const best = vals.filter((x) => x.v === max);
  if (unique && best.length > 1) return [];
  return best.map((x) => x.id);
}

/** Quota di attività in cui la squadra ha preso punti. */
export const continuity = (g: Team, hist: HistEntry[]) => (hist.length ? hist.filter((h) => h.ap[g.id] > 0).length / hist.length : 0);

export const winsOf = (g: Team, x: Pick<BadgeInput, "hist" | "teams">) =>
  x.hist.filter((h) => winnersOf(h, x.teams).some((t) => t.id === g.id)).length;

export const BADGES: Badge[] = [
  {
    id: "leader",
    name: "Leader",
    ic: "crown",
    rule: "È prima in classifica generale (anche a pari merito).",
    owners: (x) => (x.now[0]?.pts > 0 ? x.now.filter((r) => r.pos === 1).map((r) => r.team.id) : []),
  },
  {
    id: "rimonta",
    name: "Rimonta",
    ic: "up",
    rule: "Ha guadagnato più posizioni rispetto alla classifica prima dell'ultima giornata di sfide.",
    owners: (x) => (x.prevPos ? top(x.teams, (g) => x.prevPos![g.id] - (x.now.find((r) => r.team.id === g.id)?.pos ?? 0)) : []),
  },
  {
    id: "costanza",
    name: "Costanza",
    ic: "shield",
    rule: "Ha preso punti nel maggior numero di attività (servono almeno 3 attività).",
    owners: (x) => {
      if (x.hist.length < 3) return [];
      const ids = top(x.teams, (g) => continuity(g, x.hist));
      return ids.length === x.teams.length ? [] : ids; // se sono tutte uguali non distingue nessuno
    },
  },
  {
    id: "dominatore",
    name: "Dominatore",
    ic: "star",
    rule: "Ha vinto più sfide tra quelle che prevedono una squadra vincitrice (almeno 2, senza pari merito).",
    owners: (x) => {
      const ids = top(x.teams, (g) => winsOf(g, x), true);
      return ids.length && winsOf(x.teams.find((t) => t.id === ids[0])!, x) >= 2 ? ids : [];
    },
  },
  {
    id: "momento",
    name: "Squadra del momento",
    ic: "pulse",
    rule: "Ha fatto più punti negli ultimi 7 giorni.",
    owners: (x) => (x.week[0]?.pts > 0 ? x.week.filter((r) => r.pos === 1).map((r) => r.team.id) : []),
  },
];

export const badgesOf = (g: Team, x: BadgeInput) => BADGES.filter((b) => b.owners(x).includes(g.id));
