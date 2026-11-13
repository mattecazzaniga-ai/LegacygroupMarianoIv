export type Kind = "collettiva" | "individuale";

/** Una riga del foglio "Punti", già validata. */
export interface Award {
  cls: string;
  pts: number;
  kind: Kind;
}

/** Un'attività che ha generato almeno un punto. */
export interface Activity {
  id: string;
  date: string; // AAAA-MM-GG
  title: string;
  type: string;
  desc: string;
  awards: Award[];
}

export type EventStatus = "auto" | "annullata";

/** Una riga del foglio "Attivita" (calendario). */
export interface CalEvent {
  id: string;
  date: string;
  end?: string;
  title: string;
  type: string;
  desc: string;
  status: EventStatus;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  cname: string;
  classes: string[];
}

export type Tiebreak = "nessuno" | "attivita" | "ultima";

export interface Issue {
  level: "errore" | "attenzione";
  sheet: "Attivita" | "Punti" | "Classi" | "Generale";
  row?: number; // numero di riga come appare nel foglio (intestazione = 1)
  message: string;
}

export type DataSource = "foglio" | "supabase" | "non-configurato";

export interface Dataset {
  teams: Team[];
  /** Attività con punti, ordinate per data (a parità, ordine del foglio). */
  activities: Activity[];
  /** Tutte le righe valide del foglio "Attivita". */
  events: CalEvent[];
  issues: Issue[];
  source: DataSource;
  fetchedAt: string; // ISO
}
