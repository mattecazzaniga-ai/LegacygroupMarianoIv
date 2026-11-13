import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calEvents, statusOf } from "@/lib/calc/calendar";
import { sum } from "@/lib/calc/core";
import { buildModel } from "@/lib/calc/model";
import { parseCsv } from "@/lib/data/csv";
import { buildDataset, SheetFormatError } from "@/lib/data/parse";

const CLASSI = readFileSync("fixtures/classi.csv", "utf8");
const ATT_H = "id,data,titolo,tipo,descrizione,stato,data_fine\n";
const PT_H = "id_attivita,classe,punti,tipo\n";

const ds = (att: string, pt: string, cl = CLASSI) => buildDataset({ attivita: ATT_H + att, punti: PT_H + pt, classi: cl });

describe("parser CSV", () => {
  it("gestisce virgolette, virgole e a capo nei campi, CRLF e BOM", () => {
    const rows = parseCsv('﻿a,b\r\n"x, y","riga1\nriga2"\r\n"con ""virgolette""",z');
    expect(rows).toEqual([
      ["a", "b"],
      ["x, y", "riga1\nriga2"],
      ['con "virgolette"', "z"],
    ]);
  });
});

describe("validazione del foglio", () => {
  it("righe valide: le classi danno la squadra, l'attività ha i suoi punti", () => {
    const d = ds("a1,2026-10-01,Calcetto,Sport,,auto,\n", "a1,3a,10,collettiva\na1,2E,3,Individuale\n");
    expect(d.issues.filter((i) => i.level === "errore")).toEqual([]);
    expect(d.activities).toHaveLength(1);
    expect(d.activities[0].awards).toEqual([
      { cls: "3A", pts: 10, kind: "collettiva" },
      { cls: "2E", pts: 3, kind: "individuale" },
    ]);
  });

  it("classe inesistente: riga esclusa e segnalata con il numero di riga", () => {
    const d = ds("a1,2026-10-01,X,,,,\n", "a1,3A,10,collettiva\na1,9Z,5,collettiva\n");
    expect(d.activities[0].awards).toHaveLength(1);
    expect(d.issues).toContainEqual(expect.objectContaining({ level: "errore", sheet: "Punti", row: 3 }));
  });

  it("punti non numerici o decimali: riga esclusa", () => {
    const d = ds("a1,2026-10-01,X,,,,\n", "a1,3A,dieci,collettiva\na1,3A,2.5,collettiva\na1,3A,4,collettiva\n");
    expect(d.activities[0].awards.map((w) => w.pts)).toEqual([4]);
    expect(d.issues.filter((i) => i.sheet === "Punti" && i.level === "errore").map((i) => i.row)).toEqual([2, 3]);
  });

  it("id attività duplicato: vale la prima riga, la seconda è segnalata", () => {
    const d = ds("a1,2026-10-01,Primo,,,,\na1,2026-10-02,Doppione,,,,\n", "a1,3A,1,collettiva\n");
    expect(d.events.map((e) => e.title)).toEqual(["Primo"]);
    expect(d.issues).toContainEqual(expect.objectContaining({ level: "errore", sheet: "Attivita", row: 3 }));
  });

  it("data, stato e tipo non validi; punti su attività inesistente o annullata", () => {
    const d = ds(
      "a1,32/10/2026,X,,,,\na2,2026-10-01,Y,,,boh,\na3,2026-10-01,Z,,,annullata,\na4,2026-10-05,W,,,,2026-10-01\n",
      "a3,3A,5,collettiva\nzz,3A,5,collettiva\na3,3A,5,squadra\n",
    );
    expect(d.events).toHaveLength(1); // solo a3 (annullata ma valida)
    expect(d.activities).toHaveLength(0);
    expect(d.issues.filter((i) => i.level === "errore")).toHaveLength(6); // 3 nel foglio Attivita, 3 nel foglio Punti
  });

  it("date: accetta 12/10/2026 e 2026-10-12, rifiuta 31/02/2026", () => {
    const d = ds("a1,12/10/2026,X,,,,13/10/2026\na2,2026-10-12,Y,,,,\na3,31/02/2026,Z,,,,\n", "");
    expect(d.events.map((e) => [e.date, e.end])).toEqual([
      ["2026-10-12", "2026-10-13"],
      ["2026-10-12", undefined],
    ]);
    expect(d.issues).toContainEqual(expect.objectContaining({ level: "errore", row: 4 }));
  });

  it("doppia assegnazione collettiva: contata (come nel foglio) ma segnalata", () => {
    const d = ds("a1,2026-10-01,X,,,,\n", "a1,3A,5,collettiva\na1,3A,5,collettiva\n");
    expect(sum(d.activities[0].awards.map((w) => w.pts))).toBe(10);
    expect(d.issues).toContainEqual(expect.objectContaining({ level: "attenzione", row: 3 }));
  });

  it("colonne mancanti: errore di formato (il sito tiene l'ultima versione valida)", () => {
    expect(() => buildDataset({ attivita: "id,data\n", punti: PT_H, classi: CLASSI })).toThrow(SheetFormatError);
  });

  it("foglio Classi: squadra per nome o id, classi doppie e sconosciute segnalate", () => {
    const d = ds("", "", "classe,squadra\n3A,janas\n3A,Shardana\n4B,Squadra X\n5A,GIGANTI DI MONTEPRAMA\n");
    expect(d.teams.find((t) => t.id === "eleonora")!.classes).toEqual(["3A"]);
    expect(d.teams.find((t) => t.id === "giganti")!.classes).toEqual(["5A"]);
    expect(d.issues.filter((i) => i.sheet === "Classi" && i.level === "errore").map((i) => i.row)).toEqual([3, 4]);
  });

  it("foglio Classi vuoto: uso le 43 classi di partenza", () => {
    const d = ds("", "", "classe,squadra\n");
    expect(d.teams.flatMap((t) => t.classes)).toHaveLength(43);
  });
});

describe("i numeri tornano con il foglio (dati di prova)", () => {
  const d = buildDataset({
    attivita: readFileSync("fixtures/attivita.csv", "utf8"),
    punti: readFileSync("fixtures/punti.csv", "utf8"),
    classi: CLASSI,
  });
  const m = buildModel({ teams: d.teams, acts: d.activities, tiebreak: "ultima", today: "2026-11-13" });

  it("somma dei punti di squadra = somma delle righe valide del foglio Punti", () => {
    const sheetRows = parseCsv(readFileSync("fixtures/punti.csv", "utf8")).slice(1);
    const invalid = d.issues.filter((i) => i.sheet === "Punti" && i.level === "errore").length;
    expect(invalid).toBe(2);
    const valid = sheetRows.filter((r) => /^\d+$/.test(r[2]) && r[1] !== "9Z");
    expect(sum(m.now.map((r) => r.pts))).toBe(sum(valid.map((r) => Number(r[2]))));
  });

  it("le 43 classi sono tutte assegnate, una sola volta", () => {
    const all = d.teams.flatMap((t) => t.classes);
    expect(all).toHaveLength(43);
    expect(new Set(all).size).toBe(43);
  });

  it("calendario: stati programmata / in corso / conclusa / annullata", () => {
    const ev = calEvents(d.events, d.activities);
    const st = (id: string, today = "2026-11-13") => statusOf(ev.find((e) => e.id === id)!, today);
    expect(st("a1")).toBe("conclusa");
    expect(st("a8")).toBe("programmata");
    expect(st("a9")).toBe("annullata");
    expect(st("a10", "2026-12-13")).toBe("corso");
    expect(st("a8", "2026-11-25")).toBe("conclusa"); // passata senza punti: "punti in aggiornamento"
  });
});

describe("colonna vincitore (facoltativa)", () => {
  it("accetta nome o id della squadra; un'attività senza punti ma con vincitore entra nell'albo", () => {
    const d = buildDataset({
      attivita: "id,data,titolo,tipo,descrizione,stato,data_fine,vincitore\na1,2026-10-01,Gara,,,,,Mariano IV\na2,2026-10-02,Quiz,,,,,boh\n",
      punti: PT_H + "a2,3A,5,collettiva\n",
      classi: CLASSI,
    });
    expect(d.activities.map((a) => [a.id, a.winner ?? null, a.awards.length])).toEqual([
      ["a1", "mariano-iv", 0],
      ["a2", null, 1],
    ]);
    expect(d.issues).toContainEqual(expect.objectContaining({ level: "attenzione", row: 3 }));
  });
});
