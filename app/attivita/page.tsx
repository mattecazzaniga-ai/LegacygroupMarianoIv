import ActivityLog from "@/components/ActivityLog";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";

export const revalidate = 60;
export const metadata = meta("Registro attività", "Tutte le attività di Legacy Group con i punti assegnati, filtrabili per squadra, classe, tipologia e data.", "/attivita");

export default async function Attivita() {
  const { m } = await getSite();
  return (
    <div className="wrap">
      <section>
        <h1 className="sr-only">Registro attività</h1>
        <h2>
          Registro <span className="g">attività</span>
        </h2>
        <p className="sub">Tutte le attività che hanno generato punti.</p>
        <ActivityLog teams={m.teams} acts={m.acts} />
      </section>
    </div>
  );
}
