import { Board, Podium, PowerBoard } from "@/components/blocks";
import { SecH } from "@/components/ui";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";

export const revalidate = 60;
export const metadata = meta(
  "Classifica",
  "Classifica generale di Legacy Group: punti, posizioni e variazioni delle sei squadre dell'Istituto Mariano IV di Oristano.",
  "/classifica",
);

export default async function Classifica() {
  const { m } = await getSite();
  return (
    <div className="wrap">
      <section>
        <h1 className="sr-only">Classifica</h1>
        <SecH t="Classifica" g="generale" sub={m.started ? "Le squadre con gli stessi punti hanno la stessa posizione." : "La competizione non è ancora iniziata: tutte le squadre sono a zero."} />
        <Podium m={m} />
        <Board m={m} detail />
        <p className="sub" style={{ marginTop: 14 }}>
          La variazione ▲▼ confronta la posizione con quella prima dell&apos;ultima attività.
        </p>
      </section>
      <section>
        <SecH t="Power" g="Ranking" sub="La forma del momento, non la classifica ufficiale." />
        <PowerBoard m={m} />
      </section>
    </div>
  );
}
