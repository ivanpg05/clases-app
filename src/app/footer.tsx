export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", marginTop: 48 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: "var(--tinta)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>PG</span>
          <span className="muted" style={{ fontSize: 14 }}>© {new Date().getFullYear()} PGAcademy</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 14 }}>
          <a href="/legal/aviso" style={{ color: "var(--muted)", textDecoration: "none" }}>Aviso legal</a>
          <a href="/legal/privacidad" style={{ color: "var(--muted)", textDecoration: "none" }}>Privacidad</a>
          <a href="/legal/cookies" style={{ color: "var(--muted)", textDecoration: "none" }}>Cookies</a>
          <a href="/legal/condiciones" style={{ color: "var(--muted)", textDecoration: "none" }}>Condiciones</a>
        </div>
      </div>
    </footer>
  );
}