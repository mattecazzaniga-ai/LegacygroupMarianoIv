import RivalryView from "@/components/RivalryView";
import { PageHead } from "@/components/ui";
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
        <PageHead eyebrow="Testa a testa" title="Rivalità" sub="Scegli due squadre e confrontale." />
        <RivalryView teams={m.teams} acts={m.acts} today={m.today} tiebreak={CONFIG.tiebreak} />
      </section>
    </div>
  );
}
