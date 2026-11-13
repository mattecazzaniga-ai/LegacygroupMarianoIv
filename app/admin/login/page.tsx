import { isSupabaseConfigured } from "@/lib/data/supabase";
import { signIn } from "../actions";
import { Flash, NotConfigured } from "../ui";
import PasswordInput from "./PasswordInput";

export default async function Login({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;
  const { err } = await searchParams;
  return (
    <section className="login">
      <div className="eyebrow">Legacy Group</div>
      <h1 className="page">Accedi</h1>
      <p className="sub">Area riservata agli organizzatori. Dopo l&apos;accesso trovi in alto la voce &ldquo;Cambia password&rdquo;.</p>
      <Flash err={err} />
      <form action={signIn} className="form">
        <label>
          Email
          <input type="email" name="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email" required />
        </label>
        <label>
          Password
          <PasswordInput />
        </label>
        <button type="submit" className="btn">
          Entra
        </button>
      </form>
    </section>
  );
}
