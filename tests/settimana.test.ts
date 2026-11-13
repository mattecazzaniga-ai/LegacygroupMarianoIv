import { describe, expect, it } from "vitest";
import { standings, teamOfMap } from "@/lib/calc/core";
import { powerRows, rangePts, weekRows, windows } from "@/lib/calc/week";
import { act, C, T, teams } from "./helpers";

const teamOf = teamOfMap(teams);
const today = "2026-11-13";

describe("podio della settimana", () => {
  it("finestre: ultimi 7 giorni da oggi−7, precedenti da oggi−14 a oggi−7 escluso", () => {
    expect(windows(today)).toEqual({ W0: "2026-11-06", W1: "2026-10-30", D30: "2026-10-14" });
  });

  it("conta solo le attività degli ultimi 7 giorni e le confronta con i 7 precedenti", () => {
    const acts = [
      act("2026-10-29", [[C("eleonora"), 50]]), // fuori da entrambe le finestre
      act("2026-10-30", [[C("eleonora"), 4]]), // settimana precedente
      act("2026-11-05", [[C("shardana"), 7]]), // settimana precedente (ultimo giorno)
      act("2026-11-06", [[C("shardana"), 3]]), // ultimi 7 giorni (primo giorno)
      act("2026-11-13", [[C("eleonora"), 2], [C("mamuthones"), 3]]), // oggi
    ];
    const w = weekRows(teams, acts, teamOf, "ultima", today);
    const get = (id: string) => w.find((r) => r.team.id === id)!;
    expect(get("shardana").pts).toBe(3);
    expect(get("shardana").prevW).toBe(7);
    expect(get("eleonora").pts).toBe(2);
    expect(get("eleonora").prevW).toBe(4);
    expect(get("mamuthones").pts).toBe(3);
    // Shardana e Mamuthone a 3: pari merito; spareggio "ultima" → Mamuthone (3 nell'ultima) davanti
    expect(w[0].team.id).toBe("mamuthones");
    expect(w[0].pos).toBe(1);
    expect(w[1].pos).toBe(1);
  });

  it("si aggiorna da solo con il passare dei giorni (nessuna attività recente = tutti a zero)", () => {
    const acts = [act("2026-10-01", [[C("eleonora"), 10]])];
    expect(weekRows(teams, acts, teamOf, "ultima", today).every((r) => r.pts === 0)).toBe(true);
  });
});

describe("power ranking", () => {
  const acts = [
    act("2026-10-13", [[C("mariano-iv"), 100]]), // oltre i 30 giorni: escluso
    act("2026-10-20", [[C("eleonora"), 10]]), // giorni 8–30
    act("2026-11-10", [[C("shardana"), 6]]), // ultimi 7 giorni
    act("2026-11-11", [[C("eleonora"), 1]]), // ultimi 7 giorni
  ];
  const official = standings(teams, acts, teamOf, "ultima");
  const pr = powerRows(teams, acts, teamOf, official, today);
  const get = (id: string) => pr.find((r) => r.team.id === id)!;

  it("forma = 2 × punti ultimi 7 giorni + punti dall'8° al 30° giorno", () => {
    expect(get("eleonora").sc).toBe(2 * 1 + 10);
    expect(get("eleonora").w).toBe(1);
    expect(get("eleonora").m).toBe(10);
    expect(get("shardana").sc).toBe(12);
    expect(get("mariano-iv").sc).toBe(0);
  });

  it("parità di forma = stessa posizione; resta separato dalla classifica ufficiale", () => {
    expect(get("eleonora").pos).toBe(1);
    expect(get("shardana").pos).toBe(1);
    expect(get("mariano-iv").off).toBe(1); // in classifica ufficiale è prima
    expect(get("mariano-iv").pos).toBe(3);
  });

  it("rangePts usa intervalli [da, a)", () => {
    expect(rangePts(T.eleonora, acts, teamOf, "2026-10-20", "2026-11-11")).toBe(10);
    expect(rangePts(T.eleonora, acts, teamOf, "2026-10-20")).toBe(11);
  });
});
