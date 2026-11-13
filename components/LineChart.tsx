"use client";
/**
 * Grafico a linee (SVG, nessuna libreria).
 * - mode "focus": una serie in evidenza nel suo colore, le altre grigie; si cambia con i bottoni sopra.
 *   (I colori delle 6 squadre non sono distinguibili tutti insieme, quindi non li mostriamo insieme.)
 * - mode "compare": poche serie tutte colorate, con legenda.
 * Crosshair + tooltip con tutti i valori; valore scritto a fine linea.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MUTED_LINE } from "@/lib/teams";
import { niceTicksStatic as niceTicks } from "./ticks";
import { useWidth } from "./useWidth";

export interface Series {
  name: string;
  color: string;
  vals: number[];
  /** linea di riferimento (tratteggiata, grigio chiaro) */
  ref?: boolean;
}

const GRID = "rgba(255,255,255,.08)";
const ZERO = "rgba(255,255,255,.28)";
const SURFACE = "#111d31";
const REF = "#aeb9c9";

export default function LineChart({
  labels,
  series,
  label,
  mode = "compare",
  focus: focus0 = 0,
  signed = false,
  h = 240,
}: {
  labels: string[];
  series: Series[];
  label: string;
  mode?: "focus" | "compare";
  focus?: number;
  signed?: boolean;
  h?: number;
}) {
  const [focus, setFocus] = useState(focus0);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [boxRef, W] = useWidth<HTMLDivElement>();
  const descId = useId();
  const H = W < 480 ? Math.round(h * 0.85) : h,
    L = 30,
    R = 30,
    T = 16,
    B = 28;
  const n = labels.length;

  useEffect(() => setFocus(focus0), [focus0]);
  // su telefono il tooltip resta dopo il tocco e si chiude toccando altrove
  useEffect(() => {
    if (hover === null) return;
    const close = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setHover(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [hover]);

  const tk = useMemo(() => {
    const all = series.flatMap((s) => s.vals).concat([0]);
    return niceTicks(Math.min(...all), Math.max(1, ...all));
  }, [series]);

  if (n < 2) return <p className="empty">Il grafico comparirà dopo la prima attività.</p>;

  const xs = (i: number) => L + ((W - L - R) * i) / (n - 1);
  const ys = (v: number) => T + (H - T - B) * (1 - (v - tk.lo) / (tk.hi - tk.lo || 1));
  const f = (v: number) => (signed && v > 0 ? "+" + v : String(v));
  const step = Math.max(1, Math.ceil(n / (W < 480 ? 3 : 6)));
  const last = n - 1;
  const isFocus = mode === "focus";
  const colorOf = (s: Series, i: number) => (s.ref ? REF : isFocus && i !== focus ? MUTED_LINE : s.color);
  // ordine di disegno: grigie sotto, in evidenza sopra
  const order = series.map((s, i) => ({ s, i })).sort((a, b) => (isFocus ? (a.i === focus ? 1 : 0) - (b.i === focus ? 1 : 0) : 0));
  const labelled = isFocus ? [focus] : series.map((_, i) => i);

  function onMove(e: React.PointerEvent) {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    if (!r.width) return;
    const x = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((x - L) / (W - L - R)) * (n - 1)))));
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") setHover((h0) => Math.min(n - 1, (h0 ?? -1) + 1));
    else if (e.key === "ArrowLeft") setHover((h0) => Math.max(0, (h0 ?? n) - 1));
    else if (e.key === "Escape") setHover(null);
    else return;
    e.preventDefault();
  }

  let tipLeft = 0;
  if (hover !== null && svgRef.current && boxRef.current) {
    const r = svgRef.current.getBoundingClientRect();
    const br = boxRef.current.getBoundingClientRect();
    const px = (xs(hover) / W) * r.width + (r.left - br.left);
    const tw = 180;
    tipLeft = Math.max(6, Math.min(br.width - tw - 6, px + 12 > br.width - tw ? px - tw - 12 : px + 12));
  }
  const summary = series.map((s) => `${s.name}: ${f(s.vals[last])}`).join(", ");

  return (
    <div>
      {isFocus ? (
        <div className="picker" role="group" aria-label="Squadra in evidenza nel grafico">
          {series.map((s, i) => (
            <button type="button" key={s.name} aria-pressed={i === focus} onClick={() => setFocus(i)}>
              <span className="key" style={{ background: i === focus ? s.color : MUTED_LINE, height: 3 }} />
              {s.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="chartbox" ref={boxRef}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          role="img"
          aria-label={label}
          aria-describedby={descId}
          tabIndex={0}
          onKeyDown={onKey}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
          onBlur={() => setHover(null)}
        >
          {tk.t.map((v) => (
            <g key={"y" + v}>
              <line x1={L} x2={W - R} y1={ys(v)} y2={ys(v)} stroke={v === 0 ? ZERO : GRID} strokeWidth={1} />
              <text x={L - 8} y={ys(v) + 4} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          {labels.map((l, i) =>
            (i % step === 0 && last - i >= Math.ceil(step / 2) + 1) || i === last ? (
              <text key={"x" + i} x={xs(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}>
                {l}
              </text>
            ) : null,
          )}
          {order.map(({ s, i }) => {
            const on = !isFocus || i === focus;
            return (
              <polyline
                key={"s" + i}
                points={s.vals.map((v, k) => `${xs(k).toFixed(1)},${ys(v).toFixed(1)}`).join(" ")}
                fill="none"
                stroke={colorOf(s, i)}
                strokeWidth={on && !s.ref ? 2 : 1.5}
                strokeDasharray={s.ref ? "4 4" : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}
          {labelled.map((i) => {
            const s = series[i];
            if (!s) return null;
            return (
              <g key={"e" + i}>
                <circle cx={xs(last)} cy={ys(s.vals[last])} r={4} fill={colorOf(s, i)} stroke={SURFACE} strokeWidth={2} />
                <text className="val" x={xs(last) + 8} y={ys(s.vals[last]) + 4} textAnchor="start">
                  {f(s.vals[last])}
                </text>
              </g>
            );
          })}
          {hover !== null ? (
            <g>
              <line x1={xs(hover)} x2={xs(hover)} y1={T} y2={H - B} stroke="rgba(255,255,255,.35)" strokeWidth={1} />
              {series.map((s, i) =>
                !isFocus || i === focus ? <circle key={"h" + i} cx={xs(hover)} cy={ys(s.vals[hover])} r={4.5} fill={colorOf(s, i)} stroke={SURFACE} strokeWidth={2} /> : null,
              )}
            </g>
          ) : null}
        </svg>
        <p id={descId} className="sr-only">
          {label}. Valori finali: {summary}. Usa le frecce sinistra e destra per scorrere i valori.
        </p>
        {hover !== null ? (
          <div className="tip" style={{ left: tipLeft }} role="status">
            <div className="t">{labels[hover]}</div>
            {series
              .map((s, i) => ({ s, i }))
              .sort((a, b) => b.s.vals[hover] - a.s.vals[hover])
              .map(({ s, i }) => (
                <div className="r" key={i}>
                  <span className="key" style={{ background: s.ref ? REF : s.color }} />
                  <b>{f(s.vals[hover])}</b>
                  <span className="n">{s.name}</span>
                </div>
              ))}
          </div>
        ) : null}
        {!isFocus && series.length > 1 ? (
          <div className="legend">
            {series.map((s) => (
              <span key={s.name}>
                <span className={"key" + (s.ref ? " dash" : "")} style={{ background: s.ref ? REF : s.color, color: REF }} />
                {s.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
