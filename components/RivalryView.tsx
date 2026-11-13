"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { teamActs, variation } from "@/lib/calc/core";
import { buildModel } from "@/lib/calc/model";
import { headToHead } from "@/lib/calc/stats";
import { rangePts } from "@/lib/calc/week";
import { fmtS } from "@/lib/dates";
import type { Activity, Team, Tiebreak } from "@/lib/types";
import LineChart from "./LineChart";
import { Logo, Variation } from "./ui";

type Row = [label: string, a: number | string, b: number | string, hi: 1 | -1 | 0, aNode?: React.ReactNode, bNode?: React.ReactNode];

function Cmp({ rows }: { rows: Row[] }) {
  const better = (x: number | string, y: number | string, hi: number) =>
    hi !== 0 && typeof x === "number" && typeof y === "number" && hi * x > hi * y;
  return (
    <dl className="cmp">
      {rows.map(([l, x, y, hi, xn, yn]) => (
        <div key={l}>
          <dd className="a">
            <b className={better(x, y, hi) ? "win" : ""}>{xn ?? x}</b>
          </dd>
          <dt>{l}</dt>
          <dd>
            <b className={better(y, x, hi) ? "win" : ""}>{yn ?? y}</b>
          </dd>
        </div>
      ))}
    </dl>
  );
}

const pts = (n: number) => `${n} ${Math.abs(n) === 1 ? "punto" : "punti"}`;

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
    const { W0, W1 } = m.windows;
    const wA = rangePts(A, acts, m.teamOf, W0),
      wB = rangePts(B, acts, m.teamOf, W0);
    const pA = rangePts(A, acts, m.teamOf, W1, W0),
      pB = rangePts(B, acts, m.teamOf, W1, W0);
    const recent = acts.filter((x) => x.date >= W0);
    const nwA = teamActs(A, recent, m.teamOf),
      nwB = teamActs(B, recent, m.teamOf);
    const vA = variation(m.prevPos, a, ra.pos),
      vB = variation(m.prevPos, b, rb.pos);
    const matches = headToHead(A, B, m.hist, teams);
    const winA = matches.filter((x) => x.res === "A").length,
      winB = matches.filter((x) => x.res === "B").length,
      draws = matches.length - winA - winB;
    const signed = (n: number) => (n > 0 ? "+" + n : String(n));

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

        {!m.started ? (
          <p className="empty" style={{ textAlign: "center" }}>
            Nessun punto assegnato: il confronto parte dalla prima attività.
          </p>
        ) : (
          <>
            <div className="rv">
              <h2>Confronto generale</h2>
              <p className="lead">
                {gap === 0 ? (
                  "Parità di punti."
                ) : (
                  <>
                    <b>{(gap > 0 ? A : B).name}</b> è avanti di <b>{pts(Math.abs(gap))}</b>.
                  </>
                )}
              </p>
              <Cmp
                rows={[
                  ["Punti totali", ra.pts, rb.pts, 1],
                  ["Posizione", ra.pos, rb.pos, -1, ra.pos + "°", rb.pos + "°"],
                  ...(m.prevPos
                    ? ([["Ultima giornata", vA ?? 0, vB ?? 0, 1, <Variation key="a" d={vA} />, <Variation key="b" d={vB} />]] as Row[])
                    : []),
                ]}
              />
            </div>

            <div className="rv">
              <h2>Ultimi 7 giorni</h2>
              <p className="lead">
                Dal {fmtS(W0)} a oggi
                {wA || wB ? (wA === wB ? ": stessi punti." : `: meglio ${wA > wB ? A.name : B.name}.`) : ": nessun punto per le due squadre."}
              </p>
              <Cmp
                rows={[
                  ["Punti nel periodo", wA, wB, 1],
                  ["Attività con punti", nwA, nwB, 1],
                  ["Rispetto ai 7 giorni prima", wA - pA, wB - pB, 1, signed(wA - pA), signed(wB - pB)],
                ]}
              />
            </div>

            <div className="rv">
              <h2>Scontri diretti</h2>
              {matches.length ? (
                <>
                  <p className="lead">
                    Sfide in cui hanno preso punti entrambe: <b>{winA}</b> per {A.name}, <b>{winB}</b> per {B.name}
                    {draws ? `, ${draws} in parità` : ""}.
                  </p>
                  <ul className="h2h">
                    {[...matches].reverse().map((x) => (
                      <li key={x.a.id}>
                        <b className={x.res === "A" ? "w" : ""}>{x.ptsA}</b>
                        <div>
                          <span className="t">{x.a.title}</span>
                          <span className="muted">
                            {fmtS(x.a.date)}
                            {x.byWinner ? " · vincitrice indicata dagli organizzatori" : ""}
                          </span>
                        </div>
                        <b className={x.res === "B" ? "w" : ""}>{x.ptsB}</b>
                      </li>
                    ))}
                  </ul>
                  <p className="note">
                    Conta come scontro diretto solo una sfida in cui hanno preso punti entrambe le squadre. Vince la squadra indicata dagli
                    organizzatori; se non è indicata, chi ha fatto più punti in quella sfida.
                  </p>
                </>
              ) : (
                <p className="empty">
                  Nessuno scontro diretto registrato: finora {A.name} e {B.name} non hanno preso punti nella stessa sfida.
                </p>
              )}
            </div>

            {m.hist.length > 1 ? (
              <div className="rv">
                <h2>Il distacco nel tempo</h2>
                <p className="lead">
                  Sopra lo zero è avanti {A.name}, sotto è avanti {B.name}.
                </p>
                <LineChart
                  signed
                  label={`Distacco tra ${A.name} e ${B.name}`}
                  labels={["Inizio", ...acts.map((x) => fmtS(x.date))]}
                  series={[{ name: `Distacco (${A.name} − ${B.name})`, color: "#d8b25e", vals: [0, ...m.hist.map((h) => h.pts[a] - h.pts[b])] }]}
                />
              </div>
            ) : null}
          </>
        )}
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
      {m.started && close && !(close.a.id === a && close.b.id === b) ? (
        <div className="hint">
          <span>
            Sfida più serrata: <b>{close.a.name}</b> e <b>{close.b.name}</b>, {pts(close.d)} di distanza.
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
