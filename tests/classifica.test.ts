import { describe, expect, it } from "vitest";
import { classPts, history, previousPositions, standings, sum, teamOfMap, teamPts, variation } from "@/lib/calc/core";
import { act, C, T, teams } from "./helpers";

const teamOf = teamOfMap(teams);
const ids = (rows: ReturnType<typeof standings>) => rows.map((r) => r.team.id);

describe("classifica e pari merito", () => {
  it("a zero punti tutte le squadre sono prime a pari merito, nell'ordine ufficiale", () => {
    const st = standings(teams, [], teamOf, "ultima");
    expect(st.every((r) => r.pos === 1 && r.pts === 0)).toBe(true);
    expect(ids(st)).toEqual(teams.map((t) => t.id));
  });

  it("stessi punti = stessa posizione, la posizione successiva salta (1, 1, 3)", () => {
    const acts = [act("2026-10-01", [[C("eleonora"), 10], [C("shardana"), 10], [C("mamuthones"), 5]])];
    const st = standings(teams, acts, teamOf, "nessuno");
    const pos = Object.fromEntries(st.map((r) => [r.team.id, r.pos]));
    expect(pos.eleonora).toBe(1);
    expect(pos.shardana).toBe(1);
    expect(pos.mamuthones).toBe(3);
    expect(pos.componidori).toBe(4);
    expect(pos["mariano-iv"]).toBe(4);
  });

  it("i punti di squadra sono la somma esatta dei punti delle sue classi", () => {
    const acts = [
      act("2026-10-01", [[C("eleonora", 0), 10], [C("eleonora", 1), 3, "individuale"], [C("eleonora", 2), -2]]),
      act("2026-10-02", [[C("eleonora", 0), 4]]),
    ];
    expect(teamPts(T.eleonora, acts, teamOf)).toBe(15);
    expect(sum(T.eleonora.classes.map((c) => classPts(c, acts)))).toBe(15);
    expect(classPts(C("eleonora", 1), acts, "individuale")).toBe(3);
    expect(classPts(C("eleonora", 1), acts, "collettiva")).toBe(0);
  });
});

describe("spareggio", () => {
  // Eleonora e Shardana a 12 punti.
  // Eleonora: 2 attività con punti, 2 punti nell'ultima. Shardana: 1 attività, 0 nell'ultima.
  const acts = [
    act("2026-10-01", [[C("shardana"), 12], [C("eleonora"), 10]]),
    act("2026-10-08", [[C("eleonora"), 2], [C("componidori"), 1]]),
  ];

  it('"ultima": davanti chi ha fatto più punti nell\'ultima attività', () => {
    const st = standings(teams, acts, teamOf, "ultima");
    expect(ids(st).slice(0, 2)).toEqual(["eleonora", "shardana"]);
    expect(st[0].pos).toBe(1);
    expect(st[1].pos).toBe(1); // la posizione resta pari merito
  });

  it('"attivita": davanti chi ha preso punti in più attività', () => {
    expect(ids(standings(teams, acts, teamOf, "attivita")).slice(0, 2)).toEqual(["eleonora", "shardana"]);
  });

  it('"nessuno": vale l\'ordine ufficiale delle squadre', () => {
    // Eleonora (indice 2) viene prima di Shardana (indice 4)
    expect(ids(standings(teams, acts, teamOf, "nessuno")).slice(0, 2)).toEqual(["eleonora", "shardana"]);
    const acts2 = [act("2026-10-01", [[C("shardana"), 5], [C("componidori"), 5]])];
    expect(ids(standings(teams, acts2, teamOf, "nessuno")).slice(0, 2)).toEqual(["componidori", "shardana"]);
  });

  it("lo spareggio non cambia mai i punti", () => {
    const a = standings(teams, acts, teamOf, "ultima").map((r) => [r.team.id, r.pts]);
    const b = standings(teams, acts, teamOf, "attivita").map((r) => [r.team.id, r.pts]);
    expect(Object.fromEntries(a)).toEqual(Object.fromEntries(b));
  });
});

describe("variazioni ▲▼", () => {
  it("non disponibili con una sola attività", () => {
    const acts = [act("2026-10-01", [[C("eleonora"), 5]])];
    expect(previousPositions(teams, acts, teamOf, "ultima")).toBeNull();
    expect(variation(null, "eleonora", 1)).toBeNull();
  });

  it("confrontano la posizione con quella prima dell'ultima attività", () => {
    const acts = [
      act("2026-10-01", [[C("eleonora"), 10], [C("shardana"), 5]]),
      act("2026-10-08", [[C("shardana"), 8], [C("mamuthones"), 20]]),
    ];
    const prev = previousPositions(teams, acts, teamOf, "ultima")!;
    const st = standings(teams, acts, teamOf, "ultima");
    const pos = (id: string) => st.find((r) => r.team.id === id)!.pos;
    expect(variation(prev, "mamuthones", pos("mamuthones"))).toBe(2); // da 3° (pari merito) a 1°
    expect(variation(prev, "shardana", pos("shardana"))).toBe(0); // 2° → 2°
    expect(variation(prev, "eleonora", pos("eleonora"))).toBe(-2); // 1° → 3°
  });

  it("lo storico ricostruisce la classifica dopo ogni attività", () => {
    const acts = [act("2026-10-01", [[C("eleonora"), 3]]), act("2026-10-02", [[C("eleonora"), 4], [C("shardana"), 9]])];
    const h = history(teams, acts, teamOf, "ultima");
    expect(h[0].pts.eleonora).toBe(3);
    expect(h[1].pts.eleonora).toBe(7);
    expect(h[1].ap.shardana).toBe(9);
    expect(h[1].pos.shardana).toBe(1);
    expect(h[1].prevPos!.eleonora).toBe(1);
  });
});
