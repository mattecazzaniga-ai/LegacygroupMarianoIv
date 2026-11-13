import { isSupabaseConfigured } from "@/lib/data/supabase";
import { signIn } from "../actions";
import { Flash, NotConfigured } from "../ui";

export default async function Login({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;
  const { err } = await searchParams;
  return (
    <section className="login">
      <div className="eyebrow">Legacy Group</div>
      <h1 className="page">Accedi</h1>
      <p className="sub">Area riservata agli organizzatori.</p>
      <Flash err={err} />
      <form action={signIn} className="form">
        <label>
          Email
          <input type="email" name="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <button type="submit" className="btn">
          Entra
        </button>
      </form>
    </section>
  );
}
