"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { allClasses, classPts, sum, teamActs, winnersOf } from "@/lib/calc/core";
import { buildModel } from "@/lib/calc/model";
import { rangePts } from "@/lib/calc/week";
import { fmtS } from "@/lib/dates";
import { chartColor, chartDash, classSlug } from "@/lib/teams";
import type { Activity, Team, Tiebreak } from "@/lib/types";
import LineChart from "./LineChart";
import { Dot, HBars, Icon, Logo, ord, StatGrid } from "./ui";

type Tab = "gen" | "team" | "cls";

export default function StatsView({
  teams,
  acts,
  today,
  tiebreak,
  bars,
}: {
  teams: Team[];
  acts: Activity[];
  today: string;
  tiebreak: Tiebreak;
  /** grafico a barre già pronto dal server */
  bars: React.ReactNode;
}) {
  const m = useMemo(() => buildModel({ teams, acts, tiebreak, today }), [teams, acts, tiebreak, today]);
  const CLS = allClasses(teams);
  const [tab, setTab] = useState<Tab>("gen");
  const [teamId, setTeamId] = useState(teams[0].id);
  const [cls, setCls] = useState(CLS[0]);
  const labels = ["Inizio", ...acts.map((a) => fmtS(a.date))];

  const tabs: [Tab, string][] = [
    ["gen", "Generale"],
    ["team", "Per squadra"],
    ["cls", "Per classe"],
  ];

  let body: React.ReactNode;
  if (tab === "gen") {
    const total = sum(acts.flatMap((a) => a.awards.map((w) => w.pts)));
    const avg = acts.length ? Math.round((total / acts.length) * 10) / 10 : 0;
    const ind = sum(acts.flatMap((a) => a.awards.filter((w) => w.kind === "individuale").map((w) => w.pts)));
    const col = total - ind;
    const types: Record<string, number> = {};
    acts.forEach((a) => a.type && (types[a.type] = (types[a.type] || 0) + 1));
    const topT = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
    const tops = CLS.map((c) => ({ c, v: classPts(c, acts) }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v || a.c.localeCompare(b.c))
      .slice(0, 10);
    const withPts = new Set(acts.flatMap((a) => a.awards.map((w) => w.cls))).size;
    const tot = Math.max(1, total);
    body = (
      <>
        <StatGrid
          items={[
            [acts.length, "attività svolte"],
            [total, "punti assegnati"],
            [avg, "punti medi per attività"],
            [withPts + " / " + CLS.length, "classi con punti"],
          ]}
        />
        <h2 style={{ marginTop: 26 }}>
          Punti <span className="g">nel tempo</span>
        </h2>
        <p className="sub">Andamento di ogni squadra attività dopo attività. Tocca il grafico per i dettagli, tocca una squadra nella legenda per nasconderla.</p>
        <LineChart
          label="Punti cumulati per squadra"
          labels={labels}
          series={teams.map((g) => ({ name: g.name, color: chartColor(g), dash: chartDash(g), vals: [0, ...m.hist.map((h) => h.pts[g.id])] }))}
        />
        <h2 style={{ marginTop: 26 }}>
          Punti per <span className="g">attività</span>
        </h2>
        <p className="sub">Quanti punti sono stati assegnati in ogni attività.</p>
        {bars}
        <h2 style={{ marginTop: 26 }}>
          Peso di <span className="g">ogni squadra</span>
        </h2>
        <p className="sub">Quota sul totale dei punti assegnati.</p>
        <div className="card">
          <HBars rows={m.now.map((r) => ({ name: r.team.name, v: r.pts, color: chartColor(r.team), txt: total ? Math.round((r.pts / tot) * 100) + "%" : "0%" }))} />
        </div>
        <h2 style={{ marginTop: 26 }}>
          Individuali e <span className="g">collettivi</span>
        </h2>
        <div className="card">
          <HBars
            rows={[
              { name: "Collettivi", v: col, color: "#d4ad55" },
              { name: "Individuali", v: ind, color: "#9fb6d6" },
            ]}
          />
          {topT ? (
            <p className="note">
              Tipologia più frequente: <b>{topT[0]}</b> ({topT[1]} attività).
            </p>
          ) : null}
        </div>
        <h2 style={{ marginTop: 26 }}>
          Le prime <span className="g">10 classi</span>
        </h2>
        <div className="card scroll">
          {tops.length ? (
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Classe</th>
                  <th scope="col">Squadra</th>
                  <th scope="col">Ind.</th>
                  <th scope="col">Coll.</th>
                  <th scope="col">Tot.</th>
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
                      <span className="tn">
                        <Dot team={m.teamOf[x.c]} />
                        {m.teamOf[x.c].name}
                      </span>
                    </td>
                    <td>{classPts(x.c, acts, "individuale")}</td>
                    <td>{classPts(x.c, acts, "collettiva")}</td>
                    <td>
                      <b>{x.v}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">Ancora nessuna classe con punti.</p>
          )}
        </div>
      </>
    );
  } else if (tab === "team") {
    const g = teams.find((t) => t.id === teamId)!;
    const r = m.now.find((x) => x.team.id === g.id)!;
    const wins = m.hist.filter((h) => winnersOf(h, teams).some((t) => t.id === g.id)).length;
    const n = teamActs(g, acts, m.teamOf);
    const avg = n ? Math.round((r.pts / n) * 10) / 10 : 0;
    const cl = g.classes.map((c) => ({ c, v: classPts(c, acts) })).sort((a, b) => b.v - a.v || a.c.localeCompare(b.c));
    const badges = m.badgesOf(g);
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
            <h2 style={{ fontSize: 34, margin: 0 }}>{g.name}</h2>
          </div>
        </div>
        <StatGrid
          items={[
            [r.pts, "punti totali"],
            [wins, "attività vinte"],
            [avg, "media per attività"],
            [rangePts(g, acts, m.teamOf, m.windows.W0), "punti in 7 giorni"],
          ]}
        />
        <h2 style={{ marginTop: 22 }}>
          Punti <span className="g">nel tempo</span>
        </h2>
        <LineChart
          label={`Punti cumulati di ${g.name}`}
          labels={labels}
          series={[
            { name: g.name, color: chartColor(g), dash: chartDash(g), vals: [0, ...m.hist.map((h) => h.pts[g.id])] },
            { name: "Prima in classifica", color: "#d4ad55", dash: "3 4", vals: [0, ...m.hist.map((h) => h.st[0].pts)] },
          ]}
        />
        <h2 style={{ marginTop: 22 }}>
          Punti per <span className="g">classe</span>
        </h2>
        <div className="card">
          <HBars rows={cl.map((x) => ({ name: x.c, v: x.v, color: chartColor(g) }))} />
        </div>
        <h2 style={{ marginTop: 22 }}>Badge</h2>
        <div className="card">
          {badges.length ? (
            <div className="own">
              {badges.map((b) => (
                <span className="chip" key={b.id} title={b.rule}>
                  <Icon n={b.ic} size={16} /> {b.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="empty" style={{ margin: 0 }}>
              Nessun badge per ora.
            </p>
          )}
        </div>
      </>
    );
  } else {
    const g = m.teamOf[cls];
    const v = classPts(cls, acts);
    const pos = 1 + CLS.filter((x) => classPts(x, acts) > v).length;
    const posT = 1 + g.classes.filter((x) => classPts(x, acts) > v).length;
    const avgT = Math.round((sum(g.classes.map((x) => classPts(x, acts))) / g.classes.length) * 10) / 10;
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
            <h2 style={{ fontSize: 34, margin: 0 }}>{cls}</h2>
          </div>
        </div>
        <StatGrid
          items={[
            [v, "punti totali"],
            [v ? ord(pos) + " / " + CLS.length : "–", "nella scuola"],
            [v ? ord(posT) + " / " + g.classes.length : "–", "nella squadra"],
            [avgT, "media della squadra"],
          ]}
        />
        <h2 style={{ marginTop: 22 }}>
          Punti <span className="g">nel tempo</span>
        </h2>
        <LineChart
          label={`Punti cumulati della classe ${cls}`}
          labels={labels}
          series={[
            { name: cls, color: chartColor(g), dash: chartDash(g), vals: cum },
            { name: "Media squadra", color: "#9fb6d6", dash: "4 4", vals: avgSeries },
          ]}
        />
        <p style={{ marginTop: 12 }}>
          <Link className="btn ghost" href={`/classe/${classSlug(cls)}`}>
            Vai al dettaglio della classe →
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="quick" role="tablist" aria-label="Tipo di statistiche" style={{ marginBottom: 16 }}>
        {tabs.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={"btn" + (tab === k ? "" : " ghost")} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>
      <div role="tabpanel">{body}</div>
    </>
  );
}
