"use client";
import { useEffect, useState } from "react";

const pad = (v: number) => String(v).padStart(2, "0");

/** Countdown alla fine della competizione. Prima dell'avvio mostra "--" (niente salti di layout). */
export default function Countdown({ endMs }: { endMs: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  let parts: [string, string][] = [
    ["--", "giorni"],
    ["--", "ore"],
    ["--", "minuti"],
    ["--", "secondi"],
  ];
  let label = "Tempo alla fine della competizione";
  if (now !== null) {
    let ms = Math.max(0, endMs - now);
    const d = Math.floor(ms / 864e5);
    ms -= d * 864e5;
    const h = Math.floor(ms / 36e5);
    ms -= h * 36e5;
    const m = Math.floor(ms / 6e4);
    const s = Math.floor((ms - m * 6e4) / 1e3);
    parts = [
      [pad(d), "giorni"],
      [pad(h), "ore"],
      [pad(m), "minuti"],
      [pad(s), "secondi"],
    ];
    label = `Mancano ${d} giorni e ${h} ore alla fine della competizione`;
  }
  return (
    <div className="cd" role="timer" aria-label={label}>
      {parts.map(([v, l]) => (
        <div key={l} aria-hidden="true">
          <b>{v}</b>
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}
