import BarChart from "@/components/BarChart";
import { leaderIndex } from "@/components/blocks";
import StatsView from "@/components/StatsView";
import { PageHead } from "@/components/ui";
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
        <PageHead eyebrow="In numeri" title="Statistiche" sub="Generali, per squadra e per classe." />
        <StatsView
          teams={m.teams}
          acts={m.acts}
          today={m.today}
          tiebreak={CONFIG.tiebreak}
          focus={leaderIndex(m)}
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
