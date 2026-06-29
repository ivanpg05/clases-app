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

    // si filtran por nivel/asignatura, primero saco los profile_id que imparten eso
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
      // online → modalidad online o ambas; presencial → presencial o ambas
      if (fModalidad === "online") q = q.in("modalidad", ["online", "ambas"]);
      else q = q.in("modalidad", ["presencial", "ambas"]);
    }
    if (fZona) q = q.ilike("zona", `%${fZona}%`);

    const { data } = await q;
    setProfes((data ?? []) as unknown as Profe[]);
    setLoad(false);
  }

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Buscar profe</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <select value={fNivel} onChange={e => { setFNivel(e.target.value); setFAsig(""); }} style={sel}>
          <option value="">Todos los niveles</option>
          {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
        </select>
        <select value={fAsig} onChange={e => setFAsig(e.target.value)} style={sel} disabled={!fNivel}>
          <option value="">Todas las asignaturas</option>
          {asigsDeNivel.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <select value={fModalidad} onChange={e => setFModalidad(e.target.value)} style={sel}>
          <option value="">Cualquier modalidad</option>
          <option value="online">Online</option>
          <option value="presencial">Presencial</option>
        </select>
        <input placeholder="Zona..." value={fZona} onChange={e => setFZona(e.target.value)} style={sel} />
        <button onClick={buscar} style={{ padding: "8px 16px" }}>Buscar</button>
      </div>

      {load ? <p>Cargando...</p> : profes.length === 0 ? (
        <p style={{ color: "#888" }}>No hay profes que encajen con esos filtros.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {profes.map(p => (
            <a key={p.profile_id} href={`/profe/${p.profile_id}`}
              style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 14, display: "flex", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ddd", flex: "none" }} />
                <div>
                  <strong>{p.profiles?.nombre} {p.profiles?.apellidos}</strong>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    {p.modalidad}{p.zona ? ` · ${p.zona}` : ""}
                    {p.anios_exp ? ` · ${p.anios_exp} años exp.` : ""}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {p.precio_online ? `Online ${p.precio_online}€/h` : ""}
                    {p.precio_cerca ? ` · Presencial desde ${p.precio_cerca}€/h` : ""}
                  </div>
                  <p style={{ fontSize: 13, color: "#555", margin: "6px 0 0" }}>
                    {p.bio.slice(0, 90)}{p.bio.length > 90 ? "…" : ""}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const sel: React.CSSProperties = { padding: 8 };