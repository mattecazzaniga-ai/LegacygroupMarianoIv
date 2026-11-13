import { isSupabaseConfigured } from "@/lib/data/supabase";
import { requireUser } from "@/lib/supabase/server";
import { AdminBar, NotConfigured } from "../ui";

type Log = { id: number; quando: string; utente: string | null; azione: string; tabella: string; record_id: string | null; prima: Record<string, unknown> | null; dopo: Record<string, unknown> | null };

const VERB: Record<string, string> = { INSERT: "ha aggiunto", UPDATE: "ha modificato", DELETE: "ha eliminato" };
const WHAT: Record<string, string> = { attivita: "attività", punti: "punti", classi: "classe" };

function describe(l: Log) {
  const r = (l.dopo ?? l.prima ?? {}) as Record<string, unknown>;
  if (l.tabella === "punti") return `${r.punti} punti (${r.tipo}) alla ${r.classe}, attività n. ${r.attivita_id}`;
  if (l.tabella === "attivita") {
    const changes =
      l.azione === "UPDATE" && l.prima && l.dopo
        ? Object.keys(l.dopo)
            .filter((k) => k !== "updated_at" && JSON.stringify(l.dopo![k]) !== JSON.stringify(l.prima![k]))
            .map((k) => `${k}: ${l.prima![k] ?? "–"} → ${l.dopo![k] ?? "–"}`)
            .join(", ")
        : "";
    return `"${r.titolo}" (n. ${r.id})${changes ? " · " + changes : ""}`;
  }
  return `${r.classe} → ${r.squadra}`;
}

export default async function Registro() {
  if (!isSupabaseConfigured()) return <NotConfigured />;
  const { sb, user } = await requireUser();
  const { data } = await sb.from("registro").select("*").order("id", { ascending: false }).limit(200);
  const logs = (data ?? []) as Log[];
  return (
    <section>
      <AdminBar email={user.email} />
      <h1 className="page">Registro modifiche</h1>
      <p className="sub">Ogni inserimento, modifica o eliminazione, con chi l&apos;ha fatta e quando. Le ultime 200.</p>
      <ol className="log">
        {logs.length ? (
          logs.map((l) => (
            <li key={l.id}>
              <span className="muted">
                {new Date(l.quando).toLocaleString("it-IT", { timeZone: "Europe/Rome", dateStyle: "short", timeStyle: "short" })}
              </span>
              <span>
                <b>{l.utente ?? "?"}</b> {VERB[l.azione] ?? l.azione} {WHAT[l.tabella] ?? l.tabella}: {describe(l)}
              </span>
            </li>
          ))
        ) : (
          <li className="empty">Ancora nessuna modifica.</li>
        )}
      </ol>
    </section>
  );
}
