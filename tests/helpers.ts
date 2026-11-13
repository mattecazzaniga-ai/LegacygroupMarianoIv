import { TEAMS } from "@/lib/teams";
import type { Activity, Award, Kind, Team } from "@/lib/types";

export const teams: Team[] = TEAMS.map((t) => ({ ...t, classes: [...t.classes] }));
export const T = Object.fromEntries(teams.map((t) => [t.id, t])) as Record<string, Team>;

/** Una classe qualsiasi della squadra (la prima). */
export const C = (teamId: string, i = 0) => T[teamId].classes[i];

let n = 0;
export function act(date: string, awards: [string, number, Kind?][], title?: string): Activity {
  n++;
  return {
    id: "t" + n,
    date,
    title: title ?? "Attività " + n,
    type: "",
    desc: "",
    awards: awards.map(([cls, pts, kind]): Award => ({ cls, pts, kind: kind ?? "collettiva" })),
  };
}
