export default function Home() {
  return (
    <div className="container" style={{ textAlign: "center", paddingTop: 64 }}>
      <h1 style={{ fontSize: 40 }}>Encuentra al profe ideal</h1>
      <p className="muted" style={{ fontSize: 18, maxWidth: 480, margin: "0 auto 28px" }}>
        Profes verificados de confianza. Tú eliges. Tú contactas.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/buscar"><button className="btn btn-primary">Buscar profe</button></a>
        <a href="/registro"><button className="btn btn-secondary">Crear cuenta</button></a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 56, textAlign: "left" }}>
        <div className="card">
          <h3>Profes verificados</h3>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>Cada profe pasa un control antes de aparecer.</p>
        </div>
        <div className="card">
          <h3>Tú decides</h3>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>Filtra por asignatura, nivel y zona, y elige.</p>
        </div>
<div className="card">
          <h3>Contacto directo</h3>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>Habla con el profe desde la propia plataforma.</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 40, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20, background: "var(--tinta)", border: "none" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <span className="badge badge-verde" style={{ marginBottom: 10 }}><i className="ti ti-shield-check" /> También en PGAcademy</span>
          <h2 style={{ color: "#fff", margin: "0 0 8px" }}>¿Necesitas quien cuidemos de los niños por las tardes?</h2>
          <p style={{ color: "rgba(255,255,255,.8)", margin: 0, fontSize: 15 }}>
            Canguros verificados en Madrid y Palencia, cerca de tu barrio. Con la misma verificación que nuestros profes.
          </p>
        </div>
        <a href="/canguro"><button className="btn" style={{ background: "#fff", color: "var(--tinta)" }}>Descubrir canguros</button></a>
      </div>
    </div>
  );
}        
