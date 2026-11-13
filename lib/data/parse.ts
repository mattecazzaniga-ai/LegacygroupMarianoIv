/**
 * Validazione dei tre fogli. Regola d'oro: una riga sbagliata NON viene
 * indovinata né corretta, viene esclusa dal calcolo e segnalata in /controllo.
 */
import { isValidDate } from "../dates";
import { TEAMS } from "../teams";
import type { Activity, Award, CalEvent, Dataset, Issue, Kind, Team } from "../types";
import { normKey, toTable } from "./csv";

export const REQUIRED = {
  Attivita: ["id", "data", "titolo", "tipo", "descrizione", "stato", "data_fine"],
  Punti: ["id_attivita", "classe", "punti", "tipo"],
  Classi: ["classe", "squadra"],
} as const;

export class SheetFormatError extends Error {}

export interface RawSheets {
  attivita: string;
  punti: string;
  classi: string;
}

const CLASS_RE = /^[1-5][A-Z]{1,2}$/;

/** Accetta AAAA-MM-GG oppure GG/MM/AAAA (formato italiano). Restituisce AAAA-MM-GG o null. */
export function normDate(s: string): string | null {
  const t = s.trim();
  const it = t.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  const iso = it ? `${it[3]}-${it[2].padStart(2, "0")}-${it[1].padStart(2, "0")}` : t;
  return isValidDate(iso) ? iso : null;
}

function parseKind(s: string): Kind | null {
  const k = normKey(s);
  if (["collettiva", "collettivo", "coll"].includes(k)) return "collettiva";
  if (["individuale", "individuali", "ind"].includes(k)) return "individuale";
  return null;
}

function parseClasses(text: string, issues: Issue[]): Team[] {
  const t = toTable(text, [...REQUIRED.Classi]);
  if (t.missing.length) throw new SheetFormatError(`Foglio "Classi": mancano le colonne ${t.missing.join(", ")}`);
  const err = (row: number, message: string, level: Issue["level"] = "errore") => issues.push({ level, sheet: "Classi", row, message });
  const byKey = new Map<string, Team>();
  TEAMS.forEach((tm) => {
    byKey.set(normKey(tm.id), tm);
    byKey.set(normKey(tm.name), tm);
  });
  const assigned: Record<string, string[]> = Object.fromEntries(TEAMS.map((tm) => [tm.id, []]));
  const seen = new Map<string, number>();
  for (const { line, v } of t.rows) {
    const cls = v.classe.toUpperCase().replace(/\s+/g, "");
    if (!cls) {
      err(line, "Manca la sigla della classe.");
      continue;
    }
    if (!CLASS_RE.test(cls)) err(line, `La sigla "${v.classe}" non ha il formato atteso (es. 3A, 4BS). Controlla che sia giusta.`, "attenzione");
    if (seen.has(cls)) {
      err(line, `La classe ${cls} compare due volte (già alla riga ${seen.get(cls)}). Questa riga è ignorata.`);
      continue;
    }
    const team = byKey.get(normKey(v.squadra));
    if (!team) {
      err(line, `Squadra "${v.squadra}" sconosciuta per la classe ${cls}. Usa uno di: ${TEAMS.map((x) => x.name).join(", ")}.`);
      continue;
    }
    seen.set(cls, line);
    assigned[team.id].push(cls);
  }
  if (seen.size === 0) {
    issues.push({ level: "attenzione", sheet: "Classi", message: "Il foglio Classi è vuoto: uso l'elenco di partenza delle 43 classi." });
    return TEAMS.map((tm) => ({ ...tm, classes: [...tm.classes] }));
  }
  const teams = TEAMS.map((tm) => ({ ...tm, classes: assigned[tm.id] }));
  // differenze rispetto all'elenco di partenza (solo avvisi)
  const def = new Map(TEAMS.flatMap((tm) => tm.classes.map((c) => [c, tm.name] as const)));
  const now = new Map(teams.flatMap((tm) => tm.classes.map((c) => [c, tm.name] as const)));
  def.forEach((tn, c) => {
    if (!now.has(c)) issues.push({ level: "attenzione", sheet: "Classi", message: `La classe ${c} (${tn}) non è nel foglio: non può ricevere punti.` });
    else if (now.get(c) !== tn) issues.push({ level: "attenzione", sheet: "Classi", message: `La classe ${c} è nei ${now.get(c)}, nell'elenco di partenza era nei ${tn}.` });
  });
  now.forEach((tn, c) => {
    if (!def.has(c)) issues.push({ level: "attenzione", sheet: "Classi", message: `La classe ${c} (${tn}) è nuova rispetto all'elenco di partenza.` });
  });
  return teams;
}

function parseActivities(text: string, issues: Issue[]): CalEvent[] {
  const t = toTable(text, [...REQUIRED.Attivita]);
  if (t.missing.length) throw new SheetFormatError(`Foglio "Attivita": mancano le colonne ${t.missing.join(", ")}`);
  const err = (row: number, message: string, level: Issue["level"] = "errore") => issues.push({ level, sheet: "Attivita", row, message });
  const out: CalEvent[] = [];
  const seen = new Map<string, number>();
  for (const { line, v } of t.rows) {
    const id = v.id;
    if (!id) {
      err(line, "Manca l'id dell'attività. Riga ignorata.");
      continue;
    }
    if (seen.has(id)) {
      err(line, `L'id "${id}" è già usato alla riga ${seen.get(id)}. Ogni attività deve avere un id diverso. Riga ignorata.`);
      continue;
    }
    seen.set(id, line);
    const date = normDate(v.data);
    if (!date) {
      err(line, `Data "${v.data}" non valida per "${id}". Scrivi la data come 12/12/2026 oppure 2026-12-12. Riga ignorata.`);
      continue;
    }
    if (!v.titolo) {
      err(line, `Manca il titolo dell'attività "${id}". Riga ignorata.`);
      continue;
    }
    const st = normKey(v.stato);
    if (st !== "" && st !== "auto" && st !== "annullata") {
      err(line, `Stato "${v.stato}" non valido per "${id}": lascia vuoto, scrivi "auto" oppure "annullata". Riga ignorata.`);
      continue;
    }
    let end: string | undefined;
    if (v.data_fine) {
      const fine = normDate(v.data_fine);
      if (!fine) {
        err(line, `Data di fine "${v.data_fine}" non valida per "${id}" (es. 13/12/2026). Riga ignorata.`);
        continue;
      }
      if (fine < date) {
        err(line, `La data di fine di "${id}" è prima della data di inizio. Riga ignorata.`);
        continue;
      }
      end = fine;
    }
    out.push({ id, date, end, title: v.titolo, type: v.tipo, desc: v.descrizione, status: st === "annullata" ? "annullata" : "auto" });
  }
  return out;
}

function parsePoints(text: string, events: CalEvent[], teams: Team[], issues: Issue[]): Map<string, Award[]> {
  const t = toTable(text, [...REQUIRED.Punti]);
  if (t.missing.length) throw new SheetFormatError(`Foglio "Punti": mancano le colonne ${t.missing.join(", ")}`);
  const err = (row: number, message: string, level: Issue["level"] = "errore") => issues.push({ level, sheet: "Punti", row, message });
  const evById = new Map(events.map((e) => [e.id, e]));
  const classes = new Set(teams.flatMap((tm) => tm.classes));
  const out = new Map<string, Award[]>();
  const dup = new Map<string, number>();
  for (const { line, v } of t.rows) {
    const ev = evById.get(v.id_attivita);
    if (!v.id_attivita) {
      err(line, "Manca id_attivita. Riga ignorata.");
      continue;
    }
    if (!ev) {
      err(line, `L'attività "${v.id_attivita}" non esiste nel foglio Attivita (o la sua riga ha un errore). Riga ignorata.`);
      continue;
    }
    if (ev.status === "annullata") {
      err(line, `L'attività "${ev.id}" è annullata: i suoi punti non vengono contati. Togli la riga o cambia lo stato.`);
      continue;
    }
    const cls = v.classe.toUpperCase().replace(/\s+/g, "");
    if (!classes.has(cls)) {
      err(line, `La classe "${v.classe}" non esiste nel foglio Classi. Riga ignorata.`);
      continue;
    }
    const raw = v.punti.replace(/\s+/g, "");
    if (!/^[+-]?\d+$/.test(raw)) {
      err(line, `Punti "${v.punti}" non validi: serve un numero intero (es. 10). Riga ignorata.`);
      continue;
    }
    const pts = Number(raw);
    const kind = parseKind(v.tipo);
    if (!kind) {
      err(line, `Tipo "${v.tipo}" non valido: scrivi "collettiva" oppure "individuale". Riga ignorata.`);
      continue;
    }
    if (pts === 0) err(line, `Assegnazione da 0 punti alla ${cls}: non cambia nulla, controlla se manca il valore.`, "attenzione");
    if (pts < 0) err(line, `Punti negativi (${pts}) alla ${cls}: vengono sottratti. Va bene solo se è una penalità.`, "attenzione");
    if (kind === "collettiva") {
      const key = `${ev.id}|${cls}|collettiva`;
      if (dup.has(key))
        err(line, `La ${cls} ha già punti collettivi per "${ev.id}" alla riga ${dup.get(key)}: vengono contati entrambi. Se è un doppione, cancellane uno.`, "attenzione");
      else dup.set(key, line);
    }
    if (!out.has(ev.id)) out.set(ev.id, []);
    out.get(ev.id)!.push({ cls, pts, kind });
  }
  return out;
}

/** Valida i tre CSV e costruisce il dataset. Lancia SheetFormatError se mancano colonne. */
export function buildDataset(raw: RawSheets, fetchedAt = new Date().toISOString()): Dataset {
  const issues: Issue[] = [];
  const teams = parseClasses(raw.classi, issues);
  const events = parseActivities(raw.attivita, issues);
  const awards = parsePoints(raw.punti, events, teams, issues);
  const activities: Activity[] = events
    .filter((e) => awards.has(e.id))
    .map((e) => ({ id: e.id, date: e.date, title: e.title, type: e.type, desc: e.desc, awards: awards.get(e.id)! }))
    .sort((a, b) => a.date.localeCompare(b.date)); // sort stabile: a parità di data resta l'ordine del foglio
  return { teams, activities, events, issues, source: "foglio", fetchedAt };
}

export function emptyDataset(reason: Issue): Dataset {
  return {
    teams: TEAMS.map((t) => ({ ...t, classes: [...t.classes] })),
    activities: [],
    events: [],
    issues: [reason],
    source: "non-configurato",
    fetchedAt: new Date().toISOString(),
  };
}
