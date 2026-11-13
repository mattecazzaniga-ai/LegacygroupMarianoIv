/** Legacy Moment: sorpassi, record, traguardi, squadra al completo (rilevati in automatico). */
import type { Activity, Team } from "../types";
import { allClasses, classPts, soleLeader, type HistEntry, type TeamOf } from "./core";

export interface Moment {
  d: string;
  k: number;
  t: string;
  s: string;
}

const MILESTONES = [50, 100, 200, 300, 500, 750, 1000];

/** Dal più recente al più vecchio. */
export function moments(teams: Team[], acts: Activity[], teamOf: TeamOf, hist: HistEntry[]): Moment[] {
  const M: Moment[] = [];
  const CLS = allClasses(teams);
  const seenCls = new Set<string>();
  const done = new Set<string>();
  const full = new Set<string>();
  let prevLead: Team | null = null;
  let recordV = 0;

  hist.forEach((h) => {
    const d = h.a.date,
      k = h.k;
    const add = (t: string, s: string) => M.push({ d, k, t, s });
    if (k === 0) add("Si parte!", "È stata conclusa la prima attività: " + h.a.title + ".");
    h.a.awards.forEach((w) => {
      if (!seenCls.has(w.cls)) {
        seenCls.add(w.cls);
        if (seenCls.size === 1) add("Primi punti assegnati", "La classe " + w.cls + " (" + teamOf[w.cls].name + ") apre il conteggio.");
        if (seenCls.size === CLS.length) add("Tutte le classi a punti", "Tutte le " + CLS.length + " classi hanno almeno un punto.");
      }
    });
    const lead = soleLeader(h.st);
    if (lead && lead.id !== prevLead?.id) {
      add(
        prevLead ? "Cambio al vertice" : "Nuovo leader",
        prevLead ? lead.name + " supera " + prevLead.name + " e conquista la testa della classifica." : lead.name + " è la prima squadra in vetta.",
      );
    }
    if (lead) prevLead = lead;
    const upTo = acts.slice(0, k + 1);
    teams.forEach((g) => {
      MILESTONES.forEach((t) => {
        const key = g.id + t;
        if (!done.has(key) && h.pts[g.id] >= t) {
          done.add(key);
          add(g.name + " a quota " + t, g.name + " supera i " + t + " punti.");
        }
      });
      if (!full.has(g.id) && g.classes.length > 0 && g.classes.every((c) => classPts(c, upTo) > 0)) {
        full.add(g.id);
        add("Squadra al completo", "Tutte le classi dei " + g.name + " hanno preso punti.");
      }
      if (h.ap[g.id] > recordV) {
        if (recordV > 0 && k > 0) add("Nuovo record di giornata", g.name + " porta a " + h.ap[g.id] + " il massimo di punti in una sola attività.");
        recordV = h.ap[g.id];
      }
    });
    if (h.before && h.before.some((r) => r.pts > 0)) {
      const gap = h.st[0].pts - h.st[1].pts,
        pg = h.before[0].pts - h.before[1].pts;
      if (gap <= 3 && pg > 3)
        add("Testa a testa", "Solo " + gap + (gap === 1 ? " punto" : " punti") + " separano " + h.st[0].team.name + " e " + h.st[1].team.name + ".");
    }
    if ([10, 25, 50].includes(k + 1)) add(k + 1 + " attività concluse", "Legacy Group ha raggiunto quota " + (k + 1) + " attività.");
  });
  return M.reverse();
}
