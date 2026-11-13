"use client";
/** Grafico a linee interattivo (SVG, nessuna libreria): tooltip al tocco e legenda che nasconde le serie. */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { niceTicksStatic as niceTicks } from "./ticks";

export interface Series {
  name: string;
  color: string;
  dash?: string;
  vals: number[];
}

export default function LineChart({
  labels,
  series,
  label,
  signed = false,
  nolegend = false,
  h = 260,
}: {
  labels: string[];
  series: Series[];
  label: string;
  signed?: boolean;
  nolegend?: boolean;
  h?: number;
}) {
  const [hide, setHide] = useState<Set<number>>(new Set());
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const descId = useId();
  const W = 640,
    H = h,
    L = 36,
    R = 14,
    T = 14,
    B = 26;
  const n = labels.length;

  // su telefono il tooltip resta visibile dopo il tocco e si chiude toccando altrove
  useEffect(() => {
    if (hover === null) return;
    const close = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setHover(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [hover]);

  const vis = useMemo(() => series.map((s, i) => ({ s, i })).filter((o) => !hide.has(o.i)), [series, hide]);
  const tk = useMemo(() => {
    const all = vis.flatMap((o) => o.s.vals).concat([0]);
    return niceTicks(Math.min(...all), Math.max(1, ...all));
  }, [vis]);

  if (n < 2) return <p className="empty">Il grafico comparirà dopo la prima attività.</p>;

  const xs = (i: number) => L + ((W - L - R) * i) / (n - 1);
  const ys = (v: number) => T + (H - T - B) * (1 - (v - tk.lo) / (tk.hi - tk.lo || 1));
  const step = Math.max(1, Math.ceil(n / 6));
  const f = (v: number) => (signed && v > 0 ? "+" + v : String(v));

  function onMove(e: React.PointerEvent) {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    if (!r.width) return;
    const x = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((x - L) / (W - L - R)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  const toggle = (k: number) =>
    setHide((prev) => {
      const nx = new Set(prev);
      if (nx.has(k)) nx.delete(k);
      else if (nx.size < series.length - 1) nx.add(k);
      return nx;
    });

  // posizione del tooltip
  let tipLeft = 0;
  if (hover !== null && svgRef.current && boxRef.current) {
    const r = svgRef.current.getBoundingClientRect();
    const br = boxRef.current.getBoundingClientRect();
    const px = (xs(hover) / W) * r.width + (r.left - br.left);
    const tw = 160;
    tipLeft = Math.max(4, Math.min(br.width - tw - 4, px + 10 > br.width - tw ? px - tw - 10 : px + 10));
  }
  const last = labels.length - 1;
  const summary = vis.map((o) => `${o.s.name}: ${f(o.s.vals[last])}`).join(", ");

  return (
    <div className="chartbox" ref={boxRef}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        aria-describedby={descId}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
      >
        {tk.t.map((v) => (
          <g key={"y" + v}>
            <line x1={L} x2={W - R} y1={ys(v)} y2={ys(v)} stroke={v === 0 ? "#4a6a98" : "#27456e"} strokeWidth={1} />
            <text x={L - 6} y={ys(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % step === 0 || i === n - 1 ? (
            <text key={"x" + i} x={xs(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>
              {l}
            </text>
          ) : null,
        )}
        {vis.map(({ s, i }) => (
          <g key={"s" + i}>
            <polyline
              points={s.vals.map((v, k) => `${xs(k).toFixed(1)},${ys(v).toFixed(1)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={2.6}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dash || undefined}
            />
            <circle cx={xs(n - 1)} cy={ys(s.vals[n - 1])} r={4} fill={s.color} stroke="#0a1b33" strokeWidth={1.5} />
          </g>
        ))}
        {hover !== null ? (
          <>
            <line x1={xs(hover)} x2={xs(hover)} y1={T} y2={H - B} stroke="#d4ad55" strokeWidth={1} opacity={0.7} />
            {vis.map(({ s, i }) => (
              <circle key={"h" + i} cx={xs(hover)} cy={ys(s.vals[hover])} r={5} fill={s.color} stroke="#fff" strokeWidth={1.5} />
            ))}
          </>
        ) : null}
      </svg>
      <p id={descId} className="sr-only">
        {label}. Valori finali: {summary}.
      </p>
      {hover !== null ? (
        <div className="tip" style={{ left: tipLeft }} aria-hidden="true">
          <b>{labels[hover]}</b>
          {[...vis]
            .sort((a, b) => b.s.vals[hover] - a.s.vals[hover])
            .map((o) => (
              <div key={o.i}>
                <span className="sw" style={{ background: o.s.color }} />
                {o.s.name} <b style={{ color: "#fff", marginLeft: "auto" }}>{f(o.s.vals[hover])}</b>
              </div>
            ))}
        </div>
      ) : null}
      {nolegend ? null : (
        <div className="legend">
          {series.map((s, i) => (
            <button type="button" key={s.name} className={"lg" + (hide.has(i) ? " off" : "")} aria-pressed={!hide.has(i)} onClick={() => toggle(i)}>
              <span className="sw" style={{ background: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
