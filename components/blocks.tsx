/** Blocchi delle pagine (server). */
import Link from "next/link";
import type { Model } from "@/lib/calc/model";
import { calEvents, statusOf } from "@/lib/calc/calendar";
import { variation } from "@/lib/calc/core";
import { CONFIG } from "@/lib/config";
import { fmt, fmtS } from "@/lib/dates";
import { chartColor } from "@/lib/teams";
import type { CalEvent, Team } from "@/lib/types";
import Countdown from "./Countdown";
import { EventCard, Icon, Logo, ord } from "./ui";

function Var({ m, id, pos }: { m: Model; id: string; pos: number }) {
  const d = variation(m.prevPos, id, pos);
  if (d === null) return null;
  if (d > 0) return <span className="var up" aria-label={`su di ${d}`}>▲ {d}</span>;
  if (d < 0) return <span className="var down" aria-label={`giù di ${-d}`}>▼ {-d}</span>;
  return <span className="var same" aria-label="stabile">=</span>;
}

export function Board({ m, detail = false }: { m: Model; detail?: boolean }) {
  const maxPts = Math.max(1, ...m.now.map((r) => r.pts));
  return (
    <ol className="board">
      {m.now.map((r, k) => {
        const cls = m.started && r.pos <= 3 ? " p" + r.pos : "";
        const above = k > 0 ? m.now[k - 1].pts - r.pts : 0;
        return (
          <li key={r.team.id}>
            <Link className={"row" + cls} href={`/squadra/${r.team.id}`}>
              <div className="pos">
                <span aria-hidden="true">{m.started ? r.pos : "–"}</span>
                {m.started ? <span className="sr-only">{ord(r.pos)} posto:</span> : null}
              </div>
              <Logo id={r.team.id} width={56} />
              <div>
                <div className="nm">{r.team.name}</div>
                <div className="mt">
                  {m.started ? <Var m={m} id={r.team.id} pos={r.pos} /> : null}
                  <span>{r.team.classes.length} classi</span>
                  {detail && m.started && k > 0 && above > 0 ? <span>−{above} dalla precedente</span> : null}
                  {detail && m.started && k === 0 && m.now[1] && r.pts > m.now[1].pts ? <span>+{r.pts - m.now[1].pts} sulla seconda</span> : null}
                </div>
                <div className="bar" aria-hidden="true">
                  <i style={{ width: `${r.pts > 0 ? Math.max(3, (r.pts / maxPts) * 100) : 0}%`, background: chartColor(r.team) }} />
                </div>
              </div>
              <div className="pt">
                {r.pts}
                <small>punti</small>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function CountdownBlock({ m, startMs, endMs, nowMs, isFinal }: { m: Model; startMs: number; endMs: number; nowMs: number; isFinal: boolean }) {
  if (isFinal) {
    const w = m.now.filter((r) => r.pos === 1 && r.pts > 0);
    return w.length ? (
      <div className="final">
        <Logo id={w[0].team.id} width={64} />
        <div>
          <div className="eyebrow gold">Stagione conclusa</div>
          <b>
            {w.length > 1 ? "Pari merito: " : "Vince "}
            {w.map((r) => r.team.name).join(" e ")}
          </b>
          <p className="sub" style={{ marginTop: 6 }}>
            {w[0].pts} punti. Grazie a tutte le classi.
          </p>
        </div>
      </div>
    ) : (
      <div className="final">
        <div>
          <div className="eyebrow gold">Stagione conclusa</div>
          <b>Grazie a tutti</b>
        </div>
      </div>
    );
  }
  const pct = Math.max(0, Math.min(100, ((nowMs - startMs) / (endMs - startMs)) * 100));
  return (
    <div>
      <Countdown endMs={endMs} />
      <div className="season">
        <div className="track" role="progressbar" aria-label="Avanzamento della stagione" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct.toFixed(1)}%` }} />
        </div>
        <span>fine {fmt(CONFIG.endDate)}</span>
      </div>
    </div>
  );
}

const MEDALS = ["Oro", "Argento", "Bronzo"];
export function WeekPodium({ m }: { m: Model }) {
  const top = m.week.filter((r) => r.pts > 0);
  if (!top.length) return <p className="empty">Nessun punto negli ultimi 7 giorni: il podio si forma alla prossima attività.</p>;
  const show = top.filter((r) => r.pos <= 3);
  return (
    <>
      <ol className="wk">
        {show.map((r) => {
          const d = r.pts - r.prevW;
          const ds = r.prevW === 0 ? "nuova entrata" : d > 0 ? `▲ ${d} sulla settimana prima` : d < 0 ? `▼ ${-d} sulla settimana prima` : "come la settimana prima";
          return (
            <li key={r.team.id}>
              <Link className={`w m${r.pos}`} href={`/squadra/${r.team.id}`}>
                <Logo id={r.team.id} width={40} />
                <div>
                  <div className="medal">{MEDALS[r.pos - 1]}</div>
                  <div className="nm">{r.team.name}</div>
                  <div className="mt">{ds}</div>
                </div>
                <div className="pt">{r.pts}</div>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="note">Punti dal {fmtS(m.windows.W0)} a oggi, confrontati con i 7 giorni precedenti.</p>
    </>
  );
}

export function MomentsList({ m, n }: { m: Model; n?: number }) {
  const M = m.moments.slice(0, n ?? 999);
  return M.length ? (
    <ol className="tl">
      {M.map((x, i) => (
        <li className="e" key={i}>
          <div className="d">{fmtS(x.d)}</div>
          <div>
            <h3>{x.t}</h3>
            <p>{x.s}</p>
          </div>
        </li>
      ))}
    </ol>
  ) : (
    <p className="empty">Sorpassi, record e traguardi compariranno qui in automatico.</p>
  );
}

export function BadgesRow({ m, team }: { m: Model; team: Team }) {
  const b = m.badgesOf(team);
  return b.length ? (
    <div className="own" role="group" aria-label="Badge della squadra">
      {b.map((x) => (
        <span className="chip" key={x.id} title={x.rule}>
          <Icon n={x.ic} size={14} /> {x.name}
        </span>
      ))}
    </div>
  ) : (
    <p className="empty">Nessun badge per ora.</p>
  );
}

export function Upcoming({ m, events }: { m: Model; events: CalEvent[] }) {
  const list = calEvents(events, m.acts)
    .filter((e) => {
      const s = statusOf(e, m.today);
      return s === "programmata" || s === "corso";
    })
    .slice(0, 3);
  return list.length ? (
    <div className="list">
      {list.map((e) => (
        <EventCard key={e.id} e={e} today={m.today} teamOf={m.teamOf} />
      ))}
    </div>
  ) : (
    <p className="empty">Le prossime attività verranno annunciate qui.</p>
  );
}

export const dateLabels = (m: Model) => ["Inizio", ...m.acts.map((a) => fmtS(a.date))];
/** Indice della squadra in testa (per mettere in evidenza la sua linea). */
export const leaderIndex = (m: Model) => Math.max(0, m.teams.findIndex((t) => t.id === m.now[0].team.id));
