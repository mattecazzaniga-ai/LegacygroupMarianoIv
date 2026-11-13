import type { Tiebreak } from "./types";

/**
 * IMPOSTAZIONI DELLA COMPETIZIONE
 * Per cambiarle: modifica questo file su GitHub (icona della matita) e salva.
 * Vercel ripubblica il sito da solo in circa un minuto.
 */
export const CONFIG = {
  /** Inizio della competizione (AAAA-MM-GG). Serve per la barra di avanzamento. */
  startDate: "2026-09-14",
  /** Fine della competizione (AAAA-MM-GG). Dopo questa data parte la modalità finale. */
  endDate: "2027-06-08",
  /** true = forza subito la modalità finale con la squadra vincitrice. */
  closed: false,
  /**
   * Spareggio a parità di punti (conta solo per l'ordine, la posizione resta uguale):
   * "ultima"   = più punti nell'ultima attività
   * "attivita" = punti in più attività
   * "nessuno"  = ordine delle squadre
   */
  tiebreak: "ultima" as Tiebreak,
  /** Fuso orario usato per "oggi", la settimana e il calendario. */
  timeZone: "Europe/Rome",
} as const;

function siteUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL];
  for (const c of candidates) {
    if (!c) continue;
    const v = c.trim().replace(/\/+$/, "");
    try {
      return new URL(/^https?:\/\//.test(v) ? v : `https://${v}`).origin;
    } catch {
      /* indirizzo non valido: provo il successivo */
    }
  }
  return "http://localhost:3000";
}

export const SITE = {
  name: "Legacy Group",
  /** Indirizzo pubblico. Se manca o è scritto male, usa quello che Vercel assegna al progetto. */
  url: siteUrl(),
  description:
    "Legacy Group – Istituto Mariano IV, Oristano. Sei squadre, 43 classi: classifica, punti, attività e statistiche dell'anno scolastico 2026–2027.",
};

/** Scala per le sfide tra squadre (pagina Regolamento). */
export const SCALE: [string, number][] = [
  ["1° posto", 10],
  ["2° posto", 8],
  ["3° posto", 6],
  ["4° posto", 4],
  ["5° posto", 2],
  ["6° posto", 1],
];
