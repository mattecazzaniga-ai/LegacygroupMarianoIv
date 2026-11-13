import { describe, expect, it } from "vitest";
import { buildDatasetFromTables } from "@/lib/data/parse";
import { rowsToTables } from "@/lib/data/supabase";
import { TEAMS } from "@/lib/teams";

const classi = TEAMS.flatMap((t) => t.classes.map((classe) => ({ classe, squadra: t.id })));
const att = (id: number, data: string, extra: Partial<{ annullata: boolean; data_fine: string | null }> = {}) => ({
  id, data, data_fine: null, titolo: "Attività " + id, tipo: "Sport", descrizione: "", annullata: false, pubblicata: true, ...extra,
});

describe("Supabase → stessi calcoli del foglio", () => {
  it("converte le righe del database e calcola i punti", () => {
    const ds = buildDatasetFromTables(
      rowsToTables(classi, [att(1, "2026-12-12"), att(2, "2026-12-20", { data_fine: "2026-12-21" })], [
        { id: 1, attivita_id: 1, classe: "3A", punti: 10, tipo: "collettiva" },
        { id: 2, attivita_id: 1, classe: "1A", punti: 4, tipo: "individuale" },
      ]),
    );
    expect(ds.issues.filter((i) => i.level === "errore")).toEqual([]);
    expect(ds.teams.find((t) => t.id === "mariano-iv")!.classes).toContain("3A");
    expect(ds.activities).toHaveLength(1);
    expect(ds.activities[0].awards).toEqual([
      { cls: "3A", pts: 10, kind: "collettiva" },
      { cls: "1A", pts: 4, kind: "individuale" },
    ]);
    expect(ds.events.find((e) => e.id === "2")!.end).toBe("2026-12-21");
  });

  it("i punti di un'attività annullata non contano", () => {
    const ds = buildDatasetFromTables(
      rowsToTables(classi, [att(1, "2026-12-12", { annullata: true })], [{ id: 1, attivita_id: 1, classe: "3A", punti: 10, tipo: "collettiva" }]),
    );
    expect(ds.activities).toHaveLength(0);
    expect(ds.events[0].status).toBe("annullata");
  });
});
