import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgesRow, dateLabels } from "@/components/blocks";
import LineChart from "@/components/LineChart";
import { Logo, StatGrid } from "@/components/ui";
import { classPts, teamActs } from "@/lib/calc/core";
import { rangePts } from "@/lib/calc/week";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";
import { chartColor, chartDash, classSlug, TEAMS } from "@/lib/teams";

export const revalidate = 60;
export const dynamicParams = false;
export const generateStaticParams = () => TEAMS.map((t) => ({ id: t.id }));

type P = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: P) {
  const { id } = await params;
  const t = TEAMS.find((x) => x.id === id);
  if (!t) return {};
  return meta(t.name, `${t.name} (${t.cname.toLowerCase()}): punti, posizione, badge e classi della squadra in Legacy Group.`, `/squadra/${t.id}`);
}

export default async function Squadra({ params }: P) {
  const { id } = await params;
  const { m } = await getSite();
  const g = m.teams.find((t) => t.id === id);
  if (!g) notFound();
  const r = m.now.find((x) => x.team.id === g.id)!;
  const cl = g.classes
    .map((c) => ({ c, t: classPts(c, m.acts), i: classPts(c, m.acts, "individuale"), k: classPts(c, m.acts, "collettiva") }))
    .sort((a, b) => b.t - a.t || a.c.localeCompare(b.c));
  return (
    <div className="wrap">
      <section>
        <Link className="back" href="/squadre">
          ← Tutte le squadre
        </Link>
        <div className="thead">
          <Logo id={g.id} width={120} alt={`Stemma ${g.name}`} priority />
          <div>
            <div className="eyebrow">
              {m.started ? r.pos + "° in classifica" : "Squadra"} · {g.cname}
            </div>
            <h1>{g.name}</h1>
          </div>
        </div>
        <StatGrid
          items={[
            [m.started ? r.pos + "°" : "–", "posizione"],
            [r.pts, "punti totali"],
            [rangePts(g, m.acts, m.teamOf, m.windows.W0), "punti ultima settimana"],
            [teamActs(g, m.acts, m.teamOf), "attività completate"],
          ]}
        />
        <div style={{ marginTop: 14 }}>
          <BadgesRow m={m} team={g} />
        </div>
      </section>
      <section>
        <h2>
          Punti <span className="g">nel tempo</span>
        </h2>
        <LineChart
          label={`Punti cumulati di ${g.name}`}
          labels={dateLabels(m)}
          series={[
            { name: g.name, color: chartColor(g), dash: chartDash(g), vals: [0, ...m.hist.map((h) => h.pts[g.id])] },
            { name: "Prima in classifica", color: "#d4ad55", dash: "3 4", vals: [0, ...m.hist.map((h) => h.st[0].pts)] },
          ]}
        />
      </section>
      <section>
        <h2>
          Le <span className="g">classi</span>
        </h2>
        <p className="sub">{g.classes.length} classi. Tocca una classe per vedere il suo storico.</p>
        <div className="classes">
          {cl.map((x) => {
            const last = [...m.acts]
              .reverse()
              .flatMap((a) => a.awards.filter((w) => w.cls === x.c).map((w) => ({ a, w })))
              .slice(0, 2);
            return (
              <Link key={x.c} className="cc" href={`/classe/${classSlug(x.c)}`}>
                <span className="tot">{x.t}</span>
                <span className="code">{x.c}</span>
                <div className="split">
                  <span>
                    Individuali <b>{x.i}</b>
                  </span>
                  <span>
                    Collettivi <b>{x.k}</b>
                  </span>
                </div>
                {last.length ? (
                  last.map(({ a, w }, i) => (
                    <div className="last" key={i}>
                      +{w.pts} · {a.title}
                    </div>
                  ))
                ) : (
                  <div className="last" style={{ color: "var(--muted)" }}>
                    Ancora nessun punto
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
