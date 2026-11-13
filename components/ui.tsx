/** Piccoli componenti condivisi (usabili sia lato server sia nel browser). */
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { BadgeIcon } from "@/lib/calc/badges";
import type { CalItem } from "@/lib/calc/calendar";
import { STATUS_LABEL, statusOf } from "@/lib/calc/calendar";
import type { TeamOf } from "@/lib/calc/core";
import { fmt } from "@/lib/dates";
import logos from "@/lib/logos.json";
import { classSlug } from "@/lib/teams";
import type { Activity, Award, Team } from "@/lib/types";

const SIZES = logos.sizes as Record<string, { w: number; h: number }>;

/** Stemma in webp: 128 px per le immagini piccole, 256 px per quelle grandi (schermi retina). */
export function Logo({ id, width, alt = "", priority = false, sizes }: { id: string; width: number; alt?: string; priority?: boolean; sizes?: string }) {
  const s = SIZES[id] ?? { w: 1, h: 1 };
  const h = Math.round((width * s.h) / s.w);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/loghi/${id}-${width > 64 ? 256 : 128}.webp`}
      srcSet={`/loghi/${id}-128.webp 128w, /loghi/${id}-256.webp 256w`}
      sizes={sizes ?? `${width}px`}
      width={width}
      height={h}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}

export const Dot = ({ team }: { team: Pick<Team, "color"> }) => (
  <span className="dot" style={{ background: team.color }} aria-hidden="true" />
);

/** Titolo di sezione: titolo + sottotitolo a sinistra, link "vedi tutto" a destra. */
export function SecH({ t, g, sub, id, more, style }: { t: string; g?: string; sub?: ReactNode; id?: string; more?: { href: string; label: string }; style?: CSSProperties }) {
  return (
    <div className="sh" style={style}>
      <div>
        <h2 id={id}>{g ? `${t} ${g}` : t}</h2>
        {sub ? <p className="sub">{sub}</p> : null}
      </div>
      {more ? (
        <Link className="link" href={more.href}>
          {more.label}
        </Link>
      ) : null}
    </div>
  );
}

export function Variation({ d }: { d: number | null }) {
  if (d === null) return <span className="var same" aria-label="Variazione non disponibile">–</span>;
  if (d > 0) return <span className="var up" aria-label={`Salita di ${d} posizioni`}>▲ {d}</span>;
  if (d < 0) return <span className="var down" aria-label={`Discesa di ${-d} posizioni`}>▼ {-d}</span>;
  return <span className="var same" aria-label="Posizione invariata">=</span>;
}

export function AwardChip({ w, teamOf }: { w: Award; teamOf: TeamOf }) {
  const g = teamOf[w.cls];
  return (
    <span className="chip">
      {g ? <Dot team={g} /> : null}
      <Link href={`/classe/${classSlug(w.cls)}`}>{w.cls}</Link>
      <b>
        {w.pts > 0 ? "+" : ""}
        {w.pts}
      </b>
      <span className="k" title={w.kind === "individuale" ? "punti individuali" : "punti collettivi"}>
        {w.kind === "individuale" ? "ind." : "coll."}
      </span>
    </span>
  );
}

export function ActCard({ a, teamOf, filt }: { a: Activity; teamOf: TeamOf; filt?: { team?: string; cls?: string } }) {
  const aw = a.awards.filter((w) => !filt || ((!filt.team || teamOf[w.cls]?.id === filt.team) && (!filt.cls || w.cls === filt.cls)));
  return (
    <article className="act">
      <h3>
        {a.title} {a.type ? <span className="badge">{a.type}</span> : null}
      </h3>
      <div className="d">{fmt(a.date)}</div>
      {a.desc ? <p>{a.desc}</p> : null}
      <div className="chips">
        {aw.map((w, i) => (
          <AwardChip key={i} w={w} teamOf={teamOf} />
        ))}
      </div>
    </article>
  );
}

export function EventCard({ e, today, teamOf, tone }: { e: CalItem; today: string; teamOf: TeamOf; tone?: string }) {
  const st = statusOf(e, today);
  const a = e.act;
  // risultato per squadra: punti presi da ogni squadra in questa attività
  const byTeam = new Map<string, { t: Team; pts: number }>();
  a?.awards.forEach((w) => {
    const t = teamOf[w.cls];
    if (!t) return;
    const v = byTeam.get(t.id) ?? { t, pts: 0 };
    byTeam.set(t.id, { t, pts: v.pts + w.pts });
  });
  const ranking = [...byTeam.values()].filter((x) => x.pts !== 0).sort((x, y) => y.pts - x.pts);
  const winner = e.winner ? Object.values(teamOf).find((t) => t.id === e.winner) : undefined;
  return (
    <article className={"act ev" + (tone ? " typed" : "")} style={tone ? ({ "--tone": tone } as CSSProperties) : undefined}>
      <div className="ev-top">
        <span className={`st ${st}`}>{STATUS_LABEL[st]}</span>
        {e.type ? <span className="tp">{e.type}</span> : null}
      </div>
      <h3>{e.title}</h3>
      <div className="d">
        {fmt(e.date)}
        {e.end && e.end !== e.date ? " → " + fmt(e.end) : ""}
      </div>
      {e.desc ? <p>{e.desc}</p> : null}
      {winner && st !== "annullata" ? (
        <p className="ev-win">
          Vince{" "}
          <Link href={`/squadra/${winner.id}`}>
            <Dot team={winner} />
            {winner.name}
          </Link>
        </p>
      ) : null}
      {a && ranking.length ? (
        <>
          <ol className="ev-rank" aria-label="Punti per squadra">
            {ranking.map(({ t, pts }) => (
              <li key={t.id}>
                <Link href={`/squadra/${t.id}`}>
                  <Dot team={t} />
                  {t.name}
                  <b>
                    {pts > 0 ? "+" : ""}
                    {pts}
                  </b>
                </Link>
              </li>
            ))}
          </ol>
          <details className="ev-cls">
            <summary>Punti per classe ({a.awards.length})</summary>
            <div className="chips">
              {a.awards.map((w, i) => (
                <AwardChip key={i} w={w} teamOf={teamOf} />
              ))}
            </div>
          </details>
        </>
      ) : st === "conclusa" && !winner ? (
        <p className="note" style={{ margin: "6px 0 0" }}>
          Risultati in aggiornamento.
        </p>
      ) : null}
    </article>
  );
}

export function StatGrid({ items }: { items: [ReactNode, string][] }) {
  return (
    <div className="stats">
      {items.map(([v, l], i) => (
        <div className="stat" key={i}>
          <b style={String(v).length > 10 ? { fontSize: 19, lineHeight: 1.25 } : undefined}>{v}</b>
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}

export function HBars({ rows }: { rows: { name: string; v: number; color: string; txt?: ReactNode }[] }) {
  const mx = Math.max(1, ...rows.map((r) => r.v));
  return (
    <div className="share">
      {rows.map((r) => (
        <div className="l" key={r.name}>
          <span>{r.name}</span>
          <div className="bar" aria-hidden="true">
            <i style={{ width: `${r.v > 0 ? Math.max(3, (r.v / mx) * 100) : 0}%`, background: r.color }} />
          </div>
          <b>{r.txt ?? r.v}</b>
        </div>
      ))}
    </div>
  );
}

const ICONS: Record<BadgeIcon, ReactNode> = {
  crown: <path d="M3 18h18l-1.5-9-4.5 4-3-7-3 7-4.5-4z" />,
  flame: <path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-10z" />,
  shield: <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" />,
  star: <path d="M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.2 6.4 20.3l1.2-6.3L3 9.6l6.3-.8z" />,
  bolt: <path d="M13 2L5 14h6l-1 8 8-12h-6z" />,
  up: <path d="M12 4l7 8h-4v8H9v-8H5z" />,
  pulse: <path d="M3 12h4l2-6 4 12 2-6h6" />,
  team: (
    <>
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="9" r="3" />
      <path d="M2 20c0-3 3-5 6-5s6 2 6 5M12 20c0-3 3-5 6-5s4 2 4 5" />
    </>
  ),
};

export const Icon = ({ n, size = 24 }: { n: BadgeIcon; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#d4ad55" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    {ICONS[n]}
  </svg>
);

export const ord = (n: number) => n + "°";

/** Intestazione di pagina: occhiello, titolo grande, sottotitolo. */
export function PageHead({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: ReactNode }) {
  return (
    <header style={{ marginBottom: 28 }}>
      {eyebrow ? <div className="eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div> : null}
      <h1 className="page">{title}</h1>
      {sub ? <p className="sub" style={{ marginTop: 10 }}>{sub}</p> : null}
    </header>
  );
}
