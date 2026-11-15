import { describe, expect, it } from "vitest";
import { checkPositions, formulaPoints, positionPts } from "@/lib/calc/formula";

describe("formula del punteggio", () => {
  const torneo = { level: 2, kind: "collettivo", participation: true } as const;
  const gara = { level: 3, kind: "singolo", participation: false } as const;

  it("esempi del regolamento", () => {
    expect(formulaPoints({ pos: 1 }, torneo).pts).toBe(42);
    expect(formulaPoints({ pos: 4 }, torneo).pts).toBe(18);
    expect(formulaPoints({ pos: 8 }, torneo).pts).toBe(2);
    expect(formulaPoints({ pos: 3 }, gara).pts).toBe(18);
    expect(formulaPoints({ pos: 6 }, gara).pts).toBe(0);
  });

  it("tabella rapida (senza partecipazione)", () => {
    const row = (pos: number) =>
      (["collettivo", "singolo"] as const).flatMap((kind) => ([1, 2, 3] as const).map((level) => formulaPoints({ pos }, { level, kind, participation: false }).pts));
    expect(row(1)).toEqual([20, 40, 60, 10, 20, 30]);
    expect(row(5)).toEqual([4, 8, 12, 2, 4, 6]);
  });

  it("riconoscimenti e meriti = 1 × livello, anche senza partecipazione", () => {
    expect(formulaPoints({ merit: true }, gara).pts).toBe(3);
    expect(formulaPoints({ merit: true }, { ...torneo, level: 1 }).pts).toBe(1);
  });

  it("posizioni fuori scala", () => {
    expect([0, 1, 5, 6, 2.5].map(positionPts)).toEqual([0, 10, 2, 0, 0]);
  });

  it("pari merito: la posizione successiva viene saltata", () => {
    expect(checkPositions([1, 1, 3, 4])).toEqual([]);
    expect(checkPositions([1, 1, 2])).toHaveLength(1);
    expect(checkPositions([1, 2, 2, 4, 5])).toEqual([]);
    expect(checkPositions([2, 3])).toHaveLength(2);
  });
});
