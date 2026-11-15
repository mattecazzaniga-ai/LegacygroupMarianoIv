import Link from "next/link";
import { PageHead } from "@/components/ui";
import { CONFIG } from "@/lib/config";
import { meta } from "@/lib/meta";
import { TEAMS } from "@/lib/teams";

export const metadata = meta(
  "Regolamento",
  "Come funziona Legacy Group: squadre, tipologie di sfide, come si assegnano i punti (posizione × livello × tipo + partecipazione), riconoscimenti, classifica generale e premio finale.",
  "/regolamento",
);

const TIEBREAK =
  CONFIG.tiebreak === "ultima"
    ? "conta l'ordine di chi ha preso più punti nell'ultima attività registrata"
    : CONFIG.tiebreak === "attivita"
      ? "conta l'ordine di chi ha ottenuto punti in più attività"
      : "si segue l'ordine ufficiale delle squadre";

export default function Regolamento() {
  const classes = TEAMS.reduce((n, t) => n + t.classes.length, 0);
  return (
    <div className="wrap">
      <section>
        <PageHead
          eyebrow="Come funziona"
          title="Regolamento"
          sub="Legacy Group è la competizione tra le squadre dell'Istituto Mariano IV per l'anno scolastico 2026/27. Questo regolamento spiega come si formano le squadre, come si guadagnano i punti e come si arriva alla squadra vincitrice."
        />
        <nav className="toc" aria-label="Indice del regolamento">
          <ol>
            <li><a href="#squadre">Le squadre</a></li>
            <li><a href="#sfide">Le sfide</a></li>
            <li><a href="#punti">Come si assegnano i punti</a></li>
            <li><a href="#meriti">Riconoscimenti e meriti</a></li>
            <li><a href="#classifica">La classifica generale</a></li>
            <li><a href="#premio">Il premio finale</a></li>
          </ol>
        </nav>

        <div className="reg">
          <article id="squadre">
            <span className="n" aria-hidden="true">01</span>
            <div>
              <h2>Le squadre</h2>
              <p>
                Partecipano <b>{TEAMS.length} squadre</b> e <b>{classes} classi</b>. Ogni classe appartiene a una sola squadra e gioca per lei
                per tutta la stagione. Ogni squadra ha un nome, un colore e uno stemma legati alla storia e alle tradizioni della Sardegna.
              </p>
              <ul className="teamlist">
                {TEAMS.map((t) => (
                  <li key={t.id}>
                    <span className="dot" style={{ background: t.color }} aria-hidden="true" />
                    <Link href={`/squadra/${t.id}`}>{t.name}</Link>
                    <span className="muted">
                      {t.cname} · {t.classes.length} classi
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article id="sfide">
            <span className="n" aria-hidden="true">02</span>
            <div>
              <h2>Le sfide</h2>
              <p>La competizione non è fatta solo di tornei o gare sportive. Durante l&apos;anno potranno essere proposte prove e attività di tipo diverso:</p>
              <ul className="bul">
                <li>tornei sportivi e competizioni;</li>
                <li>sfide tra squadre e tra classi;</li>
                <li>prove individuali o collettive;</li>
                <li>attività di collaborazione e di supporto all&apos;organizzazione scolastica;</li>
                <li>aiuto concreto nella realizzazione di iniziative;</li>
                <li>riconoscimenti per un ottimo lavoro svolto;</li>
                <li>partecipazione, impegno e disponibilità;</li>
                <li>iniziative particolarmente meritevoli;</li>
                <li>altre attività e sfide che verranno proposte durante l&apos;anno.</li>
              </ul>
              <p>
                Alcune sfide, come tornei e quizzoni, prevedono una <b>squadra vincitrice</b>, indicata dagli organizzatori. Altre assegnano punti senza un
                vincitore, ad esempio per la collaborazione o l&apos;aiuto dato.
              </p>
              <p>
                Date e appuntamenti sono pubblicati nel <Link href="/calendario">calendario</Link>.
              </p>
            </div>
          </article>

          <article id="punti">
            <span className="n" aria-hidden="true">03</span>
            <div>
              <h2>Come si assegnano i punti</h2>
              <p>
                I punti vanno alle <b>classi</b> e la somma dei punti delle classi forma il punteggio della squadra. Ogni attività segue sempre la
                stessa formula:
              </p>
              <p className="formula">
                Punti = <b>Posizione</b> × <b>Livello</b> × <b>Tipo</b> + <b>Partecipazione</b>
              </p>

              <h3>1. La posizione</h3>
              <p>Si premiano le prime cinque posizioni. Dal 6° posto in poi non si prendono punti di posizione.</p>
              <ul className="scale" aria-label="Punti per posizione">
                {[
                  ["1°", 10],
                  ["2°", 8],
                  ["3°", 6],
                  ["4°", 4],
                  ["5°", 2],
                ].map(([p, v]) => (
                  <li key={p}>
                    <span>{p}</span>
                    <b>{v}</b>
                  </li>
                ))}
              </ul>

              <h3>2. Il livello dell&apos;attività</h3>
              <p>Più l&apos;attività è importante, più vale. Il livello viene annunciato prima dell&apos;attività.</p>
              <ul className="bul">
                <li>
                  <b>Livello 1</b>, attività piccola: ×1
                </li>
                <li>
                  <b>Livello 2</b>, torneo o gara di istituto: ×2
                </li>
                <li>
                  <b>Livello 3</b>, evento grande: ×3
                </li>
              </ul>

              <h3>3. Il tipo</h3>
              <ul className="bul">
                <li>
                  <b>Collettivo</b>, gioca la classe: ×2
                </li>
                <li>
                  <b>Singolo</b>, gioca un solo studente per la sua classe: ×1
                </li>
              </ul>

              <h3>4. La partecipazione</h3>
              <p>
                Quando un&apos;attività prevede il punto di partecipazione, tutte le classi che partecipano ricevono in più un punto per ogni livello:{" "}
                <b>+1</b> al livello 1, <b>+2</b> al livello 2, <b>+3</b> al livello 3. Si somma ai punti della posizione. Non tutte le attività lo
                prevedono: viene comunicato prima.
              </p>

              <h3>Esempi</h3>
              <div className="examples">
                <div>
                  <p className="ex-t">Torneo di livello 2, collettivo, con partecipazione</p>
                  <p>
                    1° posto: 10 × 2 × 2 + 2 = <b>42 punti</b>
                    <br />
                    4° posto: 4 × 2 × 2 + 2 = <b>18 punti</b>
                    <br />
                    8° posto: solo la partecipazione, <b>2 punti</b>
                  </p>
                </div>
                <div>
                  <p className="ex-t">Gara di livello 3, singolo, senza partecipazione</p>
                  <p>
                    3° posto: 6 × 3 × 1 = <b>18 punti</b>
                    <br />
                    6° posto: <b>0 punti</b>
                  </p>
                </div>
              </div>

              <h3>Tabella rapida (senza partecipazione)</h3>
              <div className="scroll">
                <table className="tbl qt">
                  <thead>
                    <tr>
                      <th scope="col" rowSpan={2}>
                        Pos.
                      </th>
                      <th scope="colgroup" colSpan={3}>
                        Collettivo
                      </th>
                      <th scope="colgroup" colSpan={3}>
                        Singolo
                      </th>
                    </tr>
                    <tr>
                      {["L1", "L2", "L3", "L1", "L2", "L3"].map((l, i) => (
                        <th scope="col" key={i}>
                          {l}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[10, 8, 6, 4, 2].map((p, i) => (
                      <tr key={p}>
                        <th scope="row">{i + 1}°</th>
                        {[2, 1].flatMap((t) => [1, 2, 3].map((l) => <td key={`${t}${l}`}>{p * l * t}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3>Regole</h3>
              <ul className="bul">
                <li>Prima di ogni attività vengono comunicati livello, tipo e se c&apos;è la partecipazione. Non si cambiano dopo.</li>
                <li>Ogni assegnazione viene registrata una sola volta e compare nello storico della classe sul sito.</li>
                <li>
                  A pari merito, le classi ricevono tutte i punti della posizione più alta. La posizione successiva viene saltata (due classi prime,
                  la successiva è terza).
                </li>
                <li>Sul sito compaiono solo le classi, mai i nomi degli studenti.</li>
              </ul>
            </div>
          </article>

          <article id="meriti">
            <span className="n" aria-hidden="true">04</span>
            <div>
              <h2>Riconoscimenti e meriti</h2>
              <p>
                I punti non arrivano solo vincendo una gara. Una classe o una squadra può riceverli anche per <b>collaborazione</b>, <b>aiuto</b>,{" "}
                <b>disponibilità</b> e <b>ottimo lavoro</b>: per aver dato una mano concreta, per aver svolto un lavoro particolarmente positivo o per
                aver contribuito alla riuscita di un&apos;iniziativa.
              </p>
              <p>Questi punti sono valutati dagli organizzatori e, come tutti gli altri, confluiscono nella classifica generale.</p>
            </div>
          </article>

          <article id="classifica">
            <span className="n" aria-hidden="true">05</span>
            <div>
              <h2>La classifica generale</h2>
              <p>
                Tutti i punti assegnati nelle diverse attività concorrono alla <Link href="/#classifica">classifica generale</Link> delle sei
                squadre. Il punteggio di una squadra è la somma dei punti di tutte le sue classi.
              </p>
              <p>La classifica si aggiorna dopo la registrazione dei risultati e dei punteggi di ogni sfida.</p>
              <p>
                Le squadre con gli stessi punti occupano la stessa posizione. Per l&apos;ordine di visualizzazione a pari punti {TIEBREAK}.
              </p>
              <p>
                Statistiche, record e i cinque riconoscimenti della <Link href="/hall-of-fame">Hall of Fame</Link> sono calcolati in automatico: servono a
                raccontare la stagione e non cambiano la classifica.
              </p>
            </div>
          </article>

          <article id="premio">
            <span className="n" aria-hidden="true">06</span>
            <div>
              <h2>Il premio finale</h2>
              <p>A conclusione della competizione verrà individuata la squadra vincitrice: quella con più punti nella classifica generale.</p>
              <p>
                <b>Il premio finale verrà reso noto più avanti.</b>
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
