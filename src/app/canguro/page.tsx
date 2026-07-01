export const metadata = { title: "Canguros · PGAcademy" };

export default function CanguroHome() {
  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <div style={{ textAlign: "center", paddingTop: 24 }}>
        <span className="badge badge-verde" style={{ marginBottom: 12 }}><i className="ti ti-shield-check" /> Personas verificadas</span>
        <h1 style={{ fontSize: 36 }}>Canguros de confianza para las tardes</h1>
        <p className="muted" style={{ fontSize: 18, maxWidth: 560, margin: "0 auto 24px" }}>
          Encuentra a alguien que cuide de tus hijos mientras no estás. En Madrid y Palencia, cerca de tu barrio, con verificación previa.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/canguro/buscar"><button className="btn btn-primary">Buscar canguro</button></a>
          <a href="/canguro/perfil"><button className="btn btn-secondary">Ofrecerme como canguro</button></a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 48 }}>
        <div className="card">
          <i className="ti ti-shield-check" style={{ fontSize: 28, color: "var(--verde)" }} />
          <h3 style={{ marginTop: 10 }}>Verificación obligatoria</h3>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Todos los canguros aportan el certificado de delitos de naturaleza sexual antes de aparecer. Sin excepciones.
          </p>
        </div>
        <div className="card">
          <i className="ti ti-map-pin" style={{ fontSize: 28, color: "var(--azul)" }} />
          <h3 style={{ marginTop: 10 }}>Cerca de ti</h3>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Filtra por ciudad y barrio y encuentra a alguien de tu zona, con disponibilidad por las tardes.
          </p>
        </div>
        <div className="card">
          <i className="ti ti-messages" style={{ fontSize: 28, color: "var(--azul)" }} />
          <h3 style={{ marginTop: 10 }}>Tú decides y contactas</h3>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Habla directamente con la persona desde la plataforma antes de nada. El trato siempre es entre adultos.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>Cómo funciona</h2>
        <div style={{ display: "grid", gap: 14, marginTop: 8 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span className="avatar" style={{ width: 30, height: 30, fontSize: 14, flex: "none" }}>1</span>
            <p style={{ margin: 0 }}>Busca canguros en tu ciudad y barrio, o publica lo que necesitas para que te escriban.</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span className="avatar" style={{ width: 30, height: 30, fontSize: 14, flex: "none" }}>2</span>
            <p style={{ margin: 0 }}>Habla con quien te encaje y resolvéis los detalles (horarios, tareas, tarifa).</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span className="avatar" style={{ width: 30, height: 30, fontSize: 14, flex: "none" }}>3</span>
            <p style={{ margin: 0 }}>Acordáis el cuidado con la tranquilidad de que la persona está verificada.</p>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 32, marginBottom: 8 }}>
        <p className="muted" style={{ fontSize: 14 }}>
          Por seguridad de los menores, nunca se piden nombres ni fotos de los niños: solo la información necesaria para organizar el cuidado.
        </p>
        <a href="/canguro/buscar"><button className="btn btn-primary" style={{ marginTop: 8 }}>Empezar a buscar</button></a>
      </div>
    </div>
  );
}