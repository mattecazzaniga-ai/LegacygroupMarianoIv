/** Utilità sulle date in formato AAAA-MM-GG, senza dipendere dal fuso del server. */

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(s: string): boolean {
  if (!ISO_DATE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** "Oggi" nel fuso indicato, come AAAA-MM-GG. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Lunedì della settimana di `date`. */
export function mondayOf(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  return addDays(date, -dow);
}

const utcNoon = (d: string) => new Date(d + "T12:00:00Z");

/** 12 dicembre 2026 */
export const fmt = (d: string) =>
  utcNoon(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
/** 12 dic */
export const fmtS = (d: string) => utcNoon(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", timeZone: "UTC" });
/** dicembre 2026 */
export const fmtMonth = (y: number, m: number) =>
  new Date(Date.UTC(y, m, 1, 12)).toLocaleDateString("it-IT", { month: "long", year: "numeric", timeZone: "UTC" });

/** Istante (ms) di mezzanotte di `date` nel fuso indicato, con orario hh:mm:ss. */
export function instantIn(date: string, time: string, timeZone: string): number {
  // calcola lo scarto del fuso in quel giorno e correggi
  const guess = Date.parse(`${date}T${time}Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(guess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asLocal = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return guess - (asLocal - guess);
}
