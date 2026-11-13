"use client";
import { useMemo, useState } from "react";
import { calEvents, onDay, typeKey, typeTones } from "@/lib/calc/calendar";
import { teamOfMap } from "@/lib/calc/core";
import { fmt, fmtMonth } from "@/lib/dates";
import type { Activity, CalEvent, Team } from "@/lib/types";
import { EventCard } from "./ui";

const DOW = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function CalendarView({ teams, acts, events, today }: { teams: Team[]; acts: Activity[]; events: CalEvent[]; today: string }) {
  const ev = useMemo(() => calEvents(events, acts), [events, acts]);
  const teamOf = useMemo(() => teamOfMap(teams), [teams]);
  const tones = useMemo(() => typeTones(events), [events]);
  const [y0, m0] = today.split("-").map(Number);
  const [ym, setYm] = useState({ y: y0, m: m0 - 1 });
  const [sel, setSel] = useState("");

  const { y, m } = ym;
  const mm = String(m + 1).padStart(2, "0");
  const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const off = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;
  const key = (d: number) => `${y}-${mm}-${String(d).padStart(2, "0")}`;
  const month = fmtMonth(y, m);
  const go = (v: number) => {
    setSel("");
    if (v === 0) return setYm({ y: y0, m: m0 - 1 });
    let nm = m + v,
      ny = y;
    if (nm < 0) {
      nm = 11;
      ny--;
    }
    if (nm > 11) {
      nm = 0;
      ny++;
    }
    setYm({ y: ny, m: nm });
  };
  const ym0 = `${y}-${mm}`;
  const inMonth = ev.filter((e) => e.date.slice(0, 7) <= ym0 && (e.end || e.date).slice(0, 7) >= ym0);
  const list = sel ? onDay(ev, sel) : inMonth;
  const prevName = fmtMonth(m === 0 ? y - 1 : y, (m + 11) % 12).split(" ")[0];
  const nextName = fmtMonth(m === 11 ? y + 1 : y, (m + 1) % 12).split(" ")[0];
  const isNow = y === y0 && m === m0 - 1;
  // se il mese è vuoto, porta al primo mese successivo con appuntamenti
  const next = !inMonth.length ? ev.find((e) => e.date.slice(0, 7) > ym0) : undefined;
  const monthTypes = [...new Map(inMonth.filter((e) => e.type).map((e) => [typeKey(e.type), e.type])).entries()];

  return (
    <>
      <div className="cal-h">
        <h2 aria-live="polite">{month}</h2>
        <div className="cal-nav">
          <button type="button" onClick={() => go(-1)} aria-label={`Mese precedente: ${prevName}`}>
            ‹ <span>{prevName}</span>
          </button>
          {!isNow ? (
            <button type="button" className="today" onClick={() => go(0)}>
              Oggi
            </button>
          ) : null}
          <button type="button" onClick={() => go(1)} aria-label={`Mese successivo: ${nextName}`}>
            <span>{nextName}</span> ›
          </button>
        </div>
      </div>
      <div className="cal">
        {DOW.map((d) => (
          <div className="dw" key={d} aria-hidden="true">
            {d}
          </div>
        ))}
        {Array.from({ length: off }, (_, i) => (
          <div key={"o" + i} />
        ))}
        {Array.from({ length: dim }, (_, i) => {
          const d = i + 1;
          const k = key(d);
          const es = onDay(ev, k);
          return (
            <button
              type="button"
              key={k}
              className={"dy" + (k === today ? " t" : "") + (sel === k ? " on" : "") + (es.length ? " has" : "")}
              aria-pressed={sel === k}
              aria-label={`${fmt(k)}${es.length ? ", " + es.length + (es.length === 1 ? " evento" : " eventi") : ""}${k === today ? ", oggi" : ""}`}
              onClick={() => setSel(sel === k ? "" : k)}
            >
              <span>{d}</span>
              <span className="dots" aria-hidden="true">
                {es.slice(0, 3).map((e, j) => (
                  <i key={j} style={{ background: e.status === "annullata" ? "var(--muted)" : tones[typeKey(e.type)] ?? "var(--gold)" }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      {monthTypes.length ? (
        <ul className="legend-t" aria-label="Tipologie del mese">
          {monthTypes.map(([k, t]) => (
            <li key={k}>
              <i style={{ background: tones[k] }} aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="sh">
        <h2 style={{ fontSize: 22 }}>{sel ? fmt(sel) : "Attività del mese"}</h2>
        {sel ? (
          <button type="button" className="btn ghost" onClick={() => setSel("")} style={{ minHeight: 36, padding: "6px 12px", fontSize: 14 }}>
            Tutto il mese
          </button>
        ) : null}
      </div>
      <div className="list">
        {list.length ? (
          list.map((e) => <EventCard key={e.id} e={e} today={today} teamOf={teamOf} tone={tones[typeKey(e.type)]} />)
        ) : (
          <div className="empty">
            {sel ? "Nessun appuntamento in questo giorno." : "Nessun appuntamento in questo mese."}
            {next && !sel ? (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  const [ny, nm] = next.date.split("-").map(Number);
                  setYm({ y: ny, m: nm - 1 });
                }}
              >
                Prossimo: {next.title}, {fmt(next.date)} →
              </button>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
