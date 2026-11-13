import "server-only";
import { cache } from "react";
import { buildModel } from "./calc/model";
import { CONFIG } from "./config";
import { getDataset } from "./data/source";
import { instantIn, todayIn } from "./dates";

/** Dati e calcoli per una richiesta (una sola lettura del foglio per pagina). */
export const getSite = cache(async () => {
  const ds = await getDataset();
  const nowMs = Date.now();
  const today = todayIn(CONFIG.timeZone, new Date(nowMs));
  const model = buildModel({ teams: ds.teams, acts: ds.activities, tiebreak: CONFIG.tiebreak, today });
  const startMs = instantIn(CONFIG.startDate, "00:00:00", CONFIG.timeZone);
  const endMs = instantIn(CONFIG.endDate, "23:59:59", CONFIG.timeZone);
  return {
    ds,
    m: model,
    today,
    nowMs,
    startMs,
    endMs,
    isFinal: CONFIG.closed || nowMs > endMs,
  };
});

export type Site = Awaited<ReturnType<typeof getSite>>;
