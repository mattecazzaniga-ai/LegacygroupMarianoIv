import Link from "next/link";
import { Dot, Icon, Logo, PageHead, SecH } from "@/components/ui";
import { BADGES } from "@/lib/calc/badges";
import { CONFIG } from "@/lib/config";
import { fmt } from "@/lib/dates";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";

export const revalidate = 60;
export const metadata = meta("Hall of Fame", "L'albo d'oro di Legacy Group: squadra vincitrice, record della stagione e riconoscimenti.", "/hall-of-fame");

export default async function Hall() {
  const { m, isFinal } = await getSite();
  const winners = isFinal ? m.now.filter((r) => r.pos === 1 && r.pts > 0) : [];
  return (
    <div className="wrap">
      <section>
        <PageHead eyebrow="Albo d'oro" title="Hall of Fame" sub="I vincitori, i record e i riconoscimenti di Legacy Group." />
        <div className="gold-roll">
          <div className="ed">
            <span className="eyebrow">Edizione</span>
            <b>2026/27</b>
          </div>
          {winners.length ? (
            <div className="win">
              <Logo id={winners[0].team.id} width={64} />
              <div>
                <span className="eyebrow gold">{winners.length > 1 ? "Vincitrici a pari merito" : "Squadra vincitrice"}</span>
                <b>{winners.map((r) => r.team.name).join(" e ")}</b>
                <span className="muted">{winners[0].pts} punti</span>
              </div>
            </div>
          ) : (
            <div className="win">
              <div>
                <span className="eyebrow">Squadra vincitrice</span>
                <b>In corso</b>
                <span className="muted">Sarà proclamata al termine della competizione, il {fmt(CONFIG.endDate)}.</span>
              </div>
            </div>
          )}
          <div className="prize">
            <span className="eyebrow">Premio finale</span>
            <span>Sarà comunicato successivamente.</span>
          </div>
        </div>
      </section>
      <section>
        <SecH t="Record della stagione" sub="I primati di squadre e classi, aggiornati in automatico." />
        {m.records.length ? (
          <ul className="recs" style={{ listStyle: "none", padding: 0 }}>
            {m.records.map((r) => (
              <li className="rec" key={r.id}>
                <div>
                  <div className="k">{r.k}</div>
                  <div className="v">{r.v}</div>
                  <div className="n">{r.n}</div>
                  <div className="s">{r.s}</div>
                </div>
                <Logo id={r.team.id} width={44} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">
            I record si sbloccano con le prime attività: ogni primato viene registrato in automatico. Qui compaiono solo squadre e classi, mai nomi di studenti.
          </p>
        )}
      </section>
      <section>
        <SecH t="Riconoscimenti" sub="Otto badge automatici: si conquistano e si perdono con i punti." />
        <ul className="bdg" style={{ listStyle: "none", padding: 0 }}>
          {BADGES.map((b) => {
            const own = m.teams.filter((g) => m.badgesOf(g).some((x) => x.id === b.id));
            return (
              <li className="bd" key={b.id}>
                <div className="ic">
                  <Icon n={b.ic} />
                </div>
                <div>
                  <h3>{b.name}</h3>
                  <p>{b.rule}</p>
                  <div className="own">
                    {own.length ? (
                      own.map((g) => (
                        <Link className="chip" key={g.id} href={`/squadra/${g.id}`}>
                          <Dot team={g} />
                          {g.name}
                        </Link>
                      ))
                    ) : (
                      <span className="note" style={{ margin: 0 }}>
                        Nessuna squadra al momento
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
