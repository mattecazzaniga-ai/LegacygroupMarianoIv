import { timingSafeEqual } from "node:crypto";
import type { Metadata } from "next";
import { sum } from "@/lib/calc/core";
import { buildModel } from "@/lib/calc/model";
import { CONFIG } from "@/lib/config";
import { checkSheet } from "@/lib/data/source";
import { todayIn } from "@/lib/dates";
import type { Issue } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Controllo dati", robots: { index: false, follow: false } };

function tokenOk(given: string | undefined) {
  const expected = process.env.CONTROLLO_TOKEN;
  if (!expected || !given) return false;
  const a = Buffer.from(given),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function IssueList({ list }: { list: Issue[] }) {
  return (
    <>
      {list.map((i, k) => (
        <div key={k} className={`issue ${i.level}`}>
          <b>{i.level === "errore" ? "Errore" : "Attenzione"}</b> · foglio {i.sheet}
          {i.row ? `, riga ${i.row}` : ""}: {i.message}
        </div>
      ))}
    </>
  );
}

export default async function Controllo({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!process.env.CONTROLLO_TOKEN)
    return (
      <div className="wrap">
        <section>
          <h1 className="eyebrow">Controllo dati</h1>
          <p className="sub" style={{ marginTop: 10 }}>
            Pagina disattivata: imposta la variabile CONTROLLO_TOKEN su Vercel (vedi README).
          </p>
        </section>
      </div>
    );
  if (!tokenOk(token))
    return (
      <div className="wrap">
        <section>
          <h1 className="eyebrow">Controllo dati</h1>
          <p className="sub" style={{ marginTop: 10 }}>
            Accesso non autorizzato. Usa il link con il token corretto.
          </p>
        </section>
      </div>
    );

  const res = await checkSheet();
  const ds = res.dataset;
  const errors = ds?.issues.filter((i) => i.level === "errore") ?? [];
  const warns = ds?.issues.filter((i) => i.level === "attenzione") ?? [];
  const m = ds ? buildModel({ teams: ds.teams, acts: ds.activities, tiebreak: CONFIG.tiebreak, today: todayIn(CONFIG.timeZone) }) : null;
  const pointRows = ds ? sum(ds.activities.map((a) => a.awards.length)) : 0;

  return (
    <div className="wrap">
      <section>
        <h1 className="eyebrow">Controllo dati</h1>
        <h2 style={{ marginTop: 8 }}>
          Stato del <span className="g">foglio</span>
        </h2>
        <p className="sub">Lettura fatta adesso, senza cache. Il sito pubblico si aggiorna entro un minuto (più il ritardo di Google, fino a 5 minuti).</p>
        <div className="card">
          {!res.configured ? (
            <p>Foglio non collegato: mancano le variabili SHEET_ATTIVITA_CSV, SHEET_PUNTI_CSV, SHEET_CLASSI_CSV su Vercel.</p>
          ) : !res.ok ? (
            <div className="issue">
              <b>Il foglio non si legge.</b> {res.error} Il sito pubblico continua a mostrare l&apos;ultima versione valida.
            </div>
          ) : (
            <p>
              Foglio letto correttamente: <b>{ds!.events.length}</b> attività in calendario, <b>{ds!.activities.length}</b> con punti, <b>{pointRows}</b>{" "}
              assegnazioni valide. <b style={{ color: errors.length ? "#ef7a7a" : "#58d68d" }}>{errors.length} errori</b>, {warns.length} avvisi.
            </p>
          )}
        </div>
      </section>
      {ds ? (
        <>
          <section>
            <h2>
              Errori <span className="g">({errors.length})</span>
            </h2>
            <p className="sub">Queste righe NON sono contate nei punti. Correggile nel foglio.</p>
            {errors.length ? <IssueList list={errors} /> : <p className="empty">Nessun errore.</p>}
          </section>
          <section>
            <h2>
              Avvisi <span className="g">({warns.length})</span>
            </h2>
            <p className="sub">Righe contate, ma da ricontrollare.</p>
            {warns.length ? <IssueList list={warns} /> : <p className="empty">Nessun avviso.</p>}
          </section>
          <section>
            <h2>
              Totali per <span className="g">squadra</span>
            </h2>
            <p className="sub">Per confrontarli con il foglio (somma delle righe valide del foglio Punti).</p>
            <div className="card scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Squadra</th>
                    <th scope="col">Classi</th>
                    <th scope="col">Punti</th>
                  </tr>
                </thead>
                <tbody>
                  {m!.now.map((r) => (
                    <tr key={r.team.id}>
                      <td>
                        <b>{r.team.name}</b>
                        <div className="note" style={{ margin: 0 }}>
                          {r.team.classes.join(", ") || "nessuna classe"}
                        </div>
                      </td>
                      <td>{r.team.classes.length}</td>
                      <td>
                        <b>{r.pts}</b>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <b>Totale</b>
                    </td>
                    <td>{sum(m!.now.map((r) => r.team.classes.length))}</td>
                    <td>
                      <b>{sum(m!.now.map((r) => r.pts))}</b>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
