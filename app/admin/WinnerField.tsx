import { TEAMS } from "@/lib/teams";

/** Campo "squadra vincitrice": vuoto = la sfida non prevede un vincitore. */
export default function WinnerField({ value }: { value?: string | null }) {
  return (
    <label>
      Squadra vincitrice (facoltativo)
      <select name="vincitore" defaultValue={value ?? ""}>
        <option value="">Nessuna: la sfida non prevede un vincitore</option>
        {TEAMS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <span className="muted" style={{ fontWeight: 400 }}>
        Per tornei, quizzoni e prove con un vincitore. Compare nella Hall of Fame, nel calendario e negli scontri diretti. Non cambia la classifica.
      </span>
    </label>
  );
}
