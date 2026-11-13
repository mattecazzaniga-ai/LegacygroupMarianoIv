"use client";
import { useMemo, useState } from "react";
import { teamOfMap } from "@/lib/calc/core";
import type { Activity, Team } from "@/lib/types";
import { ActCard } from "./ui";

export default function ActivityLog({ teams, acts }: { teams: Team[]; acts: Activity[] }) {
  const teamOf = useMemo(() => teamOfMap(teams), [teams]);
  const [F, setF] = useState({ team: "", cls: "", type: "", from: "", to: "" });
  const set = (k: keyof typeof F) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => setF({ ...F, [k]: e.target.value });
  const types = [...new Set(acts.map((a) => a.type).filter(Boolean))].sort();
  const list = [...acts]
    .reverse()
    .filter(
      (a) =>
        (!F.type || a.type === F.type) &&
        (!F.from || a.date >= F.from) &&
        (!F.to || a.date <= F.to) &&
        (!F.team || a.awards.some((w) => teamOf[w.cls]?.id === F.team)) &&
        (!F.cls || a.awards.some((w) => w.cls === F.cls)),
    );
  return (
    <>
      <div className="filters">
        <label>
          Squadra
          <select value={F.team} onChange={set("team")}>
            <option value="">Tutte</option>
            {teams.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Classe
          <select value={F.cls} onChange={set("cls")}>
            <option value="">Tutte</option>
            {teams.map((g) => (
              <optgroup key={g.id} label={g.name}>
                {[...g.classes].sort().map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          Tipologia
          <select value={F.type} onChange={set("type")}>
            <option value="">Tutte</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dal
          <input type="date" value={F.from} onChange={set("from")} />
        </label>
        <label>
          Al
          <input type="date" value={F.to} onChange={set("to")} />
        </label>
      </div>
      <div className="list" aria-live="polite">
        {!acts.length ? (
          <p className="empty">Nessuna attività registrata per ora.</p>
        ) : list.length ? (
          list.map((a) => <ActCard key={a.id} a={a} teamOf={teamOf} filt={F} />)
        ) : (
          <p className="empty">Nessuna attività con questi filtri.</p>
        )}
      </div>
    </>
  );
}
