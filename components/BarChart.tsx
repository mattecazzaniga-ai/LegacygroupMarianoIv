"use client";
import { niceTicksStatic as niceTicks } from "./ticks";
import { useWidth } from "./useWidth";

/**
 * Colonne (SVG). Un solo colore, colonne sottili (max 24px), angoli arrotondati solo in cima,
 * valore sul cappello (tutti fino a 12 colonne, poi solo massimo e ultima).
 */
export default function BarChart({ labels, vals, color = "#d8b25e", label }: { labels: string[]; vals: number[]; color?: string; label: string }) {
  const [boxRef, W] = useWidth<HTMLDivElement>();
  if (!labels.length) return <p className="empty">Il grafico comparirà dopo la prima attività.</p>;
  const H = W < 480 ? 190 : 220,
    L = 30,
    R = 10,
    T = 20,
    B = 28,
    n = labels.length;
  const tk = niceTicks(Math.min(0, ...vals), Math.max(1, ...vals));
  const bw = Math.min(24, ((W - L - R) / n) * 0.5);
  const ys = (v: number) => T + (H - T - B) * (1 - (v - tk.lo) / (tk.hi - tk.lo || 1));
  const step = Math.max(1, Math.ceil(n / (W < 480 ? 4 : 8)));
  const max = Math.max(...vals);
  const showVal = (i: number) => n <= (W < 480 ? 8 : 12) || i === n - 1 || vals[i] === max;
  const r = 4;
  const col = (cx: number, v: number) => {
    const y0 = ys(0),
      y1 = ys(v),
      x0 = cx - bw / 2,
      x1 = cx + bw / 2,
      hgt = Math.abs(y0 - y1);
    if (hgt < 0.5) return "";
    const rr = Math.min(r, hgt, bw / 2);
    if (v >= 0) return `M${x0},${y0} V${y1 + rr} Q${x0},${y1} ${x0 + rr},${y1} H${x1 - rr} Q${x1},${y1} ${x1},${y1 + rr} V${y0} Z`;
    return `M${x0},${y0} V${y1 - rr} Q${x0},${y1} ${x0 + rr},${y1} H${x1 - rr} Q${x1},${y1} ${x1},${y1 - rr} V${y0} Z`;
  };
  return (
    <div className="chartbox" ref={boxRef}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`${label}: ${labels.map((l, i) => `${l} ${vals[i]} punti`).join(", ")}`}>
        {tk.t.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={ys(v)} y2={ys(v)} stroke={v === 0 ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.08)"} />
            <text x={L - 8} y={ys(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {vals.map((v, i) => {
          const cx = L + ((W - L - R) * (i + 0.5)) / n;
          return (
            <g key={i}>
              <path d={col(cx, v)} fill={color} />
              {showVal(i) ? (
                <text className="val" x={cx} y={(v >= 0 ? ys(v) : ys(0)) - 6} textAnchor="middle">
                  {v}
                </text>
              ) : null}
              {(i % step === 0 && n - 1 - i >= Math.ceil(step / 2)) || i === n - 1 ? (
                <text x={cx} y={H - 6} textAnchor="middle">
                  {labels[i]}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
