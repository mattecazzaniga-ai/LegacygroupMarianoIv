import Link from "next/link";
import { signOut } from "./actions";

export function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (err) return <p className="flash err" role="alert">{err}</p>;
  if (ok) return <p className="flash" role="status">{ok}</p>;
  return null;
}

export function AdminBar() {
  return (
    <div className="adminbar">
      <nav aria-label="Area organizzatori">
        <Link href="/admin">Attività</Link>
        <Link href="/admin/registro">Registro modifiche</Link>
        <Link href="/" target="_blank">Apri il sito ↗</Link>
      </nav>
      <form action={signOut}>
        <button type="submit" className="btn ghost sm">
          Esci
        </button>
      </form>
    </div>
  );
}

export function NotConfigured() {
  return (
    <section>
      <h1 className="page">Area organizzatori</h1>
      <p className="sub">
        Supabase non è ancora collegato. Aggiungi su Vercel le variabili NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY, poi fai Redeploy
        (istruzioni nel README).
      </p>
    </section>
  );
}
