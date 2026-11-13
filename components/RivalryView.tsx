"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { teamActs } from "@/lib/calc/core";
import { buildModel } from "@/lib/calc/model";
import { rangePts } from "@/lib/calc/week";
import { fmtS } from "@/lib/dates";
import type { Activity, Team, Tiebreak } from "@/lib/types";
import LineChart from "./LineChart";
import { Logo } from "./ui";

export default function RivalryView({ teams, acts, today, tiebreak }: { teams: Team[]; acts: Activity[]; today: string; tiebreak: Tiebreak }) {
  const m = useMemo(() => buildModel({ teams, acts, tiebreak, today }), [teams, acts, tiebreak, today]);
  const [a, setA] = useState(m.now[0].team.id);
  const [b, setB] = useState(m.now[1].team.id);
  const A = teams.find((t) => t.id === a)!,
    B = teams.find((t) => t.id === b)!;
  const ra = m.now.find((r) => r.team.id === a)!,
    rb = m.now.find((r) => r.team.id === b)!;

  // la sfida più serrata tra squadre vicine in classifica
  let close: { a: Team; b: Team; d: number } | null = null;
  for (let i = 0; i < m.now.length - 1; i++) {
    const d = m.now[i].pts - m.now[i + 1].pts;
    if (!close || d < close.d) close = { a: m.now[i].team, b: m.now[i + 1].team, d };
  }

  const opts = teams.map((g) => (
    <option key={g.id} value={g.id}>
      {g.name}
    </option>
  ));

  let body: React.ReactNode;
  if (a === b) body = <p className="empty">Scegli due squadre diverse.</p>;
  else {
    const gap = ra.pts - rb.pts;
    const winA = m.hist.filter((h) => h.ap[a] > h.ap[b]).length,
      winB = m.hist.filter((h) => h.ap[b] > h.ap[a]).length,
      eq = m.hist.filter((h) => h.ap[a] === h.ap[b] && h.ap[a] > 0).length;
    const nA = teamActs(A, acts, m.teamOf),
      nB = teamActs(B, acts, m.teamOf);
    const rows: [string, number | string, number | string, number][] = [
      ["Punti", ra.pts, rb.pts, 1],
      ["Posizione", m.started ? ra.pos : "–", m.started ? rb.pos : "–", -1],
      ["Ultimi 7 giorni", rangePts(A, acts, m.teamOf, m.windows.W0), rangePts(B, acts, m.teamOf, m.windows.W0), 1],
      ["Attività con punti", nA, nB, 1],
      ["Media per attività", nA ? Math.round((ra.pts / nA) * 10) / 10 : 0, nB ? Math.round((rb.pts / nB) * 10) / 10 : 0, 1],
      ["Sfide vinte a confronto", winA, winB, 1],
    ];
    const better = (x: number | string, y: number | string, hi: number) => typeof x === "number" && typeof y === "number" && hi * x > hi * y;
    body = (
      <>
        <div className="vs">
          <Link href={`/squadra/${A.id}`}>
            <Logo id={A.id} width={120} priority />
            <div className="nm">{A.name}</div>
          </Link>
          <div className="x" aria-hidden="true">
            VS
          </div>
          <Link href={`/squadra/${B.id}`}>
            <Logo id={B.id} width={120} priority />
            <div className="nm">{B.name}</div>
          </Link>
        </div>
        <div>
          <dl className="cmp">
            {rows.map(([l, x, y, hi]) => (
              <div key={l}>
                <dd className="a">
                  <b className={better(x, y, hi) ? "win" : ""}>{x}</b>
                </dd>
                <dt>{l}</dt>
                <dd>
                  <b className={better(y, x, hi) ? "win" : ""}>{y}</b>
                </dd>
              </div>
            ))}
          </dl>
          <p className="note" style={{ textAlign: "center", marginTop: 16 }}>
            {m.started && ra.pts + rb.pts !== 0 ? (
              <>
                {gap === 0 ? (
                  "Parità di punti."
                ) : (
                  <>
                    {(gap > 0 ? A : B).name} è avanti di <b>{Math.abs(gap)}</b> {Math.abs(gap) === 1 ? "punto" : "punti"}.
                  </>
                )}
                {eq ? ` ${eq} attività chiuse alla pari.` : ""}
              </>
            ) : (
              "Nessun punto assegnato: la rivalità parte dalla prima attività."
            )}
          </p>
        </div>
        <h2 style={{ fontSize: 22, margin: "36px 0 6px" }}>Il distacco nel tempo</h2>
        <p className="sub" style={{ marginBottom: 14 }}>
          Sopra lo zero è avanti {A.name}, sotto è avanti {B.name}.
        </p>
        <LineChart
          signed
          label={`Distacco tra ${A.name} e ${B.name}`}
          labels={["Inizio", ...acts.map((x) => fmtS(x.date))]}
          series={[{ name: `Distacco (${A.name} − ${B.name})`, color: "#d8b25e", vals: [0, ...m.hist.map((h) => h.pts[a] - h.pts[b])] }]}
        />
      </>
    );
  }

  return (
    <>
      <div className="sel">
        <label>
          Squadra A
          <select value={a} onChange={(e) => setA(e.target.value)}>
            {opts}
          </select>
        </label>
        <label>
          Squadra B
          <select value={b} onChange={(e) => setB(e.target.value)}>
            {opts}
          </select>
        </label>
      </div>
      {m.started && close && close.d <= 5 ? (
        <div className="hint">
          <span>
            Sfida più serrata: <b>{close.a.name}</b> e <b>{close.b.name}</b>, {close.d} {close.d === 1 ? "punto" : "punti"} di distanza.
          </span>
          <button
            type="button"
            onClick={() => {
              setA(close!.a.id);
              setB(close!.b.id);
            }}
          >
            Confrontale →
          </button>
        </div>
      ) : null}
      {body}
    </>
  );
}
