import { Board, Podium, PowerBoard } from "@/components/blocks";
import { PageHead, SecH } from "@/components/ui";
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
        <PageHead
          eyebrow={m.started ? `Dopo ${m.acts.length} attività` : "Stagione 2026/27"}
          title="Classifica"
          sub={m.started ? "A pari punti, stessa posizione. ▲▼ confronta con la classifica prima dell'ultima attività." : "La competizione non è ancora iniziata: tutte le squadre sono a zero."}
        />
        <Podium m={m} />
        <Board m={m} detail />
      </section>
      <section>
        <SecH t="Power Ranking" sub="La forma del momento. Non sostituisce la classifica." />
        <PowerBoard m={m} />
      </section>
    </div>
  );
}
