"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Ciudad = { id: string; nombre: string };
type Barrio = { id: number; ciudad_id: string; nombre: string };
type Canguro = {
  profile_id: string;
  bio: string;
  ciudad_id: string;
  tarifa: number;
  activo: boolean;
  profiles: { nombre: string; apellidos: string } | null;
};

function iniciales(n?: string, a?: string) {
  return `${(n?.[0] ?? "").toUpperCase()}${(a?.[0] ?? "").toUpperCase()}`;
}

export default function BuscarCanguro() {
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [ciudadesMap, setCiudadesMap] = useState<Record<string, string>>({});
  const [canguros, setCanguros] = useState<Canguro[]>([]);
  const [load, setLoad] = useState(true);

  const [fCiudad, setFCiudad] = useState("");
  const [fBarrio, setFBarrio] = useState("");

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("ciudades").select("*").order("orden");
      setCiudades(c ?? []);
      setCiudadesMap(Object.fromEntries((c ?? []).map(x => [x.id, x.nombre])));
      const { data: b } = await supabase.from("barrios").select("*");
      setBarrios(b ?? []);
      await buscar();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barriosDeCiudad = barrios.filter(b => b.ciudad_id === fCiudad);

  async function buscar() {
    setLoad(true);

    // si filtran por barrio, saco los profile_id que trabajan ahí
    let idsBarrio: string[] | null = null;
    if (fBarrio) {
      const { data } = await supabase.from("canguro_barrio").select("profile_id").eq("barrio_id", Number(fBarrio));
      idsBarrio = [...new Set((data ?? []).map(r => r.profile_id))];
      if (idsBarrio.length === 0) { setCanguros([]); setLoad(false); return; }
    }

    let q = supabase.from("canguro_perfil")
      .select("profile_id, bio, ciudad_id, tarifa, activo, profiles(nombre, apellidos)")
      .eq("activo", true);
    if (fCiudad) q = q.eq("ciudad_id", fCiudad);
    if (idsBarrio) q = q.in("profile_id", idsBarrio);

    const { data } = await q;
    setCanguros((data ?? []) as unknown as Canguro[]);
    setLoad(false);
  }

  return (
    <div className="container">
      <h1>Buscar canguro</h1>
      <p className="muted">Personas verificadas para cuidar de los niños por las tardes.</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, alignItems: "end" }}>
          <div>
            <label className="label" style={{ marginTop: 0 }}>Ciudad</label>
            <select className="select" value={fCiudad} onChange={e => { setFCiudad(e.target.value); setFBarrio(""); }}>
              <option value="">Todas</option>
              {ciudades.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label" style={{ marginTop: 0 }}>Barrio/zona</label>
            <select className="select" value={fBarrio} onChange={e => setFBarrio(e.target.value)} disabled={!fCiudad}>
              <option value="">Todos</option>
              {barriosDeCiudad.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>
        </div>
        <button onClick={buscar} className="btn btn-primary" style={{ marginTop: 12 }}>Buscar</button>
      </div>

      {load ? <p className="muted">Cargando...</p> : canguros.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted" style={{ margin: 0 }}>No hay canguros que encajen con ese filtro todavía.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {canguros.map(c => (
            <a key={c.profile_id} href={`/canguro/${c.profile_id}`} className="card card-link">
              <div style={{ display: "flex", gap: 14 }}>
                <div className="avatar" style={{ width: 52, height: 52, fontSize: 16 }}>
                  {iniciales(c.profiles?.nombre, c.profiles?.apellidos)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--ink)" }}>
                      {c.profiles?.nombre} {c.profiles?.apellidos}
                    </span>
                    <span className="badge badge-verde"><i className="ti ti-shield-check" /> Verificado</span>
                  </div>
                  <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>
                    {ciudadesMap[c.ciudad_id]} · {c.tarifa}€/h
                  </div>
                  <p style={{ fontSize: 14, color: "var(--ink)", margin: "8px 0 0" }}>
                    {c.bio.slice(0, 100)}{c.bio.length > 100 ? "…" : ""}
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