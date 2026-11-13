import { describe, expect, it } from "vitest";
import { BADGES } from "@/lib/calc/badges";
import { challengeWinners } from "@/lib/calc/records";
import { buildModel } from "@/lib/calc/model";
import { act, C, T, teams } from "./helpers";

const today = "2026-11-13";
const model = (acts: ReturnType<typeof act>[]) => buildModel({ teams, acts, tiebreak: "ultima", today });
const badgeIds = (m: ReturnType<typeof model>, id: string) => m.badgesOf(T[id]).map((b) => b.id);

describe("riconoscimenti", () => {
  const win = (a: ReturnType<typeof act>, id: string) => ((a.winner = id), a);

  it("sono 5 e nessuno è assegnato a zero punti", () => {
    expect(BADGES.map((b) => b.id)).toEqual(["leader", "rimonta", "costanza", "dominatore", "momento"]);
    const m = model([]);
    teams.forEach((t) => expect(m.badgesOf(t)).toEqual([]));
  });

  it("Leader: solo chi è primo (anche a pari merito)", () => {
    const m = model([act("2026-11-01", [[C("eleonora"), 5], [C("shardana"), 5], [C("mamuthones"), 1]])]);
    expect(badgeIds(m, "eleonora")).toContain("leader");
    expect(badgeIds(m, "shardana")).toContain("leader");
    expect(badgeIds(m, "mamuthones")).not.toContain("leader");
  });

  it("Rimonta: chi guadagna più posizioni rispetto a prima dell'ultima giornata", () => {
    const m = model([
      act("2026-10-01", [[C("eleonora"), 10], [C("shardana"), 5], [C("giganti"), 1]]),
      act("2026-10-08", [[C("giganti"), 30]]),
    ]);
    expect(badgeIds(m, "giganti")).toContain("rimonta"); // 3° → 1°
    expect(badgeIds(m, "eleonora")).not.toContain("rimonta");
    expect(badgeIds(model([act("2026-10-01", [[C("giganti"), 3]])]), "giganti")).not.toContain("rimonta"); // una sola giornata
  });

  it("Costanza: punti nel maggior numero di attività, almeno 3; nessuno se sono tutte uguali", () => {
    const acts = [
      act("2026-10-01", [[C("eleonora"), 1], [C("shardana"), 50]]),
      act("2026-10-08", [[C("eleonora"), 1]]),
      act("2026-10-15", [[C("eleonora"), 1], [C("shardana"), 40]]),
    ];
    expect(badgeIds(model(acts), "eleonora")).toContain("costanza"); // pochi punti ma sempre
    expect(badgeIds(model(acts), "shardana")).not.toContain("costanza");
    expect(badgeIds(model(acts.slice(0, 2)), "eleonora")).not.toContain("costanza");
  });

  it("Dominatore: più sfide vinte (vincitore indicato), almeno 2 e senza pari merito; i punti non contano", () => {
    const base = [
      win(act("2026-10-01", [[C("shardana"), 50]]), "eleonora"),
      win(act("2026-10-08", [[C("shardana"), 50]]), "eleonora"),
      win(act("2026-10-15", [[C("shardana"), 50]]), "shardana"),
      act("2026-10-20", [[C("mamuthones"), 99]]), // senza vincitore: non conta
    ];
    expect(badgeIds(model(base), "eleonora")).toContain("dominatore");
    expect(badgeIds(model(base), "mamuthones")).not.toContain("dominatore");
    expect(badgeIds(model(base.slice(0, 1)), "eleonora")).not.toContain("dominatore"); // una sola vittoria
    const pari = [...base.slice(0, 3), win(act("2026-10-22", []), "shardana")];
    expect(badgeIds(model(pari), "eleonora")).not.toContain("dominatore");
  });

  it("Squadra del momento: più punti negli ultimi 7 giorni", () => {
    const m = model([act("2026-10-01", [[C("eleonora"), 50]]), act("2026-11-12", [[C("shardana"), 2]])]);
    expect(badgeIds(m, "shardana")).toContain("momento");
    expect(badgeIds(m, "eleonora")).not.toContain("momento");
  });
});

describe("record (Hall of Fame)", () => {
  const acts = [
    act("2026-10-05", [[C("eleonora"), 10], [C("eleonora", 1), 3, "individuale"], [C("shardana"), 4]], "Calcetto"),
    act("2026-10-07", [[C("shardana"), 20]], "Quiz"),
    act("2026-10-20", [[C("eleonora"), 6], [C("mamuthones"), 2]], "Corsa"),
  ];
  const m = model(acts);
  const rec = (id: string) => m.records.find((r) => r.id === id)!;

  it("nessun record senza attività", () => {
    expect(model([]).records).toEqual([]);
  });

  it("calcola i primati dai punti", () => {
    expect(rec("squadra-attivita")).toMatchObject({ v: 20, n: "Shardana" });
    expect(rec("classe-top")).toMatchObject({ v: 24, n: C("shardana") });
    expect(rec("vittorie")).toBeUndefined(); // nessuna sfida con vincitore indicato
    expect(m.records.map((r) => r.id)).not.toContain("settimana");
    expect(rec("vantaggio")).toMatchObject({ v: 11, n: "Shardana" }); // 24 − 13 dopo la seconda
  });

  it("non mostra mai nomi: solo squadre e classi", () => {
    const names = new Set([...teams.map((t) => t.name), ...teams.flatMap((t) => t.classes)]);
    m.records.forEach((r) => expect(names.has(r.n)).toBe(true));
  });
});

describe("Legacy Moment", () => {
  it("rileva partenza, sorpasso e traguardi", () => {
    const m = model([
      act("2026-10-01", [[C("eleonora"), 10]], "Prima"),
      act("2026-10-02", [[C("shardana"), 60]], "Seconda"),
    ]);
    const titles = m.moments.map((x) => x.t);
    expect(titles).toContain("Si parte!");
    expect(titles).toContain("Nuovo leader");
    expect(titles).toContain("Cambio al vertice");
    expect(titles).toContain("Shardana a quota 50");
    expect(m.moments[0].d).toBe("2026-10-02"); // dal più recente
  });
});

describe("vincitori delle sfide", () => {
  it("solo le sfide con una vincitrice indicata, dalla più recente, con la classe migliore", () => {
    const a1 = act("2026-10-01", [[C("eleonora", 0), 6], [C("eleonora", 1), 5], [C("shardana"), 10]], "Torneo di calcetto");
    a1.winner = "eleonora";
    const a2 = act("2026-10-08", [[C("mamuthones"), 7], [C("giganti"), 7]], "Raccolta solidale"); // nessun vincitore
    const m = buildModel({ teams, tiebreak: "ultima", today, acts: [a1, a2] });
    const w = challengeWinners(m.teams, m.hist);
    expect(w.map((x) => x.act.title)).toEqual(["Torneo di calcetto"]);
    expect(w[0].pts).toBe(11);
    expect(w[0].classes).toEqual([C("shardana")]); // la classe migliore può essere di un'altra squadra
  });
});

describe("vincitore scelto dagli organizzatori", () => {
  it("prevale sui punti e conta per record e badge, anche senza punti", () => {
    const a1 = act("2026-10-01", [[C("shardana"), 10], [C("eleonora"), 2]], "Torneo");
    a1.winner = "eleonora";
    const a2 = act("2026-10-05", [], "Gara di solidarietà");
    a2.winner = "eleonora";
    const a3 = act("2026-10-09", [[C("eleonora"), 1]], "Quiz");
    const m = buildModel({ teams, acts: [a1, a2, a3], tiebreak: "ultima", today });
    const w = challengeWinners(m.teams, m.hist);
    expect(w.map((x) => [x.act.title, x.teams[0].id])).toEqual([
      ["Gara di solidarietà", "eleonora"],
      ["Torneo", "eleonora"],
    ]);
    expect(w[0].pts).toBe(0);
    expect(m.records.find((r) => r.id === "vittorie")).toMatchObject({ v: 2, n: "Eleonora d'Arborea" });
    expect(m.badgesOf(T.eleonora).map((b) => b.id)).toContain("dominatore");
    // la classifica resta fatta solo di punti
    expect(m.now.find((r) => r.team.id === "shardana")!.pts).toBe(10);
  });
});
