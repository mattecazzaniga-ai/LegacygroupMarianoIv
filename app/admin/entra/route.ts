import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { adminAccount, checkPin, clientIp, deviceId, deviceKey, GATE_COOKIE, GLOBAL_LIMIT, globalKey, isPinConfigured, minutesLeft, newPass } from "@/lib/supabase/pin";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Ingresso con PIN. È un normale invio di form (non una server action): funziona anche
 * da una pagina rimasta aperta prima di un aggiornamento del sito e senza JavaScript.
 * Dopo 5 PIN sbagliati dallo stesso dispositivo l'ingresso resta bloccato 15 minuti per quel dispositivo;
 * dopo 30 PIN sbagliati in tutto (da qualsiasi dispositivo) si blocca per tutti per 15 minuti.
 */
export async function POST(req: NextRequest) {
  const go = (path: string) => NextResponse.redirect(new URL(path, req.url), 303);
  const fail = (msg: string) => go("/admin/login?err=" + encodeURIComponent(msg));
  const locked = (until: string) => {
    const m = minutesLeft(until);
    return fail(`Troppi tentativi sbagliati. Per sicurezza l'ingresso è bloccato: riprova tra ${m} ${m === 1 ? "minuto" : "minuti"}.`);
  };

  if (!isPinConfigured()) return fail("Accesso con PIN non ancora configurato su Vercel.");
  const sb = await supabaseServer();
  const key = deviceKey(deviceId(clientIp(req.headers)));
  const all = globalKey();

  // se il controllo dei tentativi non risponde, non si entra (meglio chiuso che aperto)
  const [r1, r2] = await Promise.all([sb.rpc("pin_bloccato", { k: key }), sb.rpc("pin_bloccato", { k: all })]);
  if (r1.error || r2.error) return fail("Il controllo di sicurezza non risponde. Riprova tra poco.");
  if (r1.data || r2.data) return locked((r1.data ?? r2.data) as string);

  const form = await req.formData().catch(() => null);
  if (!checkPin(String(form?.get("pin") ?? ""))) {
    await new Promise((r) => setTimeout(r, 1000));
    const [d, g] = await Promise.all([sb.rpc("pin_errore", { k: key, limite: 5 }), sb.rpc("pin_errore", { k: all, limite: GLOBAL_LIMIT })]);
    if (d.error || g.error) return fail("PIN sbagliato.");
    const left = d.data as number;
    if (left === 0 || g.data === 0) return locked(new Date(Date.now() + 15 * 60000).toISOString());
    return fail(`PIN sbagliato. ${left === 1 ? "Ancora 1 tentativo" : `Ancora ${left} tentativi`} prima del blocco di 15 minuti.`);
  }

  const { error } = await sb.auth.signInWithPassword(adminAccount());
  if (error) return fail("PIN giusto, ma il collegamento al database non è riuscito. Riprova tra poco.");
  await sb.rpc("pin_azzera", { k: key });
  // cookie di sessione (niente scadenza): chiuso il browser, il PIN va rimesso
  (await cookies()).set(GATE_COOKIE, newPass(), { httpOnly: true, secure: true, sameSite: "lax", path: "/admin" });
  return go("/admin?da=pin");
}

export const GET = (req: NextRequest) => NextResponse.redirect(new URL("/admin/login", req.url), 303);
