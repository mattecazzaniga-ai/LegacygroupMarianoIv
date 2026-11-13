import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <section>
        <h1 style={{ fontFamily: "var(--display)", textTransform: "uppercase", fontSize: 34 }}>Pagina non trovata</h1>
        <p className="sub" style={{ marginTop: 12 }}>
          <Link className="btn ghost" href="/">
            Torna alla home
          </Link>
        </p>
      </section>
    </div>
  );
}
