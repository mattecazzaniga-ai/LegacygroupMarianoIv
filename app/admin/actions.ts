"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isValidDate } from "@/lib/dates";
import { DATA_TAG } from "@/lib/data/supabase";
import { TEAMS } from "@/lib/teams";
import { cookies } from "next/headers";
import { GATE_COOKIE } from "@/lib/supabase/pin";
import { requireUser, supabaseServer } from "@/lib/supabase/server";

/** Dopo ogni salvataggio il sito pubblico si aggiorna subito, senza aspettare il minuto. */
function refreshSite() {
  revalidateTag(DATA_TAG);
  revalidatePath("/", "layout");
}

const back = (path: string, msg?: string, err?: string): never => {
  const q = new URLSearchParams();
  if (msg) q.set("ok", msg);
  if (err) q.set("err", err);
  redirect(q.size ? `${path}?${q}` : path);
};

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  (await cookies()).delete({ name: GATE_COOKIE, path: "/admin" });
  redirect("/admin/login");
}

function readActivity(form: FormData) {
  const data = str(form, "data"),
    data_fine = str(form, "data_fine"),
    titolo = str(form, "titolo");
  if (!isValidDate(data)) return { error: "Data non valida." };
  if (data_fine && (!isValidDate(data_fine) || data_fine < data)) return { error: "La data di fine deve essere uguale o successiva alla data." };
  if (!titolo) return { error: "Scrivi il titolo." };
  const vincitore = str(form, "vincitore");
  if (vincitore && !TEAMS.some((t) => t.id === vincitore)) return { error: "Squadra vincitrice non valida." };
  return {
    row: {
      data,
      data_fine: data_fine || null,
      titolo,
      tipo: str(form, "tipo"),
      descrizione: str(form, "descrizione"),
      vincitore: vincitore || null,
    },
  };
}

export async function createActivity(form: FormData) {
  const { sb } = await requireUser();
  const r = readActivity(form);
  if (r.error) back("/admin", undefined, r.error);
  const { data, error } = await sb.from("attivita").insert({ ...r.row, pubblicata: false }).select("id").single();
  if (error || !data) back("/admin", undefined, "Salvataggio non riuscito: " + (error?.message ?? ""));
  back(`/admin/attivita/${data!.id}`, "Attività creata come bozza. Aggiungi i punti e pubblicala quando è pronta.");
}

export async function updateActivity(id: number, form: FormData) {
  const { sb } = await requireUser();
  const r = readActivity(form);
  const path = `/admin/attivita/${id}`;
  if (r.error) back(path, undefined, r.error);
  const { error } = await sb.from("attivita").update(r.row!).eq("id", id);
  if (error) back(path, undefined, "Salvataggio non riuscito: " + error.message);
  refreshSite();
  back(path, "Dati dell'attività salvati.");
}

export async function setFlags(id: number, flags: { pubblicata?: boolean; annullata?: boolean }) {
  const { sb } = await requireUser();
  const path = `/admin/attivita/${id}`;
  const { error } = await sb.from("attivita").update(flags).eq("id", id);
  if (error) back(path, undefined, "Operazione non riuscita: " + error.message);
  refreshSite();
  const msg =
    flags.pubblicata === true
      ? "Pubblicata: è sul sito."
      : flags.pubblicata === false
        ? "Tornata in bozza: non è più visibile sul sito."
        : flags.annullata
          ? "Segnata come annullata: i suoi punti non contano."
          : "Riattivata.";
  back(path, msg);
}

export async function deleteActivity(id: number) {
  const { sb } = await requireUser();
  const { error } = await sb.from("attivita").delete().eq("id", id);
  if (error) back(`/admin/attivita/${id}`, undefined, "Eliminazione non riuscita: " + error.message);
  refreshSite();
  back("/admin", "Attività eliminata (con i suoi punti).");
}

export interface PointRow {
  classe: string;
  punti: number;
  tipo: "collettiva" | "individuale";
}

export async function addPoints(id: number, rows: PointRow[]): Promise<{ error?: string }> {
  const { sb } = await requireUser();
  const clean = rows.filter((r) => r.classe);
  if (!clean.length) return { error: "Scegli almeno una classe." };
  for (const r of clean) {
    if (!Number.isInteger(r.punti) || r.punti < -1000 || r.punti > 1000) return { error: `Punti non validi per ${r.classe}: serve un numero intero.` };
    if (r.tipo !== "collettiva" && r.tipo !== "individuale") return { error: "Tipo non valido." };
  }
  const { error } = await sb.from("punti").insert(clean.map((r) => ({ attivita_id: id, classe: r.classe, punti: r.punti, tipo: r.tipo })));
  if (error) return { error: "Salvataggio non riuscito: " + error.message };
  refreshSite();
  revalidatePath(`/admin/attivita/${id}`);
  return {};
}

export async function deletePoint(activityId: number, pointId: number) {
  const { sb } = await requireUser();
  const { error } = await sb.from("punti").delete().eq("id", pointId);
  const path = `/admin/attivita/${activityId}`;
  if (error) back(path, undefined, "Eliminazione non riuscita: " + error.message);
  refreshSite();
  back(path, "Assegnazione eliminata.");
}

