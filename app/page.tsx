import Link from "next/link";
import { Board, CountdownBlock, dateLabels, leaderIndex, MomentsList, Podium, teamSeries, Upcoming, WeekPodium } from "@/components/blocks";
import LineChart from "@/components/LineChart";
import { Logo, SecH } from "@/components/ui";
import { getSite } from "@/lib/site";

/** La pagina si rigenera ogni 60 secondi: la classifica segue il foglio da sola. */
export const revalidate = 60;

export default async function Home() {
  const { m, ds, startMs, endMs, nowMs, isFinal } = await getSite();
  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div className="hero-top">
            <div>
              <div className="eyebrow">Istituto Mariano IV · Oristano · 2026/27</div>
              <h1>
                Legacy <span>Group</span>
              </h1>
              <p className="tag">Sei squadre, quarantatré classi, un anno per lasciare il segno.</p>
            </div>
            <nav className="crests" aria-label="Le squadre">
              {m.teams.map((t) => (
                <Link key={t.id} href={`/squadra/${t.id}`} title={t.name}>
                  <Logo id={t.id} width={52} alt={t.name} sizes="(min-width: 960px) 128px, 52px" />
                </Link>
              ))}
            </nav>
          </div>
          <div className="hero-foot">
            <CountdownBlock m={m} startMs={startMs} endMs={endMs} nowMs={nowMs} isFinal={isFinal} />
            <div className="quick">
              <Link className="btn" href="/regolamento">
                Come funziona
              </Link>
              <Link className="btn ghost" href="/calendario">
                Calendario
              </Link>
            </div>
          </div>
        </div>
      </header>
      <div className="wrap">
        <section id="classifica" aria-labelledby="h-classifica" style={{ scrollMarginTop: 64 }}>
          <SecH
            id="h-classifica"
            t="Classifica generale"
            sub={
              m.started
                ? `Dopo ${m.acts.length} attività. A pari punti, stessa posizione; ▲▼ confronta con la classifica prima dell'ultima attività.`
                : "Si parte da zero: tutte le squadre a pari punti. La classifica si aggiorna da sola a ogni nuovo punteggio."
            }
          />
          <Podium m={m} />
          <Board m={m} detail />
        </section>
        {m.hist.length ? (
          <section>
            <SecH t="La corsa" sub="Punti accumulati attività dopo attività. Tocca una squadra per seguirla." more={{ href: "/statistiche", label: "Statistiche" }} />
            <LineChart mode="focus" focus={leaderIndex(m)} label="Punti cumulati per squadra" labels={dateLabels(m)} series={teamSeries(m)} />
          </section>
        ) : null}
        <section className="g2">
          <div>
            <SecH t="Podio della settimana" sub="Chi ha fatto più punti negli ultimi 7 giorni." />
            <WeekPodium m={m} />
          </div>
          <div>
            <SecH t="Legacy Moment" sub="Sorpassi, record e traguardi, rilevati in automatico." />
            <MomentsList m={m} n={4} />
          </div>
        </section>
        <section>
          <SecH t="Prossimi appuntamenti" more={{ href: "/calendario", label: "Calendario" }} />
          <Upcoming m={m} events={ds.events} />
        </section>
      </div>
    </>
  );
}
