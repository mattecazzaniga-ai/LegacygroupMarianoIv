/** Hall of Fame: record automatici. Solo squadre e classi, mai nomi di studenti. */
import { fmtS, mondayOf } from "../dates";
import type { Activity, Team } from "../types";
import { actPts, allClasses, classPts, teamActs, teamPts, winnersOf, type HistEntry, type TeamOf } from "./core";

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

  const ca = hist.flatMap((h) => {
    const m: Record<string, number> = {};
    h.a.awards.forEach((w) => (m[w.cls] = (m[w.cls] || 0) + w.pts));
    return Object.entries(m).map(([c, v]) => ({ h, c, v }));
  });
  const c1 = best(ca, (x) => x.v);
  if (c1 && c1.v > 0 && teamOf[c1.c])
    R.push({ id: "classe-attivita", k: "Più punti in una attività (classe)", v: c1.v, n: c1.c, s: teamOf[c1.c].name + " · " + c1.h.a.title, team: teamOf[c1.c] });

  const c2 = best(CLS.map((c) => ({ c, v: classPts(c, acts) })), (x) => x.v);
  if (c2 && c2.v > 0) R.push({ id: "classe-top", k: "Classe con più punti", v: c2.v, n: c2.c, s: teamOf[c2.c].name, team: teamOf[c2.c] });

  const c3 = best(CLS.map((c) => ({ c, v: classPts(c, acts, "individuale") })), (x) => x.v);
  if (c3 && c3.v > 0)
    R.push({ id: "classe-individuali", k: "Classe con più punti individuali", v: c3.v, n: c3.c, s: teamOf[c3.c].name, team: teamOf[c3.c] });

  const w1 = best(teams.map((g) => ({ g, v: hist.filter((h) => winnersOf(h, teams).some((t) => t.id === g.id)).length })), (x) => x.v);
  if (w1 && w1.v > 0) R.push({ id: "vittorie", k: "Più attività vinte", v: w1.v, n: w1.g.name, s: "attività con più punti della giornata", team: w1.g });

  const a1 = best(
    teams.filter((g) => teamActs(g, acts, teamOf) > 0).map((g) => ({ g, v: Math.round((teamPts(g, acts, teamOf) / teamActs(g, acts, teamOf)) * 10) / 10 })),
    (x) => x.v,
  );
  if (a1) R.push({ id: "media", k: "Miglior media per attività", v: a1.v, n: a1.g.name, s: "punti per attività a cui ha partecipato", team: a1.g });

  // miglior settimana (lunedì–domenica)
  const wk: Record<string, number> = {};
  acts.forEach((a) => {
    const key = mondayOf(a.date);
    teams.forEach((g) => {
      const k2 = key + "|" + g.id;
      wk[k2] = (wk[k2] || 0) + actPts(a, g, teamOf);
    });
  });
  const b = best(Object.entries(wk).map(([k, v]) => ({ k, v })), (x) => x.v);
  if (b && b.v > 0) {
    const [day, gid] = b.k.split("|");
    const g = teams.find((t) => t.id === gid)!;
    R.push({ id: "settimana", k: "Miglior settimana", v: b.v, n: g.name, s: "settimana del " + fmtS(day), team: g });
  }

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
