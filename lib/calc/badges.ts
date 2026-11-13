/** Gli 8 badge automatici delle squadre. */
import type { Activity, Team } from "../types";
import { classPts, winnersOf, type HistEntry, type StandingRow } from "./core";
import type { WeekRow } from "./week";

export const THR_BIG = 15;

export type BadgeIcon = "crown" | "flame" | "shield" | "star" | "bolt" | "up" | "pulse" | "team";

export interface BadgeInput {
  acts: Activity[];
  hist: HistEntry[];
  now: StandingRow[];
  week: WeekRow[];
  teams: Team[];
}

export interface Badge {
  id: string;
  name: string;
  ic: BadgeIcon;
  rule: string;
  test: (g: Team, x: BadgeInput) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: "leader",
    name: "Leader",
    ic: "crown",
    rule: "È prima in classifica generale.",
    test: (g, x) => x.acts.length > 0 && x.now[0].pts > 0 && x.now.find((r) => r.team.id === g.id)!.pos === 1,
  },
  {
    id: "fiamme",
    name: "In fiamme",
    ic: "flame",
    rule: "Ha preso punti nelle ultime 3 attività (almeno 3 svolte).",
    test: (g, x) => x.hist.length >= 3 && x.hist.slice(-3).every((h) => h.ap[g.id] > 0),
  },
  {
    id: "costanza",
    name: "Costanza",
    ic: "shield",
    rule: "Ha preso punti in tutte le attività finora (almeno 4).",
    test: (g, x) => x.hist.length >= 4 && x.hist.every((h) => h.ap[g.id] > 0),
  },
  {
    id: "dominatore",
    name: "Dominatore",
    ic: "star",
    rule: "Ha vinto almeno 3 attività.",
    test: (g, x) => x.hist.filter((h) => winnersOf(h, x.teams).some((t) => t.id === g.id)).length >= 3,
  },
  {
    id: "colpo",
    name: "Colpo grosso",
    ic: "bolt",
    rule: `Almeno ${THR_BIG} punti in una sola attività.`,
    test: (g, x) => x.hist.some((h) => h.ap[g.id] >= THR_BIG),
  },
  {
    id: "rimonta",
    name: "Rimonta",
    ic: "up",
    rule: "Ha guadagnato 2 o più posizioni nell'ultima attività.",
    test: (g, x) => {
      const h = x.hist[x.hist.length - 1];
      return !!(h && h.prevPos && h.prevPos[g.id] - h.pos[g.id] >= 2);
    },
  },
  {
    id: "momento",
    name: "Squadra del momento",
    ic: "pulse",
    rule: "Più punti negli ultimi 7 giorni.",
    test: (g, x) => x.week[0].pts > 0 && x.week.find((r) => r.team.id === g.id)!.pos === 1,
  },
  {
    id: "completa",
    name: "Squadra al completo",
    ic: "team",
    rule: "Tutte le sue classi hanno almeno un punto.",
    test: (g, x) => g.classes.length > 0 && g.classes.every((c) => classPts(c, x.acts) > 0),
  },
];

export const badgesOf = (g: Team, x: BadgeInput) => BADGES.filter((b) => b.test(g, x));
