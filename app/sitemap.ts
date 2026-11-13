import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { classSlug, TEAMS } from "@/lib/teams";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/classifica", "/live", "/squadre", "/statistiche", "/rivalita", "/hall-of-fame", "/calendario", "/attivita", "/regolamento"];
  return [
    ...pages.map((p) => ({ url: SITE.url + p, changeFrequency: "hourly" as const })),
    ...TEAMS.map((t) => ({ url: `${SITE.url}/squadra/${t.id}` })),
    ...TEAMS.flatMap((t) => t.classes.map((c) => ({ url: `${SITE.url}/classe/${classSlug(c)}` }))),
  ];
}
