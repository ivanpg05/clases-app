"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Nivel = { id: string; nombre: string; orden: number };
type Asig = { id: number; nivel_id: string; nombre: string };
type Profe = {
  profile_id: string;
  bio: string;
  modalidad: string;
  zona: string | null;
  precio_online: number | null;
  precio_cerca: number | null;
  anios_exp: number | null;
  profiles: { nombre: string; apellidos: string; foto_url: string | null } | null;
};

function iniciales(n?: string, a?: string) {
  return `${(n?.[0] ?? "").toUpperCase()}${(a?.[0] ?? "").toUpperCase()}`;
}

export default function Buscar() {
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asigs, setAsigs] = useState<Asig[]>([]);
  const [profes, setProfes] = useState<Profe[]>([]);
  const [load, setLoad] = useState(true);

  const [fNivel, setFNivel] = useState("");
  const [fAsig, setFAsig] = useState("");
  const [fModalidad, setFModalidad] = useState("");
  const [fZona, setFZona] = useState("");

  useEffect(() => {
    (async () => {
      const { data: nv } = await supabase.from("niveles").select("*").order("orden");
      setNiveles(nv ?? []);
      const { data: as } = await supabase.from("asignaturas").select("*");
      setAsigs(as ?? []);
      await buscar();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const asigsDeNivel = asigs.filter(a => a.nivel_id === fNivel);

  async function buscar() {
    setLoad(true);
    let idsFiltrados: string[] | null = null;
    if (fNivel || fAsig) {
      let q = supabase.from("profe_imparte").select("profile_id");
      if (fNivel) q = q.eq("nivel_id", fNivel);
      if (fAsig) q = q.eq("asignatura_id", Number(fAsig));
      const { data } = await q;
      idsFiltrados = [...new Set((data ?? []).map(r => r.profile_id))];
      if (idsFiltrados.length === 0) { setProfes([]); setLoad(false); return; }
    }
    let q = supabase
      .from("profe_perfil")
      .select("profile_id, bio, modalidad, zona, precio_online, precio_cerca, anios_exp, profiles(nombre, apellidos, foto_url)")
      .eq("visible", true);
    if (idsFiltrados) q = q.in("profile_id", idsFiltrados);
    if (fModalidad) {
      if (fModalidad === "online") q = q.in("modalidad", ["online", "ambas"]);
      else q = q.in("modalidad", ["presencial", "ambas"]);
    }
    if (fZona) q = q.ilike("zona", `%${fZona}%`);
    const { data } = await q;
    setProfes((data ?? []) as unknown as Profe[]);
    setLoad(false);
  }

  return (
    <div className="container">
      <h1>Buscar profe</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, alignItems: "end" }}>
          <div>
            <label className="label" style={{ marginTop: 0 }}>Nivel</label>
            <select className="select" value={fNivel} onChange={e => { setFNivel(e.target.value); setFAsig(""); }}>
              <option value="">Todos</option>
              {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label" style={{ marginTop: 0 }}>Asignatura</label>
            <select className="select" value={fAsig} onChange={e => setFAsig(e.target.value)} disabled={!fNivel}>
              <option value="">Todas</option>
              {asigsDeNivel.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label" style={{ marginTop: 0 }}>Modalidad</label>
            <select className="select" value={fModalidad} onChange={e => setFModalidad(e.target.value)}>
              <option value="">Cualquiera</option>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>
          <div>
            <label className="label" style={{ marginTop: 0 }}>Zona</label>
            <input className="input" placeholder="Zona..." value={fZona} onChange={e => setFZona(e.target.value)} />
          </div>
        </div>
        <button onClick={buscar} className="btn btn-primary" style={{ marginTop: 12 }}>Buscar</button>
      </div>

      {load ? <p className="muted">Cargando...</p> : profes.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted" style={{ margin: 0 }}>No hay profes que encajen con esos filtros.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {profes.map(p => (
            <a key={p.profile_id} href={`/profe/${p.profile_id}`} className="card card-link">
              <div style={{ display: "flex", gap: 14 }}>
                <div className="avatar" style={{ width: 52, height: 52, fontSize: 16 }}>
                  {iniciales(p.profiles?.nombre, p.profiles?.apellidos)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--ink)" }}>
                      {p.profiles?.nombre} {p.profiles?.apellidos}
                    </span>
                    <span className="badge badge-verde"><i className="ti ti-shield-check" /> Verificado</span>
                  </div>
                  <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>
                    {p.modalidad}{p.zona ? ` · ${p.zona}` : ""}{p.anios_exp ? ` · ${p.anios_exp} años exp.` : ""}
                  </div>
                  <p style={{ fontSize: 14, color: "var(--ink)", margin: "8px 0 0" }}>
                    {p.bio.slice(0, 100)}{p.bio.length > 100 ? "…" : ""}
                  </p>
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                    {p.precio_online ? `Online ${p.precio_online}€/h` : ""}
                    {p.precio_cerca ? `${p.precio_online ? " · " : ""}Presencial desde ${p.precio_cerca}€/h` : ""}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}