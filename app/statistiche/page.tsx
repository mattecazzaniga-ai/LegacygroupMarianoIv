import BarChart from "@/components/BarChart";
import StatsView from "@/components/StatsView";
import { SecH } from "@/components/ui";
import { sum } from "@/lib/calc/core";
import { CONFIG } from "@/lib/config";
import { fmtS } from "@/lib/dates";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";

export const revalidate = 60;
export const metadata = meta("Statistiche", "Legacy Group in numeri: grafici dei punti nel tempo, statistiche per squadra e per classe.", "/statistiche");

export default async function Statistiche() {
  const { m } = await getSite();
  return (
    <div className="wrap">
      <section>
        <h1 className="sr-only">Statistiche</h1>
        <SecH t="Statistiche" sub="La competizione in numeri: generale, per squadra e per classe." />
        <StatsView
          teams={m.teams}
          acts={m.acts}
          today={m.today}
          tiebreak={CONFIG.tiebreak}
          bars={
            <BarChart
              label="Punti assegnati per attività"
              labels={m.acts.map((a) => fmtS(a.date))}
              vals={m.acts.map((a) => sum(a.awards.map((w) => w.pts)))}
            />
          }
        />
      </section>
    </div>
  );
}
