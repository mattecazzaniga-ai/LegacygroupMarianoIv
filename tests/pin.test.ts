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

describe("impronta del dispositivo", async () => {
  const { clientIp, deviceKey, minutesLeft } = await import("@/lib/supabase/pin");
  it("usa l'IP dato da Vercel e non lo salva in chiaro", () => {
    expect(clientIp(new Headers({ "x-vercel-forwarded-for": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    const k = deviceKey("1.2.3.4");
    expect(k).toMatch(/^[0-9a-f]{64}$/);
    expect(k).not.toContain("1.2.3.4");
    expect(deviceKey("1.2.3.5")).not.toBe(k);
  });
  it("IPv6: stesso telefono = stessa rete /64", async () => {
    const { deviceId } = await import("@/lib/supabase/pin");
    expect(deviceId("2001:db8:aa:1:1111:2222:3333:4444")).toBe("2001:db8:aa:1::/64");
    expect(deviceId("2001:db8:aa:1::99")).toBe("2001:db8:aa:1::/64");
    expect(deviceId("2001:0db8::1")).toBe("2001:db8:0:0::/64");
    expect(deviceId("1.2.3.4")).toBe("1.2.3.4");
  });

  it("minuti rimasti arrotondati per eccesso", () => {
    expect(minutesLeft(new Date(1_000_000 + 14.2 * 60000).toISOString(), 1_000_000)).toBe(15);
    expect(minutesLeft(new Date(1_000_000 + 5000).toISOString(), 1_000_000)).toBe(1);
  });
});
