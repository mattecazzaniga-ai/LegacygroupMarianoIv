import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgesRow, dateLabels } from "@/components/blocks";
import LineChart from "@/components/LineChart";
import { Logo, SecH, StatGrid, Variation } from "@/components/ui";
import { actPts, classPts, variation, winnersOf } from "@/lib/calc/core";
import { avgShare, placeIn, teamAvg } from "@/lib/calc/stats";
import { rangePts } from "@/lib/calc/week";
import { fmtS } from "@/lib/dates";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";
import { chartColor, classSlug, TEAMS } from "@/lib/teams";

export const revalidate = 60;
export const dynamicParams = false;
export const generateStaticParams = () => TEAMS.map((t) => ({ id: t.id }));

type P = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: P) {
  const { id } = await params;
  const t = TEAMS.find((x) => x.id === id);
  if (!t) return {};
  return meta(
    t.name,
    `${t.name} (${t.cname.toLowerCase()}): posizione, punti, risultati, andamento e classi della squadra in Legacy Group.`,
    `/squadra/${t.id}`,
  );
}

const pl = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function Squadra({ params }: P) {
  const { id } = await params;
  const { m } = await getSite();
  const g = m.teams.find((t) => t.id === id);
  if (!g) notFound();
  const r = m.now.find((x) => x.team.id === g.id)!;
  const color = chartColor(g);
  const av = teamAvg(g, m.acts, m.teamOf);
  const leader = m.now[0];
  const gap = leader.team.id === g.id ? (m.now[1] ? r.pts - m.now[1].pts : 0) : leader.pts - r.pts;
  const w7 = rangePts(g, m.acts, m.teamOf, m.windows.W0);
  const w14 = rangePts(g, m.acts, m.teamOf, m.windows.W1, m.windows.W0);
  const share = avgShare(g, m.acts, m.teamOf);

  // risultati più importanti: sfide vinte, poi i migliori piazzamenti (primi tre posti)
  const results = m.hist
    .map((h) => ({ h, won: winnersOf(h, m.teams).some((t) => t.id === g.id), place: placeIn(h, g, m.teams), pts: h.ap[g.id] }))
    .filter((x) => x.won || (x.place !== null && x.place <= 3))
    .sort((a, b) => Number(b.won) - Number(a.won) || (a.place ?? 9) - (b.place ?? 9) || b.pts - a.pts || b.h.a.date.localeCompare(a.h.a.date))
    .slice(0, 4);

  // ultime attività in cui la squadra ha preso punti
  const recent = [...m.acts]
    .reverse()
    .filter((a) => actPts(a, g, m.teamOf) !== 0)
    .slice(0, 5)
    .map((a) => ({ a, pts: actPts(a, g, m.teamOf), aw: a.awards.filter((w) => m.teamOf[w.cls]?.id === g.id) }));

  const cl = g.classes
    .map((c) => ({ c, t: classPts(c, m.acts), i: classPts(c, m.acts, "individuale"), k: classPts(c, m.acts, "collettiva") }))
    .sort((a, b) => b.t - a.t || a.c.localeCompare(b.c));

  return (
    <div className="wrap" style={{ ["--tc" as string]: color }}>
      <section className="team-hero">
        <Link className="back" href="/squadre">
          ← Tutte le squadre
        </Link>
        <div className="thead">
          <Logo id={g.id} width={132} alt={`Stemma ${g.name}`} priority />
          <div>
            <div className="eyebrow">
              <span className="tc-dot" aria-hidden="true" />
              {g.cname} · {g.classes.length} classi
            </div>
            <h1>{g.name}</h1>
            <BadgesRow m={m} team={g} />
          </div>
        </div>
        <StatGrid
          items={
            !m.started
              ? [
                  [0, "punti totali"],
                  [g.classes.length, "classi"],
                  [0, "attività con punti"],
                  [g.cname, "colore"],
                ]
              : [
                  [r.pos + "°", "posizione"],
                  [r.pts, "punti totali"],
                  [
                    leader.team.id === g.id ? (gap > 0 ? "+" + gap : "pari") : "−" + gap,
                    leader.team.id === g.id ? "vantaggio sulla seconda" : "dalla prima",
                  ],
                  [av.n, "attività con punti"],
                ]
          }
        />
      </section>

      {m.started ? (
        <section>
          <SecH t="Andamento recente" />
          <dl className="trend">
            <div>
              <dt>Ultimi 7 giorni</dt>
              <dd>
                <b>{w7}</b> punti
                <span className="muted">{w14 ? ` · ${w14} nei 7 giorni prima` : ""}</span>
              </dd>
            </div>
            {m.prevPos ? (
              <div>
                <dt>In classifica</dt>
                <dd>
                  <Variation d={variation(m.prevPos, g.id, r.pos)} />
                  <span className="muted"> rispetto a prima dell&apos;ultima giornata</span>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Media</dt>
              <dd>
                <b>{av.avg}</b> punti per attività
                <span className="muted"> · su {pl(av.n, "attività", "attività")} con punti</span>
              </dd>
            </div>
            <div>
              <dt>Quota media</dt>
              <dd>
                <b>{Math.round(share * 100)}%</b> dei punti di ogni sfida
                <span className="muted"> · ogni sfida pesa uguale, qualunque sia il suo punteggio</span>
              </dd>
            </div>
          </dl>
          {m.hist.length > 1 ? (
            <div style={{ marginTop: 24 }}>
              <LineChart
                label={`Punti cumulati di ${g.name}`}
                labels={dateLabels(m)}
                series={[
                  { name: g.name, color, vals: [0, ...m.hist.map((h) => h.pts[g.id])] },
                  ...(leader.team.id === g.id
                    ? []
                    : [{ name: "Prima in classifica", color: "", ref: true, vals: [0, ...m.hist.map((h) => h.st[0].pts)] }]),
                ]}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {results.length ? (
        <section>
          <SecH t="Risultati più importanti" sub="Sfide vinte e migliori piazzamenti nelle singole attività." />
          <ul className="results">
            {results.map(({ h, won, place, pts }) => (
              <li key={h.a.id}>
                <span className={"medal-n" + (won ? " won" : place ? " m" + place : "")}>{won ? "1°" : place + "°"}</span>
                <div>
                  <b>{h.a.title}</b>
                  <span className="muted">
                    {fmtS(h.a.date)}
                    {h.a.type ? " · " + h.a.type : ""}
                  </span>
                </div>
                <span className="res-tag">{won ? "Vincitrice" : `${pts} punti`}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recent.length ? (
        <section>
          <SecH t="Ultime attività con punti" />
          <ul className="recent">
            {recent.map(({ a, pts, aw }) => (
              <li key={a.id}>
                <div className="rh">
                  <div>
                    <b>{a.title}</b>
                    <span className="muted">
                      {fmtS(a.date)}
                      {a.type ? " · " + a.type : ""}
                    </span>
                  </div>
                  <span className="rp">
                    {pts > 0 ? "+" : ""}
                    {pts}
                  </span>
                </div>
                <div className="chips">
                  {aw.map((w, i) => (
                    <span className="chip" key={i}>
                      <Link href={`/classe/${classSlug(w.cls)}`}>{w.cls}</Link>
                      <b>
                        {w.pts > 0 ? "+" : ""}
                        {w.pts}
                      </b>
                      <span className="k">{w.kind === "individuale" ? "ind." : "coll."}</span>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <SecH t="Le classi" sub={`${g.classes.length} classi${m.started ? ", ordinate per punti" : ""}.`} />
        <div className="classes">
          {cl.map((x) => (
            <Link key={x.c} className="cc" href={`/classe/${classSlug(x.c)}`}>
              <div className="top">
                <span className="code">{x.c}</span>
                <span className="tot">
                  {x.t}
                  <small>pt</small>
                </span>
              </div>
              {x.t || x.i || x.k ? (
                <div className="split">
                  <span>
                    Individuali <b>{x.i}</b>
                  </span>
                  <span>
                    Collettivi <b>{x.k}</b>
                  </span>
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
