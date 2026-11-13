import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo, SecH, StatGrid } from "@/components/ui";
import { classPts } from "@/lib/calc/core";
import { fmt } from "@/lib/dates";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";
import { classSlug, TEAMS } from "@/lib/teams";

export const revalidate = 60;
/** Le 43 classi di partenza sono generate in anticipo; una classe nuova del foglio viene generata alla prima visita. */
export const generateStaticParams = () => TEAMS.flatMap((t) => t.classes.map((c) => ({ sigla: classSlug(c) })));

type P = { params: Promise<{ sigla: string }> };

export async function generateMetadata({ params }: P) {
  const { sigla } = await params;
  const { m } = await getSite();
  const c = Object.keys(m.teamOf).find((k) => classSlug(k) === sigla.toLowerCase());
  if (!c) return { title: "Classe non trovata" };
  return meta(`Classe ${c}`, `Punti individuali e collettivi della classe ${c} (${m.teamOf[c].name}) in Legacy Group.`, `/classe/${classSlug(c)}`);
}

export default async function Classe({ params }: P) {
  const { sigla } = await params;
  const { m } = await getSite();
  const c = Object.keys(m.teamOf).find((k) => classSlug(k) === sigla.toLowerCase());
  if (!c) notFound();
  const g = m.teamOf[c];
  const v = classPts(c, m.acts);
  const pos = 1 + g.classes.filter((x) => classPts(x, m.acts) > v).length;
  const ind = classPts(c, m.acts, "individuale"),
    col = classPts(c, m.acts, "collettiva");
  const hist = [...m.acts].reverse().flatMap((a) => a.awards.filter((w) => w.cls === c).map((w) => ({ a, w })));
  return (
    <div className="wrap">
      <section>
        <Link className="back" href={`/squadra/${g.id}`}>
          ← {g.name}
        </Link>
        <div className="thead">
          <Logo id={g.id} width={96} alt={`Stemma ${g.name}`} priority />
          <div>
            <div className="eyebrow">Classe · {g.name}</div>
            <h1>{c}</h1>
          </div>
        </div>
        <StatGrid
          items={[
            [v, "punti totali"],
            [v ? `${pos}° su ${g.classes.length}` : "–", "nella squadra"],
            [ind, "punti individuali"],
            [col, "punti collettivi"],
          ]}
        />
      </section>
      <section>
        <SecH t="Storico punti" sub="Ogni assegnazione compare una sola volta." />
        <div className="list">
          {hist.length ? (
            hist.map(({ a, w }, i) => (
              <article className="act" key={i}>
                <h3>
                  {w.pts > 0 ? "+" : ""}
                  {w.pts} · {a.title} <span className="badge">{w.kind === "individuale" ? "individuale" : "collettivo"}</span>
                </h3>
                <div className="d">{fmt(a.date)}</div>
                {a.desc ? <p>{a.desc}</p> : null}
              </article>
            ))
          ) : (
            <p className="empty">Questa classe non ha ancora ricevuto punti.</p>
          )}
        </div>
      </section>
    </div>
  );
}
