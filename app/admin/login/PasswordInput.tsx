"use client";
import { useState } from "react";

/** Campo PIN con "Mostra": utile dal telefono per controllare cosa si è scritto. */
export default function PasswordInput() {
  const [show, setShow] = useState(false);
  return (
    <span className="pwbox">
      <input
        type={show ? "text" : "password"}
        name="pin"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
      />
      <button type="button" className="btn ghost sm" onClick={() => setShow(!show)} aria-pressed={show}>
        {show ? "Nascondi" : "Mostra"}
      </button>
    </span>
  );
}
