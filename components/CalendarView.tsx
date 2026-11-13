"use client";
import { useMemo, useState } from "react";
import { calEvents, onDay } from "@/lib/calc/calendar";
import { teamOfMap } from "@/lib/calc/core";
import { fmt, fmtMonth } from "@/lib/dates";
import type { Activity, CalEvent, Team } from "@/lib/types";
import { EventCard } from "./ui";

const DOW = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function CalendarView({ teams, acts, events, today }: { teams: Team[]; acts: Activity[]; events: CalEvent[]; today: string }) {
  const ev = useMemo(() => calEvents(events, acts), [events, acts]);
  const teamOf = useMemo(() => teamOfMap(teams), [teams]);
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
  const list = sel ? onDay(ev, sel) : ev.filter((e) => e.date.slice(0, 7) === `${y}-${mm}` || (e.end && e.end.slice(0, 7) === `${y}-${mm}`));

  return (
    <>
      <div className="cal-h">
        <h2 aria-live="polite">{month}</h2>
        <button type="button" onClick={() => go(-1)} aria-label="Mese precedente">
          ‹
        </button>
        <button type="button" className="today" onClick={() => go(0)}>
          Oggi
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Mese successivo">
          ›
        </button>
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
                {es.slice(0, 3).map((_, j) => (
                  <i key={j} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="sh">
        <h2 style={{ fontSize: 22 }}>{sel ? fmt(sel) : "Attività del mese"}</h2>
        {sel ? (
          <button type="button" className="btn ghost" onClick={() => setSel("")} style={{ minHeight: 36, padding: "6px 12px", fontSize: 14 }}>
            Tutto il mese
          </button>
        ) : null}
      </div>
      <div className="list">
        {list.length ? list.map((e) => <EventCard key={e.id} e={e} today={today} teamOf={teamOf} />) : <p className="empty">Nessun evento in programma per questo periodo.</p>}
      </div>
    </>
  );
}
