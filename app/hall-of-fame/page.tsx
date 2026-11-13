import Link from "next/link";
import { Dot, Icon, Logo, PageHead, SecH } from "@/components/ui";
import { BADGES } from "@/lib/calc/badges";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";

export const revalidate = 60;
export const metadata = meta("Hall of Fame", "I record della stagione e gli 8 badge di Legacy Group, aggiornati in automatico dai punti.", "/hall-of-fame");

export default async function Hall() {
  const { m } = await getSite();
  return (
    <div className="wrap">
      <section>
        <PageHead eyebrow="Record della stagione" title="Hall of Fame" sub="I primati di squadre e classi, aggiornati in automatico." />
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
        <SecH t="Badge" sub="Otto riconoscimenti automatici: si conquistano e si perdono con i punti." />
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
