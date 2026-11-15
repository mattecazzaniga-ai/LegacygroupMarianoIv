"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { checkPositions, formulaPoints, type FormulaInput, type FormulaKind, type Level, type Result } from "@/lib/calc/formula";
import { addPoints, type PointRow } from "../../actions";

/** "1".."5" = posizione, "6" = 6° o oltre, "m" = riconoscimento (merito) */
type Row = { classe: string; res: string };
const empty = (): Row => ({ classe: "", res: "" });

const toResult = (res: string): Result | null => (res === "m" ? { merit: true } : res ? { pos: Number(res) } : null);

/** Assegna i punti con la formula del regolamento: POSIZIONE × LIVELLO × TIPO + PARTECIPAZIONE. */
export default function FormulaForm({ id, groups }: { id: number; groups: { team: string; classes: string[] }[] }) {
  const [f, setF] = useState<FormulaInput>({ level: 1, kind: "collettivo", participation: false });
  const [rows, setRows] = useState<Row[]>([empty(), empty(), empty()]);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  const filled = rows.filter((r) => r.classe && r.res);
  const computed = rows.map((r) => {
    const res = toResult(r.res);
    return res ? formulaPoints(res, f) : null;
  });
  const warnings = checkPositions(filled.filter((r) => r.res !== "m" && r.res !== "6").map((r) => Number(r.res)));
  const dup = filled.map((r) => r.classe).filter((c, i, a) => a.indexOf(c) !== i);
  const total = rows.reduce((s, r, i) => s + (r.classe && computed[i] ? computed[i]!.pts : 0), 0);

  function save() {
    if (rows.some((r) => r.classe && !r.res)) return setMsg({ err: "Indica il risultato di ogni classe scelta." });
    if (dup.length) return setMsg({ err: `La classe ${dup[0]} compare due volte: ogni classe una sola riga.` });
    const tipo: PointRow["tipo"] = f.kind === "singolo" ? "individuale" : "collettiva";
    const out: PointRow[] = [];
    rows.forEach((r, i) => {
      if (r.classe && computed[i] && computed[i]!.pts > 0) out.push({ classe: r.classe, punti: computed[i]!.pts, tipo });
    });
    if (!out.length) return setMsg({ err: "Nessun punto da salvare: scegli almeno una classe con un risultato che vale punti." });
    start(async () => {
      const res = await addPoints(id, out);
      if (res.error) setMsg({ err: res.error });
      else {
        setMsg({ ok: `${out.length} ${out.length === 1 ? "assegnazione salvata" : "assegnazioni salvate"}, ${out.reduce((s, x) => s + x.punti, 0)} punti in totale.` });
        setRows([empty(), empty(), empty()]);
        router.refresh();
      }
    });
  }

  const seg = <T extends string | number | boolean>(value: T, opts: [T, string][], on: (v: T) => void, label: string) => (
    <div className="seg fseg" role="radiogroup" aria-label={label}>
      {opts.map(([v, l]) => (
        <button key={String(v)} type="button" role="radio" aria-checked={value === v} aria-selected={value === v} onClick={() => on(v)}>
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <div className="addpts formula-box">
      <h3>Assegna con la formula</h3>
      <p className="fx">
        Punti = <b>Posizione</b> × <b>Livello</b> × <b>Tipo</b> + <b>Partecipazione</b>
      </p>
      <div className="fset">
        <div>
          <span className="flab">Livello</span>
          {seg<Level>(f.level, [[1, "1 · piccola"], [2, "2 · istituto"], [3, "3 · grande"]], (level) => setF({ ...f, level }), "Livello")}
        </div>
        <div>
          <span className="flab">Tipo</span>
          {seg<FormulaKind>(f.kind, [["collettivo", "Collettivo ×2"], ["singolo", "Singolo ×1"]], (kind) => setF({ ...f, kind }), "Tipo")}
        </div>
        <div>
          <span className="flab">Partecipazione</span>
          {seg<boolean>(f.participation, [[false, "No"], [true, `Sì · +${f.level}`]], (participation) => setF({ ...f, participation }), "Partecipazione")}
        </div>
      </div>

      {rows.map((r, i) => (
        <div className="frow" key={i}>
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
            <span className="sr-only">Risultato</span>
            <select value={r.res} onChange={(e) => set(i, { res: e.target.value })}>
              <option value="">Risultato…</option>
              {[1, 2, 3, 4, 5].map((p) => (
                <option key={p} value={String(p)}>
                  {p}° posto
                </option>
              ))}
              <option value="6">6° o oltre{f.participation ? " (solo partecipazione)" : ""}</option>
              <option value="m">Riconoscimento / merito</option>
            </select>
          </label>
          <output className={"fpts" + (computed[i] && !computed[i]!.pts ? " zero" : "")}>
            {computed[i] ? (
              <>
                <b>{computed[i]!.pts}</b>
                <small>{computed[i]!.calc}</small>
              </>
            ) : null}
          </output>
          {rows.length > 1 ? (
            <button type="button" className="x" aria-label="Togli questa riga" onClick={() => setRows(rows.filter((_, k) => k !== i))}>
              ✕
            </button>
          ) : (
            <span />
          )}
        </div>
      ))}

      {warnings.length ? (
        <div className="flash warn" role="status">
          <b>Controlla i pari merito.</b> A pari merito le classi prendono la posizione più alta e la successiva viene saltata (due prime → la
          seguente è terza).
          <ul>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="quick" style={{ marginTop: 12 }}>
        <button type="button" className="btn ghost" onClick={() => setRows([...rows, empty()])}>
          + Altra classe
        </button>
        <button type="button" className="btn" onClick={save} disabled={pending}>
          {pending ? "Salvo…" : total ? `Salva ${total} punti` : "Salva punti"}
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
      <p className="note">
        A pari merito scegli la stessa posizione per tutte le classi coinvolte. Le righe che valgono 0 punti non vengono salvate. Singolo = un solo
        studente per la sua classe: si sceglie solo la classe, mai il nome.
      </p>
    </div>
  );
}
