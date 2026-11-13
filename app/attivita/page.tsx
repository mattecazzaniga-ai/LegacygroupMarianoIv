import ActivityLog from "@/components/ActivityLog";
import { PageHead } from "@/components/ui";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";

export const revalidate = 60;
export const metadata = meta("Registro attività", "Tutte le attività di Legacy Group con i punti assegnati, filtrabili per squadra, classe, tipologia e data.", "/attivita");

export default async function Attivita() {
  const { m } = await getSite();
  return (
    <div className="wrap">
      <section>
        <PageHead eyebrow="Registro" title="Attività" sub="Tutte le attività che hanno dato punti, dalla più recente." />
        <ActivityLog teams={m.teams} acts={m.acts} />
      </section>
    </div>
  );
}
