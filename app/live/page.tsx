import { Feed, MomentsList, MomentTeam } from "@/components/blocks";
import { PageHead, SecH } from "@/components/ui";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";

export const revalidate = 60;
export const metadata = meta("Live", "Gli ultimi punti assegnati, i cambi in classifica e i momenti importanti di Legacy Group.", "/live");

export default async function Live() {
  const { m } = await getSite();
  return (
    <div className="wrap">
      <section>
        <PageHead eyebrow="Aggiornato ogni minuto" title="Live" sub="Punti assegnati e cambi in classifica. Solo classi e squadre, mai nomi." />
        <MomentTeam m={m} />
      </section>
      <section className="g2">
        <div>
          <SecH t="Ultimi aggiornamenti" />
          <Feed m={m} n={30} />
        </div>
        <div>
          <SecH t="Legacy Moment" sub="Sorpassi, record e traguardi, rilevati in automatico." />
          <MomentsList m={m} />
        </div>
      </section>
    </div>
  );
}
