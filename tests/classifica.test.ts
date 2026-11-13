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
    const acts = [act("2026-10-01", [[C("janas"), 10], [C("shardana"), 10], [C("mamuthone"), 5]])];
    const st = standings(teams, acts, teamOf, "nessuno");
    const pos = Object.fromEntries(st.map((r) => [r.team.id, r.pos]));
    expect(pos.janas).toBe(1);
    expect(pos.shardana).toBe(1);
    expect(pos.mamuthone).toBe(3);
    expect(pos.componidori).toBe(4);
    expect(pos.issohadores).toBe(4);
  });

  it("i punti di squadra sono la somma esatta dei punti delle sue classi", () => {
    const acts = [
      act("2026-10-01", [[C("janas", 0), 10], [C("janas", 1), 3, "individuale"], [C("janas", 2), -2]]),
      act("2026-10-02", [[C("janas", 0), 4]]),
    ];
    expect(teamPts(T.janas, acts, teamOf)).toBe(15);
    expect(sum(T.janas.classes.map((c) => classPts(c, acts)))).toBe(15);
    expect(classPts(C("janas", 1), acts, "individuale")).toBe(3);
    expect(classPts(C("janas", 1), acts, "collettiva")).toBe(0);
  });
});

describe("spareggio", () => {
  // Janas e Shardana a 12 punti.
  // Janas: 2 attività con punti, 2 punti nell'ultima. Shardana: 1 attività, 0 nell'ultima.
  const acts = [
    act("2026-10-01", [[C("shardana"), 12], [C("janas"), 10]]),
    act("2026-10-08", [[C("janas"), 2], [C("componidori"), 1]]),
  ];

  it('"ultima": davanti chi ha fatto più punti nell\'ultima attività', () => {
    const st = standings(teams, acts, teamOf, "ultima");
    expect(ids(st).slice(0, 2)).toEqual(["janas", "shardana"]);
    expect(st[0].pos).toBe(1);
    expect(st[1].pos).toBe(1); // la posizione resta pari merito
  });

  it('"attivita": davanti chi ha preso punti in più attività', () => {
    expect(ids(standings(teams, acts, teamOf, "attivita")).slice(0, 2)).toEqual(["janas", "shardana"]);
  });

  it('"nessuno": vale l\'ordine ufficiale delle squadre', () => {
    // Janas (indice 2) viene prima di Shardana (indice 4)
    expect(ids(standings(teams, acts, teamOf, "nessuno")).slice(0, 2)).toEqual(["janas", "shardana"]);
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
    const acts = [act("2026-10-01", [[C("janas"), 5]])];
    expect(previousPositions(teams, acts, teamOf, "ultima")).toBeNull();
    expect(variation(null, "janas", 1)).toBeNull();
  });

  it("confrontano la posizione con quella prima dell'ultima attività", () => {
    const acts = [
      act("2026-10-01", [[C("janas"), 10], [C("shardana"), 5]]),
      act("2026-10-08", [[C("shardana"), 8], [C("mamuthone"), 20]]),
    ];
    const prev = previousPositions(teams, acts, teamOf, "ultima")!;
    const st = standings(teams, acts, teamOf, "ultima");
    const pos = (id: string) => st.find((r) => r.team.id === id)!.pos;
    expect(variation(prev, "mamuthone", pos("mamuthone"))).toBe(2); // da 3° (pari merito) a 1°
    expect(variation(prev, "shardana", pos("shardana"))).toBe(0); // 2° → 2°
    expect(variation(prev, "janas", pos("janas"))).toBe(-2); // 1° → 3°
  });

  it("lo storico ricostruisce la classifica dopo ogni attività", () => {
    const acts = [act("2026-10-01", [[C("janas"), 3]]), act("2026-10-02", [[C("janas"), 4], [C("shardana"), 9]])];
    const h = history(teams, acts, teamOf, "ultima");
    expect(h[0].pts.janas).toBe(3);
    expect(h[1].pts.janas).toBe(7);
    expect(h[1].ap.shardana).toBe(9);
    expect(h[1].pos.shardana).toBe(1);
    expect(h[1].prevPos!.janas).toBe(1);
  });
});
