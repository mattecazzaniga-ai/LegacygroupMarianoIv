"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { allClasses, classPts, sum, teamActs, winnersOf } from "@/lib/calc/core";
import { buildModel } from "@/lib/calc/model";
import { rangePts } from "@/lib/calc/week";
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
        <H3>Punti nel tempo</H3>
        <LineChart
          mode="focus"
          focus={focus}
          label="Punti cumulati per squadra"
          labels={labels}
          series={teams.map((g) => ({ name: g.name, color: chartColor(g), vals: [0, ...m.hist.map((h) => h.pts[g.id])] }))}
        />
        <H3>Punti per attività</H3>
        {bars}
        <div className="g2" style={{ marginTop: 36 }}>
          <div>
            <H3 first>Quota di ogni squadra</H3>
            <HBars rows={m.now.map((r) => ({ name: r.team.name, v: r.pts, color: chartColor(r.team), txt: total ? Math.round((r.pts / tot) * 100) + "%" : "0%" }))} />
          </div>
          <div>
            <H3 first>Collettivi e individuali</H3>
            <HBars
              rows={[
                { name: "Collettivi", v: col, color: "#d8b25e" },
                { name: "Individuali", v: ind, color: "#8fb3e0" },
              ]}
            />
            {topT ? (
              <p className="note">
                Tipologia più frequente: {topT[0]} ({topT[1]} attività).
              </p>
            ) : null}
          </div>
        </div>
        <H3>Le prime 10 classi</H3>
        {tops.length ? (
          <div className="scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Classe</th>
                  <th scope="col">Squadra</th>
                  <th scope="col">Ind.</th>
                  <th scope="col">Coll.</th>
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
          </div>
        ) : (
          <p className="empty">Ancora nessuna classe con punti.</p>
        )}
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
            [wins, "attività vinte"],
            [avg, "media per attività"],
            [rangePts(g, acts, m.teamOf, m.windows.W0), "punti in 7 giorni"],
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
            <H3 first>Badge</H3>
            {badges.length ? (
              <div className="own" style={{ marginTop: 0 }}>
                {badges.map((b) => (
                  <span className="chip" key={b.id} title={b.rule}>
                    <Icon n={b.ic} size={14} /> {b.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty">Nessun badge per ora.</p>
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
            <h2 style={{ fontSize: 30, marginTop: 6 }}>Classe {cls}</h2>
          </div>
        </div>
        <StatGrid
          items={[
            [v, "punti totali"],
            [v ? ord(pos) + " su " + CLS.length : "–", "nella scuola"],
            [v ? ord(posT) + " su " + g.classes.length : "–", "nella squadra"],
            [avgT, "media della squadra"],
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
