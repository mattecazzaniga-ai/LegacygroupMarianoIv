import { describe, expect, it } from "vitest";
import { teamOfMap } from "@/lib/calc/core";
import { history } from "@/lib/calc/core";
import { avgShare, bestBy, classAvg, headToHead, placeIn, ptsByType, teamAvg } from "@/lib/calc/stats";
import { act, C, T, teams } from "./helpers";

const teamOf = teamOfMap(teams);

describe("statistiche con punteggio variabile", () => {
  const acts = [
    act("2026-10-01", [[C("eleonora"), 100], [C("shardana"), 100]], "Torneo"), // sfida "grande"
    act("2026-10-08", [[C("eleonora"), 1], [C("shardana"), 3]], "Quiz"), // sfida "piccola"
    act("2026-10-15", [[C("shardana"), 2]], "Aiuto"),
  ];
  acts[0].type = "Sport";
  acts[1].type = "Cultura";

  it("media = punti ÷ attività in cui si è preso punti", () => {
    expect(teamAvg(T.eleonora, acts, teamOf)).toEqual({ pts: 101, n: 2, avg: 50.5 });
    expect(classAvg(C("shardana"), acts)).toEqual({ pts: 105, n: 3, avg: 35 });
  });

  it("quota media: ogni sfida pesa uguale, qualunque sia il suo punteggio; le quote sommano a 1", () => {
    const e = avgShare(T.eleonora, acts, teamOf),
      s = avgShare(T.shardana, acts, teamOf);
    expect(e).toBeCloseTo((0.5 + 0.25 + 0) / 3);
    expect(s).toBeCloseTo((0.5 + 0.75 + 1) / 3);
    expect(teams.reduce((x, g) => x + avgShare(g, acts, teamOf), 0)).toBeCloseTo(1);
  });

  it("punti per tipologia, senza tipo = Altro", () => {
    expect(ptsByType(acts)).toEqual([
      { type: "Sport", pts: 200, n: 1 },
      { type: "Cultura", pts: 4, n: 1 },
      { type: "Altro", pts: 2, n: 1 },
    ]);
    expect(ptsByType(acts, (c) => teamOf[c].id === "eleonora").map((x) => x.type)).toEqual(["Sport", "Cultura"]);
  });

  it("migliore per media: preferisce chi ha almeno 2 attività", () => {
    const rows = [
      { id: "x", a: { pts: 50, n: 1, avg: 50 } },
      { id: "y", a: { pts: 30, n: 2, avg: 15 } },
    ];
    expect(bestBy(rows)!.id).toBe("y");
    expect(bestBy(rows.slice(0, 1))!.id).toBe("x");
    expect(bestBy([])).toBeNull();
  });
});

describe("scontri diretti", () => {
  const acts = [
    act("2026-10-01", [[C("eleonora"), 10], [C("shardana"), 4]], "Calcetto"),
    act("2026-10-02", [[C("eleonora"), 10]], "Solo Eleonora"), // Shardana assente: non è uno scontro diretto
    act("2026-10-03", [[C("eleonora"), 2], [C("shardana"), 9]], "Quiz"),
    act("2026-10-04", [[C("eleonora"), 5], [C("shardana"), 5]], "Pallavolo"),
  ];
  acts[3].winner = "shardana"; // vince ai rigori: decide l'organizzazione
  const h = history(teams, acts, teamOf, "ultima");

  it("solo le sfide in cui entrambe hanno preso punti; esito dai punti o dalla vincitrice indicata", () => {
    const m = headToHead(T.eleonora, T.shardana, h, teams);
    expect(m.map((x) => [x.a.title, x.res, x.byWinner])).toEqual([
      ["Calcetto", "A", false],
      ["Quiz", "B", false],
      ["Pallavolo", "B", true],
    ]);
    expect(headToHead(T.eleonora, T.mamuthones, h, teams)).toEqual([]);
  });

  it("piazzamento nella singola sfida", () => {
    expect(placeIn(h[0], T.eleonora, teams)).toBe(1);
    expect(placeIn(h[0], T.shardana, teams)).toBe(2);
    expect(placeIn(h[1], T.shardana, teams)).toBeNull();
  });
});
