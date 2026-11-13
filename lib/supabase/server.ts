import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "../data/supabase";

/** Client Supabase con la sessione dell'utente (cookie). Le regole RLS decidono cosa può fare. */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* chiamato da un Server Component: il middleware aggiorna i cookie */
        }
      },
    },
  });
}

/** Utente collegato o redirect al login. */
export async function requireUser() {
  if (!isSupabaseConfigured()) redirect("/admin/login");
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: ok } = await sb.rpc("is_organizzatore");
  if (!ok) {
    await sb.auth.signOut();
    redirect("/admin/login?err=" + encodeURIComponent("Questo account non è nella lista degli organizzatori."));
  }
  return { sb, user: data.user };
}
