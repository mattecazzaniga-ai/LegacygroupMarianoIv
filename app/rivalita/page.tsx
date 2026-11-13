import RivalryView from "@/components/RivalryView";
import { SecH } from "@/components/ui";
import { CONFIG } from "@/lib/config";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";

export const revalidate = 60;
export const metadata = meta("Rivalità", "Metti due squadre di Legacy Group una contro l'altra: punti, sfide vinte e grafico del distacco.", "/rivalita");

export default async function Rivalita() {
  const { m } = await getSite();
  return (
    <div className="wrap">
      <section>
        <h1 className="sr-only">Rivalità</h1>
        <SecH t="Rivalità" sub="Metti due squadre una contro l'altra." />
        <RivalryView teams={m.teams} acts={m.acts} today={m.today} tiebreak={CONFIG.tiebreak} />
      </section>
    </div>
  );
}
