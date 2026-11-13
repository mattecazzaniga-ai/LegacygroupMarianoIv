"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { allClasses, classPts, sum } from "@/lib/calc/core";
import { winsOf } from "@/lib/calc/badges";
import { avgShare, bestBy, classAvg, ptsByType, teamAvg } from "@/lib/calc/stats";
import { buildModel } from "@/lib/calc/model";
import { fmtS } from "@/lib/dates";
import { chartColor, classSlug } from "@/lib/teams";
import type { Activity, Team, Tiebreak } from "@/lib/types";
import LineChart from "./LineChart";
import { Dot, HBars, Icon, Logo, ord, StatGrid } from "./ui";

type Tab = "gen" | "team" | "cls";
const H3 = ({ children, first }: { children: React.ReactNode; first?: boolean }) => (
  <h2 style={{ fontSize: 22, margin: first ? "0 0 12px" : "36px 0 12px" }}>{children}</h2>
);

export default function StatsView({
  teams,
  acts,
  today,
  tiebreak,
  focus,
  bars,
}: {
  teams: Team[];
  acts: Activity[];
  today: string;
  tiebreak: Tiebreak;
  focus: number;
  /** grafico a barre già pronto dal server */
  bars: React.ReactNode;
}) {
  const m = useMemo(() => buildModel({ teams, acts, tiebreak, today }), [teams, acts, tiebreak, today]);
  const CLS = allClasses(teams);
  const [tab, setTab] = useState<Tab>("gen");
  const [teamId, setTeamId] = useState(teams[focus]?.id ?? teams[0].id);
  const [cls, setCls] = useState(CLS[0]);
  const labels = ["Inizio", ...acts.map((a) => fmtS(a.date))];

  const tabs: [Tab, string][] = [
    ["gen", "Generale"],
    ["team", "Squadra"],
    ["cls", "Classe"],
  ];

  let body: React.ReactNode;
  if (tab === "gen") {
    const total = sum(acts.flatMap((a) => a.awards.map((w) => w.pts)));
    const avg = acts.length ? Math.round((total / acts.length) * 10) / 10 : 0;
    const ind = sum(acts.flatMap((a) => a.awards.filter((w) => w.kind === "individuale").map((w) => w.pts)));
    const col = total - ind;
    const types = ptsByType(acts);
    const cAvg = CLS.map((c) => ({ c, a: classAvg(c, acts) }));
    const tops = cAvg
      .filter((x) => x.a.pts > 0)
      .sort((a, b) => b.a.pts - a.a.pts || a.c.localeCompare(b.c))
      .slice(0, 10);
    const withPts = cAvg.filter((x) => x.a.n > 0).length;
    const perf = m.now.map((r) => ({ t: r.team, pts: r.pts, a: teamAvg(r.team, acts, m.teamOf), share: avgShare(r.team, acts, m.teamOf) }));
    const bestT = bestBy(perf);
    const bestC = bestBy(cAvg);
    const bestShare = Math.max(...perf.map((p) => p.share));
    body = (
      <>
        <StatGrid
          items={[
            [total, "punti assegnati"],
            [acts.length, "attività con punti"],
            [avg, "punti medi per attività"],
            [withPts + " / " + CLS.length, "classi con punti"],
          ]}
        />
        {!acts.length ? (
          <p className="empty" style={{ marginTop: 20 }}>
            Grafici e confronti compaiono con le prime attività a punti.
          </p>
        ) : (
          <>
            <div className="best2">
              {bestT ? (
                <Link className="bestc" href={`/squadra/${bestT.t.id}`}>
                  <Logo id={bestT.t.id} width={44} />
                  <div>
                    <span className="eyebrow">Miglior squadra per media</span>
                    <b>{bestT.t.name}</b>
                    <span className="muted">
                      {bestT.a.avg} punti per attività · su {bestT.a.n} attività con punti
                    </span>
                  </div>
                </Link>
              ) : null}
              {bestC ? (
                <Link className="bestc" href={`/classe/${classSlug(bestC.c)}`}>
                  <Logo id={m.teamOf[bestC.c].id} width={44} />
                  <div>
                    <span className="eyebrow">Miglior classe per media</span>
                    <b>Classe {bestC.c}</b>
                    <span className="muted">
                      {bestC.a.avg} punti per attività · su {bestC.a.n} attività con punti
                    </span>
                  </div>
                </Link>
              ) : null}
            </div>
            <p className="note">
              Media = punti ÷ attività in cui si sono presi punti. Si confrontano prima le squadre e le classi con almeno 2 attività, così una singola sfida
              molto ricca non falsa il confronto.
            </p>

            <H3>Andamento dei punteggi</H3>
            <LineChart
              mode="focus"
              focus={focus}
              label="Punti cumulati per squadra"
              labels={labels}
              series={teams.map((g) => ({ name: g.name, color: chartColor(g), vals: [0, ...m.hist.map((h) => h.pts[g.id])] }))}
            />

            <H3>Rendimento delle squadre</H3>
            <div className="scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Squadra</th>
                    <th scope="col">Punti</th>
                    <th scope="col">Attività</th>
                    <th scope="col">Media</th>
                    <th scope="col">Quota</th>
                  </tr>
                </thead>
                <tbody>
                  {perf.map((p) => (
                    <tr key={p.t.id}>
                      <td>
                        <Link className="tn" href={`/squadra/${p.t.id}`}>
                          <Dot team={p.t} />
                          {p.t.name}
                        </Link>
                      </td>
                      <td>
                        <b>{p.pts}</b>
                      </td>
                      <td>{p.a.n}</td>
                      <td className={bestT && bestT.t.id === p.t.id ? "hi" : ""}>{p.a.avg}</td>
                      <td className={p.share > 0 && p.share === bestShare ? "hi" : ""}>{Math.round(p.share * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note">
              Le sfide non valgono tutte gli stessi punti. Per confrontare in modo omogeneo, la <b>quota</b> è la parte media dei punti di ogni sfida presa
              dalla squadra: ogni attività pesa uguale, qualunque sia il suo punteggio. Le sei quote sommano a 100%.
            </p>

            <H3>Punti per attività</H3>
            {bars}
            <p className="note">Ogni sfida ha il suo sistema di punteggio: le barre mostrano quanti punti ha assegnato ciascuna.</p>

            <div className="g2" style={{ marginTop: 36 }}>
              <div>
                <H3 first>Per tipologia di attività</H3>
                <HBars rows={types.map((x) => ({ name: x.type, v: x.pts, color: "#d8b25e", txt: x.pts }))} />
                <p className="note">
                  {types.map((x) => `${x.type}: ${x.n} ${x.n === 1 ? "attività" : "attività"}`).join(" · ")}
                </p>
              </div>
              <div>
                <H3 first>Collettivi e individuali</H3>
                <HBars
                  rows={[
                    { name: "Collettivi", v: col, color: "#d8b25e" },
                    { name: "Individuali", v: ind, color: "#8fb3e0" },
                  ]}
                />
              </div>
            </div>

            <H3>Le prime 10 classi</H3>
            <div className="scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Classe</th>
                    <th scope="col">Squadra</th>
                    <th scope="col">Attività</th>
                    <th scope="col">Media</th>
                    <th scope="col">Totale</th>
                  </tr>
                </thead>
                <tbody>
                  {tops.map((x) => (
                    <tr key={x.c}>
                      <td>
                        <Link href={`/classe/${classSlug(x.c)}`}>
                          <b>{x.c}</b>
                        </Link>
                      </td>
                      <td>
                        <span className="tn" title={m.teamOf[x.c].name}>
                          <Dot team={m.teamOf[x.c]} />
                          <span className="tnm">{m.teamOf[x.c].name}</span>
                        </span>
                      </td>
                      <td>{x.a.n}</td>
                      <td>{x.a.avg}</td>
                      <td>
                        <b>{x.a.pts}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </>
    );
  } else if (tab === "team") {
    const g = teams.find((t) => t.id === teamId)!;
    const r = m.now.find((x) => x.team.id === g.id)!;
    const wins = winsOf(g, { hist: m.hist, teams });
    const av = teamAvg(g, acts, m.teamOf);
    const share = avgShare(g, acts, m.teamOf);
    const types = ptsByType(acts, (c) => m.teamOf[c]?.id === g.id);
    const cl = g.classes.map((c) => ({ c, v: classPts(c, acts) })).sort((a, b) => b.v - a.v || a.c.localeCompare(b.c));
    const badges = m.badgesOf(g);
    const isLeader = m.now[0].team.id === g.id;
    body = (
      <>
        <div className="filters">
          <label>
            Squadra
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              {teams.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="thead">
          <Logo id={g.id} width={72} />
          <div>
            <div className="eyebrow">{m.started ? ord(r.pos) + " in classifica" : "Squadra"}</div>
            <h2 style={{ fontSize: 30, marginTop: 6 }}>{g.name}</h2>
          </div>
        </div>
        <StatGrid
          items={[
            [r.pts, "punti totali"],
            [av.avg, `media su ${av.n} attività`],
            [Math.round(share * 100) + "%", "quota media per sfida"],
            [wins, "sfide vinte"],
          ]}
        />
        <H3>Punti nel tempo</H3>
        <LineChart
          label={`Punti cumulati di ${g.name}`}
          labels={labels}
          series={[
            { name: g.name, color: chartColor(g), vals: [0, ...m.hist.map((h) => h.pts[g.id])] },
            ...(isLeader ? [] : [{ name: "Prima in classifica", color: "", ref: true, vals: [0, ...m.hist.map((h) => h.st[0].pts)] }]),
          ]}
        />
        <div className="g2" style={{ marginTop: 36 }}>
          <div>
            <H3 first>Punti per classe</H3>
            <HBars rows={cl.map((x) => ({ name: x.c, v: x.v, color: chartColor(g) }))} />
          </div>
          <div>
            <H3 first>Per tipologia</H3>
            {types.length ? (
              <HBars rows={types.map((x) => ({ name: x.type, v: x.pts, color: chartColor(g) }))} />
            ) : (
              <p className="empty">Ancora nessun punto.</p>
            )}
            <H3>Riconoscimenti</H3>
            {badges.length ? (
              <div className="own" style={{ marginTop: 0 }}>
                {badges.map((b) => (
                  <span className="chip" key={b.id} title={b.rule}>
                    <Icon n={b.ic} size={14} /> {b.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty">Nessun riconoscimento al momento.</p>
            )}
          </div>
        </div>
      </>
    );
  } else {
    const g = m.teamOf[cls];
    const v = classPts(cls, acts);
    const pos = 1 + CLS.filter((x) => classPts(x, acts) > v).length;
    const posT = 1 + g.classes.filter((x) => classPts(x, acts) > v).length;
    const ca = classAvg(cls, acts);
    const cum = [0];
    m.hist.forEach((h) => cum.push(cum[cum.length - 1] + sum(h.a.awards.filter((w) => w.cls === cls).map((w) => w.pts))));
    const avgSeries = [0];
    m.hist.forEach((_, i) => avgSeries.push(Math.round((sum(g.classes.map((x) => classPts(x, acts.slice(0, i + 1)))) / g.classes.length) * 10) / 10));
    body = (
      <>
        <div className="filters">
          <label>
            Classe
            <select value={cls} onChange={(e) => setCls(e.target.value)}>
              {teams.map((t) => (
                <optgroup key={t.id} label={t.name}>
                  {[...t.classes].sort().map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
        <div className="thead">
          <Logo id={g.id} width={72} />
          <div>
            <div className="eyebrow">{g.name}</div>
            <h2 style={{ fontSize: 30, marginTop: 6 }}>Classe {cls}</h2>
          </div>
        </div>
        <StatGrid
          items={[
            [v, "punti totali"],
            [v ? ord(pos) + " su " + CLS.length : "–", "nella scuola"],
            [v ? ord(posT) + " su " + g.classes.length : "–", "nella squadra"],
            [ca.avg, `media su ${ca.n} attività`],
          ]}
        />
        <H3>Punti nel tempo</H3>
        <LineChart
          label={`Punti cumulati della classe ${cls}`}
          labels={labels}
          series={[
            { name: cls, color: chartColor(g), vals: cum },
            { name: "Media della squadra", color: "", ref: true, vals: avgSeries },
          ]}
        />
        <p style={{ marginTop: 16 }}>
          <Link className="link" href={`/classe/${classSlug(cls)}`}>
            Storico della classe {cls}
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="seg" role="tablist" aria-label="Tipo di statistiche">
        {tabs.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>
      <div role="tabpanel">{body}</div>
    </>
  );
}
