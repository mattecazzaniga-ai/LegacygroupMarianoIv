/** Blocchi delle pagine (server). */
import Link from "next/link";
import type { Model } from "@/lib/calc/model";
import { calEvents, statusOf } from "@/lib/calc/calendar";
import { allClasses, sum, variation } from "@/lib/calc/core";
import { CONFIG } from "@/lib/config";
import { fmt, fmtS } from "@/lib/dates";
import { chartColor } from "@/lib/teams";
import type { CalEvent, Team } from "@/lib/types";
import Countdown from "./Countdown";
import type { Series } from "./LineChart";
import { ActCard, AwardChip, Dot, EventCard, Icon, Logo, ord, StatGrid } from "./ui";

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

export function Podium({ m }: { m: Model }) {
  if (!m.started) return null;
  const t = [m.now[1], m.now[0], m.now[2]];
  return (
    <div className="podium" role="group" aria-label="Podio">
      {t.map((r) => (
        <Link key={r.team.id} className={`pod m${r.pos <= 3 ? r.pos : 3}`} href={`/squadra/${r.team.id}`}>
          <Logo id={r.team.id} width={r === m.now[0] ? 112 : 84} />
          <div className="rk">{r.pos}° posto</div>
          <div className="nm">{r.team.name}</div>
          <div className="pt">{r.pts}</div>
        </Link>
      ))}
    </div>
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

export function MomentTeam({ m }: { m: Model }) {
  const r = m.week[0];
  if (!r || !r.pts) return <p className="empty">Nessun punto negli ultimi 7 giorni.</p>;
  const d = r.pts - r.prevW;
  return (
    <Link className="moment" href={`/squadra/${r.team.id}`}>
      <Logo id={r.team.id} width={64} />
      <div>
        <div className="nm">{r.team.name}</div>
        <div className="mt">
          <span>+{r.pts} punti in 7 giorni</span>
          <span className={d > 0 ? "up" : d < 0 ? "down" : "same"}>
            {d > 0 ? "▲ " + d : d < 0 ? "▼ " + -d : "="} sulla settimana prima
          </span>
        </div>
      </div>
    </Link>
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

export function Recent({ m, n }: { m: Model; n: number }) {
  const list = [...m.acts].reverse().slice(0, n);
  return list.length ? (
    <div className="list">
      {list.map((a) => (
        <ActCard key={a.id} a={a} teamOf={m.teamOf} />
      ))}
    </div>
  ) : (
    <p className="empty">Nessuna attività registrata per ora.</p>
  );
}

export function MiniStats({ m }: { m: Model }) {
  const total = sum(m.acts.flatMap((a) => a.awards.map((w) => w.pts)));
  const withPts = new Set(m.acts.flatMap((a) => a.awards.map((w) => w.cls))).size;
  const lead =
    m.started && m.now[0].pts > 0
      ? m.now
          .filter((r) => r.pos === 1)
          .map((r) => r.team.name)
          .join(" e ")
      : "–";
  return (
    <StatGrid
      items={[
        [m.acts.length, "attività svolte"],
        [total, "punti assegnati"],
        [withPts + " / " + allClasses(m.teams).length, "classi con punti"],
        [lead, "in testa"],
      ]}
    />
  );
}

export function PowerBoard({ m }: { m: Model }) {
  if (!m.power.some((r) => r.sc > 0)) return <p className="empty">Nessun punto negli ultimi 30 giorni: la forma si calcola dalle prossime attività.</p>;
  return (
    <>
      <ol className="board">
        {m.power.map((r) => {
          const d = r.off - r.pos;
          return (
            <li key={r.team.id}>
              <Link className="row" href={`/squadra/${r.team.id}`}>
                <div className="pos">{r.pos}</div>
                <Logo id={r.team.id} width={56} />
                <div>
                  <div className="nm">{r.team.name}</div>
                  <div className="mt">
                    <span>
                      {r.w} pt negli ultimi 7 gg · {r.m} dall&apos;8° al 30°
                    </span>
                    {d !== 0 ? <span className={d > 0 ? "var up" : "var down"}>{d > 0 ? `▲ ${d}` : `▼ ${-d}`} rispetto alla classifica</span> : null}
                  </div>
                </div>
                <div className="pt">
                  {r.sc}
                  <small>forma</small>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="note">
        Forma = 2 × punti degli ultimi 7 giorni + punti dall&apos;8° al 30° giorno. È solo indicativa: la classifica ufficiale è quella generale.
      </p>
    </>
  );
}

export function Feed({ m, n }: { m: Model; n?: number }) {
  if (!m.hist.length) return <p className="empty">Il feed si riempie appena viene registrata la prima attività.</p>;
  return (
    <div className="list">
      {[...m.hist]
        .reverse()
        .slice(0, n ?? 999)
        .map((h) => {
          const gains = m.teams
            .map((g) => ({ g, v: h.ap[g.id] }))
            .filter((x) => x.v !== 0)
            .sort((a, b) => b.v - a.v);
          const ch = h.prevPos
            ? m.teams
                .map((g) => ({ g, d: h.prevPos![g.id] - h.pos[g.id], p: h.pos[g.id] }))
                .filter((x) => x.d !== 0)
                .sort((a, b) => a.p - b.p)
            : [];
          return (
            <article className="act" key={h.a.id}>
              <h3>
                {h.a.title} {h.a.type ? <span className="badge">{h.a.type}</span> : null}
              </h3>
              <div className="d">{fmt(h.a.date)}</div>
              <div className="chips">
                {gains.map((x) => (
                  <span className="chip" key={x.g.id}>
                    <Dot team={x.g} />
                    <Link href={`/squadra/${x.g.id}`}>{x.g.name}</Link>
                    <b>
                      {x.v > 0 ? "+" : ""}
                      {x.v}
                    </b>
                  </span>
                ))}
              </div>
              {ch.length ? (
                <p>
                  {ch.map((x, i) => (
                    <span key={x.g.id}>
                      {i ? " · " : ""}
                      <span className={x.d > 0 ? "up" : "down"}>{x.d > 0 ? "▲" : "▼"}</span> {x.g.name} {x.d > 0 ? "sale" : "scende"} al {ord(x.p)} posto
                    </span>
                  ))}
                </p>
              ) : null}
              <details style={{ marginTop: 8 }}>
                <summary className="note" style={{ marginTop: 0, cursor: "pointer" }}>
                  Punti per classe
                </summary>
                <div className="chips">
                  {h.a.awards.map((w, i) => (
                    <AwardChip key={i} w={w} teamOf={m.teamOf} />
                  ))}
                </div>
              </details>
            </article>
          );
        })}
    </div>
  );
}

/** Serie per i grafici: punti cumulati di ogni squadra. */
export const dateLabels = (m: Model) => ["Inizio", ...m.acts.map((a) => fmtS(a.date))];
export const teamSeries = (m: Model, list: Team[] = m.teams): Series[] =>
  list.map((g) => ({ name: g.name, color: chartColor(g), vals: [0, ...m.hist.map((h) => h.pts[g.id])] }));
/** Indice della squadra in testa (per mettere in evidenza la sua linea). */
export const leaderIndex = (m: Model) => Math.max(0, m.teams.findIndex((t) => t.id === m.now[0].team.id));
