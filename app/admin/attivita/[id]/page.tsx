import Link from "next/link";
import { notFound } from "next/navigation";
import { fmt } from "@/lib/dates";
import { isSupabaseConfigured, type DbAttivita, type DbClasse, type DbPunti } from "@/lib/data/supabase";
import { requireUser } from "@/lib/supabase/server";
import { TEAMS } from "@/lib/teams";
import { deleteActivity, deletePoint, setFlags, updateActivity } from "../../actions";
import { AdminBar, Flash, NotConfigured } from "../../ui";
import PointsForm from "./PointsForm";
import WinnerField from "../../WinnerField";

export default async function EditActivity({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;
  const { sb, user } = await requireUser();
  const id = Number((await params).id);
  const { ok, err } = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [{ data: a }, { data: pts }, { data: cls }] = await Promise.all([
    sb.from("attivita").select("*").eq("id", id).maybeSingle(),
    sb.from("punti").select("*").eq("attivita_id", id).order("id"),
    sb.from("classi").select("classe,squadra").order("classe"),
  ]);
  if (!a) notFound();
  const act = a as DbAttivita;
  const points = (pts ?? []) as DbPunti[];
  const classi = (cls ?? []) as DbClasse[];
  const teamOf = new Map(classi.map((c) => [c.classe, TEAMS.find((t) => t.id === c.squadra)]));
  const groups = TEAMS.map((t) => ({ team: t.name, classes: classi.filter((c) => c.squadra === t.id).map((c) => c.classe) }));
  const total = points.reduce((s, p) => s + p.punti, 0);

  return (
    <section>
      <AdminBar email={user.email} />
      <Link className="back" href="/admin">
        ← Tutte le attività
      </Link>
      <div className="eyebrow">
        {fmt(act.data)} · {act.annullata ? "Annullata" : act.pubblicata ? "Pubblicata sul sito" : "Bozza (non visibile sul sito)"}
      </div>
      <h1 className="page" style={{ fontSize: "clamp(34px,8vw,56px)" }}>
        {act.titolo}
      </h1>
      {act.vincitore ? <p className="sub">Squadra vincitrice: <b>{TEAMS.find((t) => t.id === act.vincitore)?.name}</b></p> : null}
      <Flash ok={ok} err={err} />

      <div className="pubbar">
        {act.pubblicata ? (
          <form action={setFlags.bind(null, id, { pubblicata: false })}>
            <button className="btn ghost" type="submit">
              Rimetti in bozza
            </button>
          </form>
        ) : (
          <form action={setFlags.bind(null, id, { pubblicata: true })}>
            <button className="btn" type="submit">
              Pubblica sul sito
            </button>
          </form>
        )}
        <form action={setFlags.bind(null, id, { annullata: !act.annullata })}>
          <button className="btn ghost" type="submit">
            {act.annullata ? "Riattiva" : "Segna come annullata"}
          </button>
        </form>
      </div>

      <h2 className="ah">Punti assegnati</h2>
      <p className="sub">
        {points.length ? `${points.length} assegnazioni, ${total} punti in totale.` : "Ancora nessun punto."} Ogni riga conta una volta sola.
      </p>
      {points.length ? (
        <ul className="plist">
          {points.map((p) => {
            const t = teamOf.get(p.classe);
            return (
              <li key={p.id}>
                <span className="dot" style={{ background: t?.color }} aria-hidden="true" />
                <b>{p.classe}</b>
                <span className="muted">{t?.name}</span>
                <span className="k">{p.tipo}</span>
                <b className="pts">
                  {p.punti > 0 ? "+" : ""}
                  {p.punti}
                </b>
                <form action={deletePoint.bind(null, id, p.id)}>
                  <button type="submit" className="x" aria-label={`Elimina ${p.punti} punti alla ${p.classe}`}>
                    ✕
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      ) : null}
      <PointsForm id={id} groups={groups} />

      <h2 className="ah">Dati dell&apos;attività</h2>
      <form action={updateActivity.bind(null, id)} className="form">
        <label>
          Titolo
          <input name="titolo" required defaultValue={act.titolo} />
        </label>
        <div className="two">
          <label>
            Data
            <input type="date" name="data" required defaultValue={act.data} />
          </label>
          <label>
            Fine (solo se dura più giorni)
            <input type="date" name="data_fine" defaultValue={act.data_fine ?? ""} />
          </label>
        </div>
        <label>
          Tipo
          <input name="tipo" defaultValue={act.tipo} />
        </label>
        <label>
          Descrizione (mai nomi di studenti)
          <textarea name="descrizione" rows={3} defaultValue={act.descrizione} />
        </label>
        <WinnerField value={act.vincitore} />
        <button type="submit" className="btn ghost">
          Salva i dati
        </button>
      </form>

      <details className="danger">
        <summary>Elimina attività</summary>
        <p className="sub">Cancella l&apos;attività e tutti i suoi punti. Resta traccia nel registro modifiche.</p>
        <form action={deleteActivity.bind(null, id)}>
          <button type="submit" className="btn danger-btn">
            Sì, elimina definitivamente
          </button>
        </form>
      </details>
    </section>
  );
}
