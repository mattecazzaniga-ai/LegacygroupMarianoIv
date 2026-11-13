import { CONFIG, SCALE } from "@/lib/config";
import { meta } from "@/lib/meta";

export const metadata = meta("Regolamento", "Come funziona Legacy Group: squadre, punti collettivi e individuali, pari merito, Power Ranking e premio finale.", "/regolamento");

export default function Regolamento() {
  return (
    <div className="wrap">
      <section className="rules">
        <h1 className="sr-only">Regolamento</h1>
        <h2>
          Rego<span className="g">lamento</span>
        </h2>
        <p className="sub">Come funziona Legacy Group.</p>
        <div className="card">
          <ol>
            <li>
              <b>Sei squadre, 43 classi.</b> Ogni classe dell&apos;istituto appartiene a una squadra, ognuna con un colore e un simbolo della Sardegna.
            </li>
            <li>
              <b>I punti vanno alle classi.</b> Il punteggio di una squadra è la somma dei punti di tutte le sue classi.
            </li>
            <li>
              <b>Punti collettivi e individuali.</b> I collettivi sono assegnati all&apos;intera classe, gli individuali a uno studente per un risultato. Entrambi
              contano per la squadra. Sul sito vedi solo il totale della classe, mai il nome dello studente.
            </li>
            <li>
              <b>Nessun doppio conteggio.</b> Ogni assegnazione viene registrata una sola volta e compare nel registro delle attività.
            </li>
            <li>
              <b>Parità.</b> Le squadre con gli stessi punti hanno la stessa posizione. In caso di spareggio conta{" "}
              {CONFIG.tiebreak === "ultima"
                ? "chi ha preso più punti nell'ultima attività"
                : CONFIG.tiebreak === "attivita"
                  ? "chi ha ottenuto punti in più attività"
                  : "l'ordine di iscrizione"}
              .
            </li>
            <li>
              <b>Statistiche, Power Ranking e badge.</b> Sono calcolati in automatico dai punti. Il Power Ranking misura solo la forma recente: la classifica
              ufficiale resta quella generale.
            </li>
            <li>
              <b>Premio finale.</b> A fine anno la squadra con più punti vince il premio.
            </li>
          </ol>
        </div>
        <h2 style={{ marginTop: 26 }}>
          Punti nelle <span className="g">sfide</span>
        </h2>
        <p className="sub">Scala per le sfide tra squadre.</p>
        <div className="card">
          <table>
            <tbody>
              {SCALE.map(([a, b]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
