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
      <h1 className="page">Area organizzatori</h1>
      <p className="sub">Inserisci il PIN per entrare.</p>
      <Flash err={err} />
      <form action={signIn} className="form">
        <label>
          PIN
          <PasswordInput />
        </label>
        <button type="submit" className="btn">
          Entra
        </button>
      </form>
    </section>
  );
}
