import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Accesso all'area organizzatori con un PIN.
 * Il PIN (ADMIN_PIN) e l'account tecnico Supabase (ADMIN_EMAIL / ADMIN_PASSWORD) stanno solo
 * nelle variabili d'ambiente di Vercel: mai nel codice. Dopo il PIN giusto il server entra in
 * Supabase con l'account tecnico, così le regole RLS restano valide.
 * Il "pass" è un cookie di sessione: si chiude il browser o passano 2 ore → il PIN va rimesso.
 */
export const GATE_COOKIE = "lg_pin";
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

const env = () => ({ pin: process.env.ADMIN_PIN ?? "", email: process.env.ADMIN_EMAIL ?? "", password: process.env.ADMIN_PASSWORD ?? "" });
export const isPinConfigured = () => {
  const e = env();
  return !!(e.pin && e.email && e.password);
};
export const adminAccount = () => ({ email: env().email, password: env().password });

/** Il telefono mette spesso la maiuscola iniziale o uno spazio: li ignoro. */
const norm = (s: string) => s.normalize("NFKC").trim().replace(/\s+/g, "").toLowerCase();

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const checkPin = (input: string) => isPinConfigured() && same(norm(input), norm(env().pin));

// la chiave dipende dal PIN: cambiare il PIN chiude tutte le sessioni aperte
const sign = (ts: string) => createHmac("sha256", `${env().password}|${norm(env().pin)}`).update(ts).digest("hex");

export const newPass = (now = Date.now()) => `${now}.${sign(String(now))}`;

export function validPass(value: string | undefined, now = Date.now()): boolean {
  if (!value || !isPinConfigured()) return false;
  const [ts, mac] = value.split(".");
  const t = Number(ts);
  if (!Number.isFinite(t) || now - t > MAX_AGE_MS || t > now + 60_000) return false;
  return same(mac ?? "", sign(ts));
}

/** Impronta del dispositivo per il blocco dei tentativi: HMAC dell'indirizzo IP (l'IP non viene mai salvato). */
export const deviceKey = (ip: string) => createHmac("sha256", `${env().password}|tentativi`).update(ip).digest("hex");

/** Indirizzo del visitatore: su Vercel l'intestazione x-vercel-forwarded-for è impostata dalla piattaforma. */
export function clientIp(h: Headers): string {
  const v = h.get("x-vercel-forwarded-for") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for") ?? "";
  return v.split(",")[0].trim() || "sconosciuto";
}

/** IPv6: un telefono cambia spesso gli ultimi 64 bit, quindi si conta la rete (/64), non l'indirizzo intero. */
export function deviceId(ip: string): string {
  if (!ip.includes(":")) return ip;
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const full = [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t];
  return full.slice(0, 4).map((x) => x.replace(/^0+(?=.)/, "")).join(":") + "::/64";
}

/** Chiave comune a tutti i dispositivi: ferma chi prova PIN cambiando indirizzo. */
export const GLOBAL_LIMIT = 30;
export const globalKey = () => deviceKey("__tutti__");

export const minutesLeft = (until: string, now = Date.now()) => Math.max(1, Math.ceil((Date.parse(until) - now) / 60000));
