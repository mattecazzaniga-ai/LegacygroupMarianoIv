/**
 * Lettura pubblica da Supabase (chiave "anon": vede solo le attività pubblicate, grazie alle regole RLS).
 * Le righe vengono passate alla stessa validazione usata per il foglio Google.
 */
import { TEAMS } from "../teams";
import type { Table } from "./csv";
import type { Tables } from "./parse";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Tag di cache: l'area admin lo invalida a ogni salvataggio, così il sito si aggiorna subito. */
export const DATA_TAG = "dati";

export interface DbClasse {
  classe: string;
  squadra: string;
}
export interface DbAttivita {
  id: number;
  data: string;
  data_fine: string | null;
  titolo: string;
  tipo: string;
  descrizione: string;
  annullata: boolean;
  pubblicata: boolean;
  vincitore?: string | null;
}
export interface DbPunti {
  id: number;
  attivita_id: number;
  classe: string;
  punti: number;
  tipo: string;
}

async function get<T>(path: string, fresh: boolean): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY!, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 60, tags: [DATA_TAG] } }),
  });
  if (!res.ok) throw new Error(`Supabase risponde ${res.status} su ${path.split("?")[0]}`);
  return res.json();
}

const table = (rows: Record<string, string>[], refs: number[]): Table => ({
  rows: rows.map((v, i) => ({ line: refs[i], v })),
  missing: [],
});

/** Converte le righe del database nelle stesse tabelle del foglio. */
export function rowsToTables(classi: DbClasse[], attivita: DbAttivita[], punti: DbPunti[]): Tables {
  const teamName = (id: string) => TEAMS.find((t) => t.id === id)?.name ?? id;
  return {
    classi: table(
      classi.map((c) => ({ classe: c.classe, squadra: teamName(c.squadra) })),
      classi.map((_, i) => i + 1),
    ),
    attivita: table(
      attivita.map((a) => ({
        id: String(a.id),
        data: a.data,
        titolo: a.titolo,
        tipo: a.tipo ?? "",
        descrizione: a.descrizione ?? "",
        stato: a.annullata ? "annullata" : "auto",
        data_fine: a.data_fine ?? "",
        vincitore: a.vincitore ? teamName(a.vincitore) : "",
      })),
      attivita.map((a) => a.id),
    ),
    punti: table(
      punti.map((p) => ({ id_attivita: String(p.attivita_id), classe: p.classe, punti: String(p.punti), tipo: p.tipo })),
      punti.map((p) => p.id),
    ),
  };
}

export async function loadSupabase(fresh = false): Promise<Tables> {
  const [classi, attivita, punti] = await Promise.all([
    get<DbClasse>("classi?select=classe,squadra&order=classe", fresh),
    get<DbAttivita>("attivita?select=*&pubblicata=eq.true&order=data,id", fresh),
    get<DbPunti>("punti?select=id,attivita_id,classe,punti,tipo&order=id", fresh),
  ]);
  const published = new Set(attivita.map((a) => a.id));
  return rowsToTables(
    classi,
    attivita,
    punti.filter((p) => published.has(p.attivita_id)),
  );
}
