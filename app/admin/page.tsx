import Link from "next/link";
import { fmt, todayIn } from "@/lib/dates";
import { CONFIG } from "@/lib/config";
import { isSupabaseConfigured, type DbAttivita } from "@/lib/data/supabase";
import { requireUser } from "@/lib/supabase/server";
import { createActivity } from "./actions";
import { AdminBar, Flash, NotConfigured } from "./ui";
import WinnerField from "./WinnerField";
import { TEAMS } from "@/lib/teams";

export default async function Admin({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;
  const { sb, user } = await requireUser();
  const { ok, err } = await searchParams;
  const [{ data: acts }, { data: pts }] = await Promise.all([
    sb.from("attivita").select("*").order("data", { ascending: false }).order("id", { ascending: false }),
    sb.from("punti").select("attivita_id,punti"),
  ]);
  const tot = new Map<number, { n: number; s: number }>();
  (pts ?? []).forEach((p: { attivita_id: number; punti: number }) => {
    const t = tot.get(p.attivita_id) ?? { n: 0, s: 0 };
    tot.set(p.attivita_id, { n: t.n + 1, s: t.s + p.punti });
  });
  const list = (acts ?? []) as DbAttivita[];

  return (
    <section>
      <AdminBar email={user.email} />
      <h1 className="page">Attività</h1>
      <p className="sub">Crea un&apos;attività, assegna i punti alle classi e pubblicala: il sito si aggiorna subito.</p>
      <Flash ok={ok} err={err} />

      <details className="newact" open={list.length === 0}>
        <summary className="btn">+ Nuova attività</summary>
        <form action={createActivity} className="form">
          <label>
            Titolo
            <input name="titolo" required placeholder="es. Torneo di calcetto" />
          </label>
          <div className="two">
            <label>
              Data
              <input type="date" name="data" required defaultValue={todayIn(CONFIG.timeZone)} />
            </label>
            <label>
              Fine (solo se dura più giorni)
              <input type="date" name="data_fine" />
            </label>
          </div>
          <label>
            Tipo (facoltativo)
            <input name="tipo" placeholder="es. Sport, Cultura, Volontariato" list="tipi" />
          </label>
          <datalist id="tipi">
            {[...new Set(list.map((a) => a.tipo).filter(Boolean))].map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <label>
            Descrizione (facoltativa, mai nomi di studenti)
            <textarea name="descrizione" rows={2} />
          </label>
          <WinnerField />
          <button type="submit" className="btn">
            Crea come bozza
          </button>
        </form>
      </details>

      <ul className="alist">
        {list.length ? (
          list.map((a) => {
            const t = tot.get(a.id);
            return (
              <li key={a.id}>
                <Link href={`/admin/attivita/${a.id}`}>
                  <div>
                    <b>{a.titolo}</b>
                    <span className="muted">
                      {fmt(a.data)}
                      {a.tipo ? ` · ${a.tipo}` : ""} · {t ? `${t.n} assegnazioni, ${t.s} punti` : "nessun punto"}
                      {a.vincitore ? ` · vince ${TEAMS.find((x) => x.id === a.vincitore)?.name}` : ""}
                    </span>
                  </div>
                  <span className={`st ${a.annullata ? "annullata" : a.pubblicata ? "corso" : "programmata"}`}>
                    {a.annullata ? "Annullata" : a.pubblicata ? "Pubblicata" : "Bozza"}
                  </span>
                </Link>
              </li>
            );
          })
        ) : (
          <li className="empty">Nessuna attività ancora.</li>
        )}
      </ul>
    </section>
  );
}
