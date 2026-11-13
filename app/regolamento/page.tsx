import Link from "next/link";
import { PageHead } from "@/components/ui";
import { CONFIG } from "@/lib/config";
import { meta } from "@/lib/meta";
import { TEAMS } from "@/lib/teams";

export const metadata = meta(
  "Regolamento",
  "Come funziona Legacy Group: squadre, tipologie di sfide, punteggi variabili da attività ad attività, riconoscimenti, classifica generale e premio finale.",
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
            <li><a href="#punti">Il punteggio</a></li>
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
                Date e appuntamenti sono pubblicati nel <Link href="/calendario">calendario</Link>.
              </p>
            </div>
          </article>

          <article id="punti">
            <span className="n" aria-hidden="true">03</span>
            <div>
              <h2>Il punteggio</h2>
              <p>
                <b>Non esiste una tabella di punti uguale per tutte le sfide.</b> Ogni attività ha il proprio sistema di assegnazione, stabilito in
                base al tipo di prova, alla sua difficoltà, agli obiettivi e ai criteri di valutazione. Per questo i punti possono cambiare anche
                molto da una sfida all&apos;altra.
              </p>
              <p>I criteri e i punti in palio vengono definiti e comunicati per ciascuna attività.</p>
              <p>
                I punti vanno sempre alle <b>classi</b> e da lì alla loro squadra. Possono essere <b>collettivi</b>, assegnati a tutta la classe, o{" "}
                <b>individuali</b>, ottenuti da uno studente e attribuiti alla sua classe. Sul sito compaiono solo le sigle delle classi, mai i
                nomi degli studenti.
              </p>
              <p>Ogni assegnazione viene registrata una sola volta, così nessun punto viene contato due volte.</p>
            </div>
          </article>

          <article id="meriti">
            <span className="n" aria-hidden="true">04</span>
            <div>
              <h2>Riconoscimenti e meriti</h2>
              <p>
                I punti non arrivano solo vincendo una gara. Una classe o una squadra può riceverli anche per aver dato un aiuto importante, per
                aver svolto un lavoro particolarmente positivo o per aver contribuito in modo concreto alla riuscita di un&apos;iniziativa.
              </p>
              <p>Questi riconoscimenti sono valutati dagli organizzatori.</p>
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
              <p>Statistiche, record e badge sono calcolati in automatico dai punti: servono a raccontare la stagione e non cambiano la classifica.</p>
            </div>
          </article>

          <article id="premio">
            <span className="n" aria-hidden="true">06</span>
            <div>
              <h2>Il premio finale</h2>
              <p>A conclusione della competizione verrà individuata la squadra vincitrice: quella con più punti nella classifica generale.</p>
              <p>
                <b>Il premio finale sarà comunicato successivamente</b>: tipologia, caratteristiche e modalità di assegnazione verranno rese note
                dagli organizzatori.
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
