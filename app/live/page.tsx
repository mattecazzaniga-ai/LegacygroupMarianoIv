import { Feed, MomentsList, MomentTeam } from "@/components/blocks";
import { SecH } from "@/components/ui";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";

export const revalidate = 60;
export const metadata = meta("Live", "Gli ultimi punti assegnati, i cambi in classifica e i momenti importanti di Legacy Group.", "/live");

export default async function Live() {
  const { m } = await getSite();
  return (
    <div className="wrap">
      <section>
        <h1 className="sr-only">Live</h1>
        <SecH t="Live" sub="Gli ultimi punti assegnati e i cambi in classifica. Mai nomi di studenti: solo classi e squadre." />
        <div className="card">
          <MomentTeam m={m} />
        </div>
      </section>
      <section>
        <SecH t="Ultimi" g="aggiornamenti" />
        <Feed m={m} n={30} />
      </section>
      <section>
        <SecH t="Legacy" g="Moment" sub="I momenti importanti, rilevati in automatico." />
        <div className="card">
          <MomentsList m={m} />
        </div>
      </section>
    </div>
  );
}
