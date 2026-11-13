import { isSupabaseConfigured } from "@/lib/data/supabase";
import { requireUser } from "@/lib/supabase/server";
import { changePassword } from "../actions";
import { AdminBar, Flash, NotConfigured } from "../ui";

export default async function Password({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;
  const { user } = await requireUser();
  const { ok, err } = await searchParams;
  return (
    <section>
      <AdminBar email={user.email} />
      <h1 className="page">Cambia password</h1>
      <p className="sub">Almeno 10 caratteri. Vale da subito per il prossimo accesso.</p>
      <Flash ok={ok} err={err} />
      <form action={changePassword} className="form" style={{ maxWidth: 420 }}>
        <label>
          Nuova password
          <input type="password" name="password" autoComplete="new-password" minLength={10} required />
        </label>
        <label>
          Ripeti la nuova password
          <input type="password" name="password2" autoComplete="new-password" minLength={10} required />
        </label>
        <button type="submit" className="btn">
          Salva
        </button>
      </form>
    </section>
  );
}
