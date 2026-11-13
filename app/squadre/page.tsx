import Link from "next/link";
import { Logo, PageHead } from "@/components/ui";
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
        <PageHead eyebrow="Sei squadre · 43 classi" title="Le squadre" sub="Ogni classe gioca per una squadra. Apri una squadra per vedere le sue classi." />
        <ul className="teams">
          {m.teams.map((g) => {
            const r = m.now.find((x) => x.team.id === g.id)!;
            return (
              <li key={g.id}>
                <Link className="tcard" href={`/squadra/${g.id}`}>
                  <Logo id={g.id} width={72} />
                  <div>
                    <div className="nm">{g.name}</div>
                    <div className="mt">
                      <span className="swatch">
                        <span className="dot" style={{ background: g.color }} aria-hidden="true" />
                        {g.cname}
                      </span>
                      <span>{g.classes.length} classi</span>
                      {m.started ? <span>{r.pos}° posto</span> : null}
                    </div>
                  </div>
                  <div className="pt">
                    {r.pts}
                    <small>punti</small>
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
