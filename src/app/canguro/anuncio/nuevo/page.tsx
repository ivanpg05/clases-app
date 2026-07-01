"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Ciudad = { id: string; nombre: string };
type Barrio = { id: number; ciudad_id: string; nombre: string };

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
const FRANJAS: Record<string, string[]> = {
  "Mañana": ["10-11", "11-12", "12-13", "13-14"],
  "Tarde": ["14-15", "15-16", "16-17", "17-18"],
  "Noche": ["18-19", "19-20", "20-21", "21-22"],
};
const TAREAS = ["Recoger del colegio", "Ayuda con deberes", "Preparar comida/cena", "Baño y rutina", "Juegos y paseo", "Llevar a actividades", "Llevar a extraescolares"];

export default function NuevoAnuncioCanguro() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);

  const [ciudadId, setCiudadId] = useState("");
  const [barrioId, setBarrioId] = useState("");
  const [numNinos, setNumNinos] = useState("");
  const [edad, setEdad] = useState("");
  const [tareasSel, setTareasSel] = useState<string[]>([]);
  const [desc, setDesc] = useState("");
  const [tarifaMin, setTarifaMin] = useState("");
  const [tarifaMax, setTarifaMax] = useState("");
  const [slots, setSlots] = useState<Record<string, Set<string>>>({});

  const [msg, setMsg] = useState("");
  const [load, setLoad] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      setUid(s.user.id);
      const { data: c } = await supabase.from("ciudades").select("*").order("orden");
      setCiudades(c ?? []);
      const { data: b } = await supabase.from("barrios").select("*");
      setBarrios(b ?? []);
    })();
  }, [router]);

  const barriosDeCiudad = barrios.filter(b => b.ciudad_id === ciudadId);

  function toggleTarea(t: string) {
    setTareasSel(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }
  function toggleHora(dia: string, hora: string) {
    setSlots(prev => {
      const set = new Set(prev[dia] ?? []);
      set.has(hora) ? set.delete(hora) : set.add(hora);
      return { ...prev, [dia]: set };
    });
  }

  async function publicar() {
    setMsg("");
    if (!uid) return;
    if (!ciudadId || !barrioId) { setMsg("Elige ciudad y barrio"); return; }
    if (!numNinos) { setMsg("Indica cuántos niños"); return; }
    if (!edad) { setMsg("Indica la edad aproximada"); return; }
    if (!desc) { setMsg("Escribe una descripción"); return; }
    if (!tarifaMin || !tarifaMax) { setMsg("Indica tarifa mín y máx"); return; }
    if (Number(tarifaMin) > Number(tarifaMax)) { setMsg("El mínimo no puede ser mayor que el máximo"); return; }
    const totalSlots = Object.values(slots).reduce((n, s) => n + s.size, 0);
    if (totalSlots === 0) { setMsg("Marca al menos una franja horaria"); return; }

    setLoad(true);
    const { data: anu, error } = await supabase.from("canguro_anuncio").insert({
      familia_id: uid, ciudad_id: ciudadId, barrio_id: Number(barrioId),
      num_ninos: Number(numNinos), edad_aprox: edad,
      tareas: tareasSel.length ? tareasSel.join(", ") : null,
      descripcion: desc, tarifa_min: Number(tarifaMin), tarifa_max: Number(tarifaMax),
    }).select("id").single();
    if (error || !anu) { setMsg("Error: " + (error?.message ?? "")); setLoad(false); return; }

    const filas: { anuncio_id: number; dia: string; hora: string }[] = [];
    for (const dia of Object.keys(slots)) for (const hora of slots[dia]) filas.push({ anuncio_id: anu.id, dia, hora });
    if (filas.length) {
      const { error: e2 } = await supabase.from("canguro_anuncio_slot").insert(filas);
      if (e2) { setMsg("Anuncio creado pero error en horarios: " + e2.message); setLoad(false); return; }
    }
    router.push("/canguro/tablon");
  }

  return (
    <div className="container-narrow" style={{ maxWidth: 600 }}>
      <h1>Buscar canguro</h1>
      <p className="muted" style={{ fontSize: 14 }}>Publica lo que necesitas y los canguros verificados podrán escribirte.</p>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Dónde</h3>
        <select className="select" value={ciudadId} onChange={e => { setCiudadId(e.target.value); setBarrioId(""); }}>
          <option value="">Ciudad...</option>
          {ciudades.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        {ciudadId && (
          <select className="select" value={barrioId} onChange={e => setBarrioId(e.target.value)}>
            <option value="">Barrio/zona...</option>
            {barriosDeCiudad.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Los niños</h3>
        <label className="label">¿Cuántos niños?</label>
        <input className="input" placeholder="Ej. 2" value={numNinos} onChange={e => setNumNinos(e.target.value)} />
        <label className="label">Edad aproximada</label>
        <input className="input" placeholder="Ej. 4 y 7 años" value={edad} onChange={e => setEdad(e.target.value)} />
        <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>No pongas nombres ni datos personales del menor, solo número y edad aproximada.</p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Tareas</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TAREAS.map(t => {
            const on = tareasSel.includes(t);
            return (
              <button key={t} onClick={() => toggleTarea(t)} style={{
                padding: "5px 10px", fontSize: 13, borderRadius: 999, cursor: "pointer",
                border: "1px solid " + (on ? "var(--azul)" : "var(--border)"),
                background: on ? "var(--azul)" : "var(--surface)", color: on ? "#fff" : "var(--ink)",
              }}>{t}</button>
            );
          })}
        </div>
        <label className="label" style={{ marginTop: 12 }}>Descripción</label>
        <textarea className="textarea" placeholder="Qué necesitas, horarios, detalles..." value={desc} onChange={e => setDesc(e.target.value)} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Tarifa (€/h)</h3>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input" placeholder="€/h mín" value={tarifaMin} onChange={e => setTarifaMin(e.target.value)} />
          <input className="input" placeholder="€/h máx" value={tarifaMax} onChange={e => setTarifaMax(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Disponibilidad</h3>
        {DIAS.map(dia => (
          <div key={dia} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 12, margin: "8px 0" }}>
            <strong style={{ fontFamily: "var(--font-display)", color: "var(--tinta)" }}>{dia}</strong>
            {Object.entries(FRANJAS).map(([franja, horas]) => (
              <div key={franja} style={{ margin: "8px 0 0" }}>
                <span className="muted" style={{ fontSize: 12 }}>{franja}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {horas.map(h => {
                    const on = slots[dia]?.has(h);
                    return (
                      <button key={h} onClick={() => toggleHora(dia, h)} style={{
                        padding: "5px 10px", fontSize: 13, borderRadius: 999, cursor: "pointer",
                        border: "1px solid " + (on ? "var(--azul)" : "var(--border)"),
                        background: on ? "var(--azul)" : "var(--surface)", color: on ? "#fff" : "var(--ink)",
                      }}>{h}</button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {msg && <p className="text-error" style={{ marginTop: 14 }}>{msg}</p>}
      <button onClick={publicar} disabled={load} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
        {load ? "Publicando..." : "Publicar anuncio"}
      </button>
    </div>
  );
}