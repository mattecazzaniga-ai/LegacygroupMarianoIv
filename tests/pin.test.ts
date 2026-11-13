import { beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

beforeAll(() => {
  process.env.ADMIN_PIN = "Prova12";
  process.env.ADMIN_EMAIL = "tecnico@example.org";
  process.env.ADMIN_PASSWORD = "segreto-di-prova";
});

describe("accesso con PIN", async () => {
  const { checkPin, newPass, validPass } = await import("@/lib/supabase/pin");

  it("accetta il PIN anche con maiuscole o spazi del telefono, rifiuta gli altri", () => {
    expect(checkPin("prova12")).toBe(true);
    expect(checkPin(" Prova12 ")).toBe(true);
    expect(checkPin("prova1")).toBe(false);
    expect(checkPin("")).toBe(false);
  });

  it("il pass vale 2 ore e non si può falsificare", () => {
    const t = 1_800_000_000_000;
    const p = newPass(t);
    expect(validPass(p, t + 60_000)).toBe(true);
    expect(validPass(p, t + 3 * 60 * 60 * 1000)).toBe(false);
    expect(validPass(`${t}.abc`, t)).toBe(false);
    expect(validPass(undefined, t)).toBe(false);
  });

  it("cambiare il PIN invalida i pass già dati", () => {
    const t = Date.now();
    const p = newPass(t);
    process.env.ADMIN_PIN = "altro99";
    expect(validPass(p, t)).toBe(false);
  });
});
