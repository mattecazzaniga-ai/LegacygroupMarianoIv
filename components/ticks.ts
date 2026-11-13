/** Tacche "tonde" per gli assi dei grafici. */
export function niceTicksStatic(min: number, max: number, cnt = 4) {
  const r = max - min || 1,
    raw = r / cnt,
    p = Math.pow(10, Math.floor(Math.log10(raw))),
    f = raw / p;
  const s = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p,
    lo = Math.floor(min / s) * s,
    hi = Math.ceil(max / s) * s,
    t: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += s) t.push(Math.round(v * 100) / 100);
  return { lo, hi, t };
}
