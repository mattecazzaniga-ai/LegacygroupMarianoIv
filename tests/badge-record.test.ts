import { describe, expect, it } from "vitest";
import { BADGES } from "@/lib/calc/badges";
import { challengeWinners } from "@/lib/calc/records";
import { buildModel } from "@/lib/calc/model";
import { act, C, T, teams } from "./helpers";

const today = "2026-11-13";
const model = (acts: ReturnType<typeof act>[]) => buildModel({ teams, acts, tiebreak: "ultima", today });
const badgeIds = (m: ReturnType<typeof model>, id: string) => m.badgesOf(T[id]).map((b) => b.id);

describe("badge", () => {
  it("sono 8 e nessuno è assegnato a zero punti", () => {
    expect(BADGES).toHaveLength(8);
    const m = model([]);
    teams.forEach((t) => expect(m.badgesOf(t)).toEqual([]));
  });

  it("Leader: solo chi è primo (anche a pari merito)", () => {
    const m = model([act("2026-11-01", [[C("eleonora"), 5], [C("shardana"), 5], [C("mamuthones"), 1]])]);
    expect(badgeIds(m, "eleonora")).toContain("leader");
    expect(badgeIds(m, "shardana")).toContain("leader");
    expect(badgeIds(m, "mamuthones")).not.toContain("leader");
  });

  it("In fiamme, Costanza, Dominatore, Colpo grosso, Rimonta", () => {
    const m = model([
      act("2026-10-01", [[C("eleonora"), 15], [C("shardana"), 1]]),
      act("2026-10-08", [[C("eleonora"), 5], [C("shardana"), 1]]),
      act("2026-10-15", [[C("eleonora"), 5], [C("shardana"), 1]]),
      act("2026-10-22", [[C("eleonora"), 1], [C("mamuthones"), 30]]),
    ]);
    expect(badgeIds(m, "eleonora")).toEqual(expect.arrayContaining(["fiamme", "costanza", "dominatore", "colpo"]));
    expect(badgeIds(m, "shardana")).not.toContain("fiamme"); // nulla nell'ultima
    expect(badgeIds(m, "mamuthones")).toEqual(expect.arrayContaining(["rimonta", "colpo", "leader"])); // da 3° a 1°
    expect(badgeIds(m, "mamuthones")).not.toContain("costanza");
  });

  it("Squadra del momento: più punti negli ultimi 7 giorni", () => {
    const m = model([act("2026-10-01", [[C("eleonora"), 50]]), act("2026-11-12", [[C("shardana"), 2]])]);
    expect(badgeIds(m, "shardana")).toContain("momento");
    expect(badgeIds(m, "eleonora")).not.toContain("momento");
  });

  it("Squadra al completo: tutte le classi con almeno un punto", () => {
    const all = T.eleonora.classes.map((c): [string, number] => [c, 1]);
    const m = model([act("2026-11-01", all)]);
    expect(badgeIds(m, "eleonora")).toContain("completa");
    const m2 = model([act("2026-11-01", all.slice(1))]);
    expect(badgeIds(m2, "eleonora")).not.toContain("completa");
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
    expect(rec("classe-attivita")).toMatchObject({ v: 20, n: C("shardana") });
    expect(rec("classe-top")).toMatchObject({ v: 24, n: C("shardana") });
    expect(rec("classe-individuali")).toMatchObject({ v: 3, n: C("eleonora", 1) });
    expect(rec("vittorie")).toMatchObject({ v: 2, n: "Eleonora d'Arborea" }); // vince la prima e la terza
    expect(rec("media")).toMatchObject({ v: 12, n: "Shardana" }); // 24 / 2
    expect(rec("settimana")).toMatchObject({ v: 24, n: "Shardana" }); // settimana del 5 ottobre
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
  it("per ogni attività: squadra e classe con più punti, pari merito inclusi, dalla più recente", () => {
    const m = buildModel({
      teams,
      tiebreak: "ultima",
      today,
      acts: [
        act("2026-10-01", [[C("eleonora", 0), 6], [C("eleonora", 1), 5], [C("shardana"), 10]], "Torneo di calcetto"),
        act("2026-10-08", [[C("mamuthones"), 7], [C("giganti"), 7]], "Quizzone"),
      ],
    });
    const w = challengeWinners(m.teams, m.hist);
    expect(w.map((x) => x.act.title)).toEqual(["Quizzone", "Torneo di calcetto"]);
    expect(w[1].teams.map((t) => t.id)).toEqual(["eleonora"]); // 11 > 10
    expect(w[1].pts).toBe(11);
    expect(w[1].classes).toEqual([C("shardana")]); // la classe migliore può essere di un'altra squadra
    expect(w[0].teams.map((t) => t.id).sort()).toEqual(["giganti", "mamuthones"]);
  });
});
