import Link from "next/link";
import { Logo } from "@/components/ui";
import { meta } from "@/lib/meta";
import { getSite } from "@/lib/site";

export const revalidate = 60;
export const metadata = meta(
  "Le squadre",
  "Su Componidori, Mamuthones, Eleonora d'Arborea, Giganti di Monteprama, Shardana e Mariano IV: le sei squadre di Legacy Group e le loro classi.",
  "/squadre",
);

export default async function Squadre() {
  const { m } = await getSite();
  return (
    <div className="wrap">
      <section>
        <h1 className="sr-only">Le squadre</h1>
        <h2>
          Le <span className="g">squadre</span>
        </h2>
        <p className="sub">Tocca una squadra per vedere le sue classi.</p>
        <ul className="teams">
          {m.teams.map((g) => {
            const r = m.now.find((x) => x.team.id === g.id)!;
            return (
              <li key={g.id}>
                <Link className="tcard" style={{ ["--c" as string]: g.color }} href={`/squadra/${g.id}`}>
                  <Logo id={g.id} width={86} />
                  <div>
                    <div className="nm">{g.name}</div>
                    <div className="mt">
                      <span>{g.cname}</span>
                      <span>{g.classes.length} classi</span>
                    </div>
                    <div className="mt" style={{ marginTop: 4 }}>
                      {m.started ? r.pos + "° posto · " : ""}
                      <b style={{ color: "var(--gold)" }}>{r.pts} punti</b>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
