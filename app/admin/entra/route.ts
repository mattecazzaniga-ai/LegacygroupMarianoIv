import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { adminAccount, checkPin, GATE_COOKIE, isPinConfigured, newPass } from "@/lib/supabase/pin";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Ingresso con PIN. È un normale invio di form (non una server action): funziona anche
 * da una pagina rimasta aperta prima di un aggiornamento del sito e senza JavaScript.
 */
export async function POST(req: NextRequest) {
  const go = (path: string) => NextResponse.redirect(new URL(path, req.url), 303);
  const fail = (msg: string) => go("/admin/login?err=" + encodeURIComponent(msg));

  if (!isPinConfigured()) return fail("Accesso con PIN non ancora configurato su Vercel.");
  const form = await req.formData().catch(() => null);
  if (!checkPin(String(form?.get("pin") ?? ""))) {
    await new Promise((r) => setTimeout(r, 1500)); // rallenta chi prova PIN a caso
    return fail("PIN sbagliato.");
  }
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword(adminAccount());
  if (error) return fail("PIN giusto, ma il collegamento al database non è riuscito. Riprova tra poco.");
  // cookie di sessione (niente scadenza): chiuso il browser, il PIN va rimesso
  (await cookies()).set(GATE_COOKIE, newPass(), { httpOnly: true, secure: true, sameSite: "lax", path: "/admin" });
  return go("/admin?da=pin");
}

export const GET = (req: NextRequest) => NextResponse.redirect(new URL("/admin/login", req.url), 303);
