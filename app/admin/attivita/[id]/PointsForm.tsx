"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addPoints, type PointRow } from "../../actions";

type Row = { classe: string; punti: string; tipo: PointRow["tipo"] };
const empty = (tipo: PointRow["tipo"] = "collettiva"): Row => ({ classe: "", punti: "", tipo });

/** Aggiunge una o più assegnazioni in un colpo solo (es. la classifica di un torneo). */
export default function PointsForm({ id, groups }: { id: number; groups: { team: string; classes: string[] }[] }) {
  const [rows, setRows] = useState<Row[]>([empty()]);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  function save() {
    const parsed: PointRow[] = [];
    for (const r of rows) {
      if (!r.classe) continue;
      const n = Number(r.punti);
      if (r.punti.trim() === "" || !Number.isInteger(n)) return setMsg({ err: `Scrivi i punti (numero intero) per la ${r.classe}.` });
      parsed.push({ classe: r.classe, punti: n, tipo: r.tipo });
    }
    if (!parsed.length) return setMsg({ err: "Scegli almeno una classe." });
    start(async () => {
      const res = await addPoints(id, parsed);
      if (res.error) setMsg({ err: res.error });
      else {
        setMsg({ ok: `${parsed.length} ${parsed.length === 1 ? "assegnazione salvata" : "assegnazioni salvate"}.` });
        setRows([empty(rows[rows.length - 1].tipo)]);
        router.refresh();
      }
    });
  }

  return (
    <div className="addpts">
      <h3>Aggiungi punti a mano</h3>
      {rows.map((r, i) => (
        <div className="prow" key={i}>
          <label>
            <span className="sr-only">Classe</span>
            <select value={r.classe} onChange={(e) => set(i, { classe: e.target.value })}>
              <option value="">Classe…</option>
              {groups.map((g) => (
                <optgroup key={g.team} label={g.team}>
                  {g.classes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Punti</span>
            <input type="number" inputMode="numeric" step={1} placeholder="Punti" value={r.punti} onChange={(e) => set(i, { punti: e.target.value })} />
          </label>
          <label>
            <span className="sr-only">Tipo</span>
            <select value={r.tipo} onChange={(e) => set(i, { tipo: e.target.value as Row["tipo"] })}>
              <option value="collettiva">collettiva</option>
              <option value="individuale">individuale</option>
            </select>
          </label>
          {rows.length > 1 ? (
            <button type="button" className="x" aria-label="Togli questa riga" onClick={() => setRows(rows.filter((_, k) => k !== i))}>
              ✕
            </button>
          ) : (
            <span />
          )}
        </div>
      ))}
      <div className="quick" style={{ marginTop: 10 }}>
        <button type="button" className="btn ghost" onClick={() => setRows([...rows, empty(rows[rows.length - 1].tipo)])}>
          + Altra classe
        </button>
        <button type="button" className="btn" onClick={save} disabled={pending}>
          {pending ? "Salvo…" : "Salva punti"}
        </button>
      </div>
      {msg.err ? (
        <p className="flash err" role="alert">
          {msg.err}
        </p>
      ) : msg.ok ? (
        <p className="flash" role="status">
          {msg.ok}
        </p>
      ) : null}
      <p className="note">Individuale = punti vinti da uno studente: si scrive solo la classe, mai il nome.</p>
    </div>
  );
}
