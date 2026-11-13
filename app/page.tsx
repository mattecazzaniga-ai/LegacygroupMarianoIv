import Link from "next/link";
import { Board, CountdownBlock, MiniStats, MomentTeam, Recent, Upcoming, WeekPodium } from "@/components/blocks";
import { SecH } from "@/components/ui";
import { fmt } from "@/lib/dates";
import { getSite } from "@/lib/site";

export const revalidate = 60;

export default async function Home() {
  const { m, ds, startMs, endMs, nowMs, isFinal } = await getSite();
  const ms = m.moments[0];
  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div className="eyebrow">School Year 2026–2027</div>
          <h1>Legacy Group</h1>
          <div className="where">
            Mariano Quarto<span aria-hidden="true">◆</span>Oristano
          </div>
          <p className="tag">Six Teams. One Legacy.</p>
          <CountdownBlock m={m} startMs={startMs} endMs={endMs} nowMs={nowMs} isFinal={isFinal} />
          <div className="quick">
            <Link className="btn" href="/classifica">
              Classifica
            </Link>
            <Link className="btn ghost" href="/live">
              Live
            </Link>
            <Link className="btn ghost" href="/calendario">
              Calendario
            </Link>
          </div>
        </div>
      </header>
      <div className="wrap">
        <section aria-labelledby="h-classifica">
          <SecH
            id="h-classifica"
            t="Classifica"
            g="generale"
            sub={m.started ? m.acts.length + (m.acts.length === 1 ? " attività giocata" : " attività giocate") : "Si parte da zero: la prima attività verrà annunciata qui."}
          />
          <Board m={m} />
          <p style={{ marginTop: 14 }}>
            <Link className="btn ghost" href="/classifica">
              Classifica completa →
            </Link>
          </p>
        </section>
        <section>
          <SecH t="Podio della" g="settimana" sub="Le tre squadre con più punti negli ultimi 7 giorni." />
          <WeekPodium m={m} />
        </section>
        <section className="g2">
          <div>
            <SecH t="Squadra del" g="momento" sub="Chi sta andando più forte." />
            <div className="card">
              <MomentTeam m={m} />
            </div>
            <SecH t="Legacy" g="Moment" sub="L'ultimo momento importante." style={{ marginTop: 22 }} />
            <div className="card">
              {ms ? (
                <div className="act">
                  <div className="d">{fmt(ms.d)}</div>
                  <h3>{ms.t}</h3>
                  <p>{ms.s}</p>
                </div>
              ) : (
                <p className="empty">Sorpassi, record e traguardi compariranno qui.</p>
              )}
            </div>
          </div>
          <div>
            <SecH t="Prossime" g="attività" sub="In arrivo." />
            <div className="card">
              <Upcoming m={m} events={ds.events} />
            </div>
            <SecH t="Ultime" g="attività" sub="Le più recenti, con i punti assegnati." style={{ marginTop: 22 }} />
            <div className="card">
              <Recent m={m} n={2} />
            </div>
          </div>
        </section>
        <section>
          <SecH t="Statistiche" sub="La competizione in numeri." />
          <MiniStats m={m} />
          <p style={{ marginTop: 14 }}>
            <Link className="btn ghost" href="/statistiche">
              Tutte le statistiche →
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
