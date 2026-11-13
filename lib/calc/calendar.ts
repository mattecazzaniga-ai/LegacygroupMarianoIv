/** Calendario: stato delle attività (programmata / in corso / conclusa / annullata). */
import type { Activity, CalEvent } from "../types";

export type Status = "programmata" | "corso" | "conclusa" | "annullata";

export const STATUS_LABEL: Record<Status, string> = {
  programmata: "Programmata",
  corso: "In corso",
  conclusa: "Conclusa",
  annullata: "Annullata",
};

export interface CalItem extends CalEvent {
  /** presente se l'attività ha già punti assegnati */
  act?: Activity;
}

export function statusOf(e: CalItem, today: string): Status {
  if (e.status === "annullata") return "annullata";
  if (e.act) return "conclusa";
  const end = e.end || e.date;
  if (today > end) return "conclusa";
  if (today >= e.date && today <= end) return "corso";
  return "programmata";
}

/** Unisce le righe del foglio "Attivita" con le attività che hanno punti. */
export function calEvents(events: CalEvent[], acts: Activity[]): CalItem[] {
  const byId = new Map(acts.map((a) => [a.id, a]));
  return events
    .map((e) => ({ ...e, act: e.status === "annullata" ? undefined : byId.get(e.id) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Eventi che toccano il giorno `day` (anche su più giorni). */
export const onDay = (ev: CalItem[], day: string) => ev.filter((e) => e.date <= day && (e.end || e.date) >= day);
