"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export const ROUTES: [string, string][] = [
  ["/", "Home"],
  ["/squadre", "Squadre"],
  ["/statistiche", "Statistiche"],
  ["/rivalita", "Rivalità"],
  ["/hall-of-fame", "Hall of Fame"],
  ["/calendario", "Calendario"],
  ["/regolamento", "Regolamento"],
];
const BNAV: [string, string][] = [
  ["/", "Home"],
  ["/squadre", "Squadre"],
  ["/statistiche", "Statistiche"],
  ["/calendario", "Calendario"],
];

/** Sezione attiva: squadre e classi stanno sotto "Squadre". */
function section(path: string) {
  if (path.startsWith("/squadra/") || path.startsWith("/classe/")) return "/squadre";
  return path;
}

export default function Nav() {
  const path = section(usePathname() || "/");
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      openerRef.current?.focus();
    };
  }, [open]);

  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    openerRef.current = e.currentTarget;
    setOpen(true);
  };
  const cur = (r: string) => (r === path ? "page" : undefined);

  return (
    <>
      <nav className="nav" aria-label="Principale">
        <div className="wrap">
          <Link className="brand" href="/" aria-label="Legacy Group, home">
            Legacy <b>Group</b>
          </Link>
          <div className="tabs">
            {ROUTES.map(([r, l]) => (
              <Link key={r} href={r} className={r === path ? "on" : undefined} aria-current={cur(r)}>
                {l}
              </Link>
            ))}
          </div>
          <button type="button" className="menu-btn" aria-haspopup="dialog" aria-expanded={open} onClick={openMenu}>
            Menu
          </button>
        </div>
      </nav>
      <div className={"ov" + (open ? " open" : "")} role="dialog" aria-modal="true" aria-label="Menu" hidden={!open}>
        <div className="ov-h">
          <span className="brand">
            Legacy <b>Group</b>
          </span>
          <button type="button" className="menu-btn" ref={closeRef} onClick={() => setOpen(false)}>
            Chiudi
          </button>
        </div>
        <div className="grid">
          {ROUTES.map(([r, l]) => (
            <Link key={r} href={r} className={r === path ? "on" : undefined} aria-current={cur(r)} onClick={() => setOpen(false)}>
              {l}
            </Link>
          ))}
        </div>
      </div>
      <nav className="bnav" aria-label="Navigazione rapida">
        {BNAV.map(([r, l]) => (
          <Link key={r} href={r} className={r === path ? "on" : undefined} aria-current={cur(r)}>
            {l}
          </Link>
        ))}
        <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={openMenu}>
          Altro
        </button>
      </nav>
    </>
  );
}
