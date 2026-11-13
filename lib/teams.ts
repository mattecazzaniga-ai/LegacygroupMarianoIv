import type { Team } from "./types";

/**
 * Le sei squadre. Nome, colore e stemma stanno qui.
 * L'assegnazione delle classi arriva dal foglio "Classi";
 * l'elenco qui sotto è quello di partenza e serve solo se il foglio è vuoto
 * o per segnalare differenze nella pagina /controllo.
 */
export const TEAMS: Team[] = [
  { id: "componidori", name: "Su Componidori", color: "#f2eee6", cname: "Bianco", classes: ["1BS", "2AS", "2E", "3CB", "3F", "4BB", "5BS"] },
  { id: "mamuthones", name: "Mamuthones", color: "#0b0b0b", cname: "Nero", classes: ["1AS", "1C", "2D", "3E", "4CB", "4CS", "5AS"] },
  { id: "eleonora", name: "Eleonora d'Arborea", color: "#e9b230", cname: "Oro", classes: ["1A", "1D", "2F", "3CS", "4F", "5A", "5BB"] },
  { id: "giganti", name: "Giganti di Monteprama", color: "#b8b2a6", cname: "Grigio pietra", classes: ["1CS", "1F", "2CB", "3BB", "3G", "4A", "4AS", "5E"] },
  { id: "shardana", name: "Shardana", color: "#a0642d", cname: "Bronzo", classes: ["1BB", "2A", "2BS", "3BS", "3D", "4E", "5DB"] },
  { id: "mariano-iv", name: "Mariano IV", color: "#c8102e", cname: "Rosso", classes: ["1E", "2BB", "3A", "3AS", "4BS", "5G", "5H"] },
];

/** Altri modi accettati per scrivere la squadra nel foglio Classi (nomi brevi e vecchi nomi). */
export const TEAM_ALIASES: Record<string, string> = {
  Componidori: "componidori",
  Mamuthone: "mamuthones",
  Eleonora: "eleonora",
  Janas: "eleonora",
  Giganti: "giganti",
  "Giganti di Mont'e Prama": "giganti",
  Issohadores: "mariano-iv",
};

/** Colore usato nei grafici (il nero non si vedrebbe sul blu notte). */
export const chartColor = (t: Pick<Team, "id" | "color">) => (t.id === "mamuthones" ? "#8895ab" : t.color);
export const chartDash = (t: Pick<Team, "id">) => (t.id === "mamuthones" ? "5 4" : "");

export const classSlug = (c: string) => c.toLowerCase();
