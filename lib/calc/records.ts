/** Hall of Fame: record automatici. Solo squadre e classi, mai nomi di studenti. */
import { fmtS } from "../dates";
import type { Activity, Team } from "../types";
import { allClasses, classPts, winnersOf, type HistEntry, type TeamOf } from "./core";

export interface RecordItem {
  id: string;
  k: string; // titolo del record
  v: number | string; // valore
  n: string; // squadra o classe
  s: string; // dettaglio
  team: Team;
}

/** Il primo elemento con il valore massimo (a parità vince chi viene prima). */
function best<T>(arr: T[], f: (x: T) => number): T | null {
  return arr.reduce<T | null>((b, x) => (b === null || f(x) > f(b) ? x : b), null);
}

export function records(teams: Team[], acts: Activity[], teamOf: TeamOf, hist: HistEntry[]): RecordItem[] {
  const R: RecordItem[] = [];
  if (!acts.length) return R;
  const CLS = allClasses(teams);

  const ta = hist.flatMap((h) => teams.map((g) => ({ h, g, v: h.ap[g.id] })));
  const t1 = best(ta, (x) => x.v);
  if (t1 && t1.v > 0)
    R.push({ id: "squadra-attivita", k: "Più punti in una attività (squadra)", v: t1.v, n: t1.g.name, s: t1.h.a.title + " · " + fmtS(t1.h.a.date), team: t1.g });


  const c2 = best(CLS.map((c) => ({ c, v: classPts(c, acts) })), (x) => x.v);
  if (c2 && c2.v > 0) R.push({ id: "classe-top", k: "Classe con più punti", v: c2.v, n: c2.c, s: teamOf[c2.c].name, team: teamOf[c2.c] });


  const w1 = best(teams.map((g) => ({ g, v: hist.filter((h) => winnersOf(h, teams).some((t) => t.id === g.id)).length })), (x) => x.v);
  if (w1 && w1.v > 0) R.push({ id: "vittorie", k: "Più sfide vinte", v: w1.v, n: w1.g.name, s: "sfide con una squadra vincitrice", team: w1.g });



  // serie più lunga in testa (anche a pari merito al primo posto)
  let bestRun: { g: Team; v: number } | null = null;
  teams.forEach((g) => {
    let run = 0;
    hist.forEach((h) => {
      if (h.pts[g.id] > 0 && h.pos[g.id] === 1) {
        run++;
        if (!bestRun || run > bestRun.v) bestRun = { g, v: run };
      } else run = 0;
    });
  });
  if (bestRun) {
    const br = bestRun as { g: Team; v: number };
    R.push({ id: "serie", k: "Più attività consecutive in testa", v: br.v, n: br.g.name, s: "serie record in prima posizione", team: br.g });
  }

  // maggior risalita in una sola attività
  let jump: { g: Team; v: number; h: HistEntry } | null = null;
  hist.forEach((h) => {
    if (!h.prevPos) return;
    teams.forEach((g) => {
      const d = h.prevPos![g.id] - h.pos[g.id];
      if (d > 0 && (!jump || d > jump.v)) jump = { g, v: d, h };
    });
  });
  if (jump) {
    const j = jump as { g: Team; v: number; h: HistEntry };
    R.push({ id: "risalita", k: "Maggiore risalita in classifica", v: "+" + j.v, n: j.g.name, s: "posizioni guadagnate · " + j.h.a.title, team: j.g });
  }

  // vantaggio massimo della prima sulla seconda
  let gap: { v: number; g: Team; h: HistEntry } | null = null;
  hist.forEach((h) => {
    const d = h.st[0].pts - h.st[1].pts;
    if (d > 0 && (!gap || d > gap.v)) gap = { v: d, g: h.st[0].team, h };
  });
  if (gap) {
    const gp = gap as { v: number; g: Team; h: HistEntry };
    R.push({ id: "vantaggio", k: "Maggior vantaggio in testa", v: gp.v, n: gp.g.name, s: "punti sulla seconda · dopo " + gp.h.a.title, team: gp.g });
  }
  return R;
}

export interface ChallengeWinner {
  act: Activity;
  /** squadre vincitrici (più di una se pari merito) */
  teams: Team[];
  pts: number;
  /** classi con più punti nella sfida */
  classes: string[];
  classPts: number;
}

/** Albo delle sfide: le sfide con una squadra vincitrice indicata dagli organizzatori. Dalla più recente. */
export function challengeWinners(teams: Team[], hist: HistEntry[]): ChallengeWinner[] {
  return hist
    .map((h) => {
      const w = winnersOf(h, teams);
      const byCls: Record<string, number> = {};
      h.a.awards.forEach((x) => (byCls[x.cls] = (byCls[x.cls] || 0) + x.pts));
      const best = Math.max(0, ...Object.values(byCls));
      return {
        act: h.a,
        teams: w,
        pts: w.length ? h.ap[w[0].id] : 0,
        classes: best > 0 ? Object.keys(byCls).filter((c) => byCls[c] === best).sort() : [],
        classPts: best > 0 ? best : 0,
      };
    })
    .filter((x) => x.teams.length > 0)
    .reverse();
}
