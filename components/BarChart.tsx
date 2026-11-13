import { niceTicksStatic as niceTicks } from "./ticks";

/** Grafico a barre statico (SVG, server). */
export default function BarChart({ labels, vals, color = "#d4ad55", label }: { labels: string[]; vals: number[]; color?: string; label: string }) {
  if (!labels.length) return <p className="empty">Il grafico comparirà dopo la prima attività.</p>;
  const W = 640,
    H = 230,
    L = 36,
    R = 10,
    T = 18,
    B = 30,
    n = labels.length;
  const tk = niceTicks(Math.min(0, ...vals), Math.max(1, ...vals));
  const bw = Math.min(46, ((W - L - R) / n) * 0.64);
  const ys = (v: number) => T + (H - T - B) * (1 - (v - tk.lo) / (tk.hi - tk.lo || 1));
  const step = Math.max(1, Math.ceil(n / 8));
  return (
    <div className="chartbox">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${labels.map((l, i) => `${l} ${vals[i]} punti`).join(", ")}`}>
        {tk.t.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={ys(v)} y2={ys(v)} stroke="#27456e" />
            <text x={L - 6} y={ys(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {vals.map((v, i) => {
          const cx = L + ((W - L - R) * (i + 0.5)) / n;
          const top = Math.min(ys(v), ys(0));
          return (
            <g key={i}>
              <rect x={cx - bw / 2} y={top} width={bw} height={Math.abs(ys(0) - ys(v))} rx={3} fill={color} />
              {n <= 14 ? (
                <text x={cx} y={top - 5} textAnchor="middle" style={{ fill: "#e8eef7", fontWeight: 700 }}>
                  {v}
                </text>
              ) : null}
              {i % step === 0 ? (
                <text x={cx} y={H - 10} textAnchor="middle">
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
