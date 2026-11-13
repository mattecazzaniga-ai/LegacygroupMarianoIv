import Link from "next/link";
import { Dot, Icon, Logo, PageHead, SecH } from "@/components/ui";
import { BADGES } from "@/lib/calc/badges";
import { challengeWinners } from "@/lib/calc/records";
import { classSlug, TEAMS } from "@/lib/teams";
import { ALBO, CONFIG } from "@/lib/config";
import { fmt, fmtS } from "@/lib/dates";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";

export const revalidate = 60;
export const metadata = meta("Hall of Fame", "L'albo d'oro di Legacy Group: squadre vincitrici, vincitori delle sfide, record e riconoscimenti.", "/hall-of-fame");

export default async function Hall() {
  const { m, isFinal } = await getSite();
  const winners = isFinal ? m.now.filter((r) => r.pos === 1 && r.pts > 0) : [];
  const sfide = challengeWinners(m.teams, m.hist);
  const past = ALBO.filter((x) => TEAMS.some((t) => t.id === x.vincitrice));
  const holders = BADGES.map((b) => ({ b, own: m.teams.filter((g) => m.badgesOf(g).some((x) => x.id === b.id)) }));
  return (
    <div className="wrap">
      <section>
        <PageHead eyebrow="Albo d'oro" title="Hall of Fame" sub="Le squadre vincitrici, le sfide conquistate e i primati di Legacy Group." />
        <ol className="albo">
          <li className="cur">
            <span className="ed">2026/27</span>
            {winners.length ? (
              <div className="w">
                <Logo id={winners[0].team.id} width={56} />
                <div>
                  <span className="eyebrow gold">{winners.length > 1 ? "Vincitrici a pari merito" : "Squadra vincitrice"}</span>
                  <b>{winners.map((r) => r.team.name).join(" e ")}</b>
                  <span className="muted">{winners[0].pts} punti</span>
                </div>
              </div>
            ) : (
              <div className="w">
                <div>
                  <span className="eyebrow">Edizione in corso</span>
                  <b>Vincitrice da proclamare</b>
                  <span className="muted">Al termine della competizione, il {fmt(CONFIG.endDate)}. Il premio finale verrà reso noto più avanti.</span>
                </div>
              </div>
            )}
          </li>
          {past.map((x) => {
            const t = TEAMS.find((g) => g.id === x.vincitrice)!;
            return (
              <li key={x.edizione}>
                <span className="ed">{x.edizione}</span>
                <div className="w">
                  <Logo id={t.id} width={56} />
                  <div>
                    <span className="eyebrow gold">Squadra vincitrice</span>
                    <b>{t.name}</b>
                    {x.punti ? <span className="muted">{x.punti} punti</span> : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <SecH t="Riconoscimenti" sub="Cinque titoli assegnati in automatico, solo quando i dati bastano. Si conquistano e si perdono durante la stagione." />
        <ul className="bdg">
          {holders.map(({ b, own }) => (
            <li className={"bd" + (own.length ? " on" : "")} key={b.id}>
              <div className="ic">
                <Icon n={b.ic} />
              </div>
              <div>
                <h3>{b.name}</h3>
                <p>{b.rule}</p>
                {own.length ? (
                  <div className="own">
                    {own.map((g) => (
                      <Link className="chip" key={g.id} href={`/squadra/${g.id}`}>
                        <Dot team={g} />
                        {g.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="vacant">Non assegnato</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {sfide.length ? (
        <section>
          <SecH t="Vincitori delle sfide" sub="Tornei, quizzoni e prove che prevedono una squadra vincitrice, indicata dagli organizzatori." />
          <ul className="champs">
            {sfide.map((w) => (
              <li key={w.act.id}>
                <Logo id={w.teams[0].id} width={48} />
                <div className="c-main">
                  <div className="c-act">
                    {w.act.title}
                    {w.act.type ? <span className="badge">{w.act.type}</span> : null}
                  </div>
                  <Link className="c-team" href={`/squadra/${w.teams[0].id}`}>
                    {w.teams[0].name}
                  </Link>
                  <div className="muted">
                    {fmtS(w.act.date)}
                    {w.classes.length ? (
                      <>
                        {" "}
                        · miglior classe{" "}
                        {w.classes.map((c, i) => (
                          <span key={c}>
                            {i ? ", " : ""}
                            <Link href={`/classe/${classSlug(c)}`}>{c}</Link>
                          </span>
                        ))}{" "}
                        ({w.classPts} pt)
                      </>
                    ) : null}
                  </div>
                </div>
                {w.pts > 0 ? (
                  <div className="c-pts">
                    {w.pts}
                    <small>punti</small>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {m.records.length ? (
        <section>
          <SecH t="Record della stagione" sub="I primati di squadre e classi, aggiornati in automatico." />
          <ul className="recs">
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
        </section>
      ) : null}
    </div>
  );
}
