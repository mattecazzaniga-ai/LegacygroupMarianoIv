import CalendarView from "@/components/CalendarView";
import { SecH } from "@/components/ui";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";

export const revalidate = 60;
export const metadata = meta("Calendario", "Calendario mensile di Legacy Group: attività programmate, in corso, concluse e annullate, con i punti assegnati.", "/calendario");

export default async function Calendario() {
  const { m, ds } = await getSite();
  return (
    <div className="wrap">
      <section>
        <h1 className="sr-only">Calendario</h1>
        <SecH t="Calendario" sub="Attività programmate, in corso e concluse, con i punti assegnati." />
        <CalendarView teams={m.teams} acts={m.acts} events={ds.events} today={m.today} />
      </section>
    </div>
  );
}
