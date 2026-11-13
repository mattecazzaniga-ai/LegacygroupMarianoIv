import { TEAMS } from "@/lib/teams";

/** Campo "squadra vincitrice": vuoto = automatico (vince chi ha più punti). */
export default function WinnerField({ value }: { value?: string | null }) {
  return (
    <label>
      Squadra vincitrice (facoltativo)
      <select name="vincitore" defaultValue={value ?? ""}>
        <option value="">Automatica: chi ha più punti</option>
        {TEAMS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <span className="muted" style={{ fontWeight: 400 }}>
        Compare nella Hall of Fame. Serve anche per prove senza punti. Non cambia la classifica.
      </span>
    </label>
  );
}
