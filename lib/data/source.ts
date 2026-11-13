import "server-only";
import { cache } from "react";
import type { Dataset } from "../types";
import { buildDataset, emptyDataset, SheetFormatError, type RawSheets } from "./parse";

export const REVALIDATE_SECONDS = 60;

const URLS = {
  attivita: process.env.SHEET_ATTIVITA_CSV,
  punti: process.env.SHEET_PUNTI_CSV,
  classi: process.env.SHEET_CLASSI_CSV,
};

export const isConfigured = () => useFixtures() || !!(URLS.attivita && URLS.punti && URLS.classi);

const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

async function fetchCsv(name: string, url: string, fresh: boolean): Promise<string> {
  const u = new URL(url);
  if (u.protocol !== "https:" || u.hostname !== "docs.google.com")
    throw new Error(`L'indirizzo del foglio ${name} deve iniziare con https://docs.google.com/`);
  const res = await fetch(u, fresh ? { cache: "no-store" } : { next: { revalidate: REVALIDATE_SECONDS, tags: ["foglio"] } });
  if (!res.ok) throw new Error(`Il foglio ${name} risponde con errore ${res.status}. È pubblicato sul web come CSV?`);
  const text = await res.text();
  if (/^\s*<(!doctype|html)/i.test(text))
    throw new Error(`Il foglio ${name} restituisce una pagina web invece del CSV: controlla che sia pubblicato (File → Condividi → Pubblica sul web → CSV).`);
  return text;
}

/**
 * Solo in locale, per provare il sito con i dati di /fixtures:
 * LEGACY_FIXTURES=1 npm run build. Su Vercel è sempre disattivato.
 */
const useFixtures = () => process.env.LEGACY_FIXTURES === "1" && !process.env.VERCEL;

async function loadFixtures(): Promise<RawSheets> {
  const { readFile } = await import("node:fs/promises");
  const p = (f: string) => readFile(`${process.cwd()}/fixtures/${f}`, "utf8");
  const [attivita, punti, classi] = await Promise.all([p("attivita.csv"), p("punti.csv"), p("classi.csv")]);
  return { attivita, punti, classi };
}

async function loadRaw(fresh: boolean): Promise<RawSheets> {
  if (useFixtures()) return loadFixtures();
  const [attivita, punti, classi] = await Promise.all([
    fetchCsv("Attivita", URLS.attivita!, fresh),
    fetchCsv("Punti", URLS.punti!, fresh),
    fetchCsv("Classi", URLS.classi!, fresh),
  ]);
  return { attivita, punti, classi };
}

/** Ultima versione valida letta da questa istanza del server. */
let lastGood: Dataset | null = null;

/**
 * Dati per le pagine pubbliche.
 * Se il foglio non risponde: si usa l'ultima versione valida; se non esiste,
 * durante la build si parte da zero, altrimenti si lancia l'errore e Next.js
 * continua a servire l'ultima pagina valida in cache (nessuna pagina rotta).
 */
export const getDataset = cache(async (): Promise<Dataset> => {
  if (!isConfigured())
    return emptyDataset({ level: "attenzione", sheet: "Generale", message: "Il foglio non è ancora collegato: il sito mostra tutto a zero." });
  try {
    const ds = buildDataset(await loadRaw(false));
    lastGood = ds;
    return ds;
  } catch (e) {
    console.error("[legacy] lettura del foglio non riuscita:", e);
    if (lastGood) return lastGood;
    if (isBuildPhase())
      return emptyDataset({ level: "errore", sheet: "Generale", message: "Il foglio non era raggiungibile durante la pubblicazione: riprovo a ogni aggiornamento." });
    throw e;
  }
});

export interface CheckResult {
  configured: boolean;
  ok: boolean;
  error?: string;
  dataset?: Dataset;
}

/** Lettura "fresca" per la pagina /controllo, senza cache. */
export async function checkSheet(): Promise<CheckResult> {
  if (!isConfigured()) return { configured: false, ok: false };
  try {
    return { configured: true, ok: true, dataset: buildDataset(await loadRaw(true)) };
  } catch (e) {
    const msg = e instanceof SheetFormatError || e instanceof Error ? e.message : String(e);
    return { configured: true, ok: false, error: msg };
  }
}
