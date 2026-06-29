"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Nivel = { id: string; nombre: string; orden: number };
type Asig = { id: number; nivel_id: string; nombre: string };

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
const FRANJAS: Record<string, string[]> = {
  "Mañana": ["10-11", "11-12", "12-13", "13-14"],
  "Tarde": ["14-15", "15-16", "16-17", "17-18"],
  "Noche": ["18-19", "19-20", "20-21", "21-22"],
};

export default function NuevoAnuncio() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asigs, setAsigs] = useState<Asig[]>([]);

  const [nivelId, setNivelId] = useState("");
  const [asigId, setAsigId] = useState("");
  const [modalidad, setModalidad] = useState<"online" | "presencial">("online");
  const [zona, setZona] = useState("");
  const [desc, setDesc] = useState("");
  const [neeOn, setNeeOn] = useState(false);
  const [neeTexto, setNeeTexto] = useState("");
  const [neeConsent, setNeeConsent] = useState(false);
  const [presupMin, setPresupMin] = useState("");
  const [presupMax, setPresupMax] = useState("");
  const [clasesSem, setClasesSem] = useState("");
  const [slots, setSlots] = useState<Record<string, Set<string>>>({});
  const [msg, setMsg] = useState("");
  const [load, setLoad] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      setUid(s.user.id);
      const { data: nv } = await supabase.from("niveles").select("*").order("orden");
      setNiveles(nv ?? []);
      const { data: as } = await supabase.from("asignaturas").select("*");
      setAsigs(as ?? []);
    })();
  }, [router]);

  const asigsDeNivel = asigs.filter(a => a.nivel_id === nivelId);

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
    if (!nivelId || !asigId) { setMsg("Elige nivel y asignatura"); return; }
    if (!desc) { setMsg("Escribe la descripción"); return; }
    if (modalidad === "presencial" && !zona) { setMsg("Indica la zona"); return; }
    if (neeOn && neeTexto && !neeConsent) { setMsg("Marca el consentimiento para datos de necesidades especiales"); return; }
    if (!presupMin || !presupMax) { setMsg("Indica presupuesto mín y máx"); return; }
    if (Number(presupMin) > Number(presupMax)) { setMsg("El mínimo no puede ser mayor que el máximo"); return; }
    if (!clasesSem) { setMsg("Indica nº de clases por semana"); return; }
    const totalSlots = Object.values(slots).reduce((n, s) => n + s.size, 0);
    if (totalSlots === 0) { setMsg("Marca al menos una franja horaria"); return; }
    setLoad(true);

    const { data: anu, error } = await supabase.from("anuncios").insert({
      familia_id: uid, nivel_id: nivelId, asignatura_id: Number(asigId), modalidad,
      zona: modalidad === "presencial" ? zona : null,
      descripcion: desc,
      nee_texto: neeOn && neeTexto ? neeTexto : null,
      nee_consent: neeOn && neeTexto ? neeConsent : false,
      presup_min: Number(presupMin), presup_max: Number(presupMax),
      clases_semana: Number(clasesSem),
    }).select("id").single();
    if (error || !anu) { setMsg("Error: " + (error?.message ?? "")); setLoad(false); return; }

    const filas: { anuncio_id: number; dia: string; hora: string }[] = [];
    for (const dia of Object.keys(slots)) for (const hora of slots[dia]) filas.push({ anuncio_id: anu.id, dia, hora });
    if (filas.length) {
      const { error: e2 } = await supabase.from("anuncio_slot").insert(filas);
      if (e2) { setMsg("Anuncio creado pero error en horarios: " + e2.message); setLoad(false); return; }
    }
    router.push("/familia");
  }

  return (
    <div className="container-narrow" style={{ maxWidth: 600 }}>
      <h1>Publicar necesidad</h1>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Qué busco</h3>
        <select className="select" value={nivelId} onChange={e => { setNivelId(e.target.value); setAsigId(""); }}>
          <option value="">Nivel...</option>
          {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
        </select>
        {nivelId && (
          <select className="select" value={asigId} onChange={e => setAsigId(e.target.value)}>
            <option value="">Asignatura...</option>
            {asigsDeNivel.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        )}
        <select className="select" value={modalidad} onChange={e => setModalidad(e.target.value as never)}>
          <option value="online">Online</option>
          <option value="presencial">Presencial</option>
        </select>
        {modalidad === "presencial" && (
          <input className="input" placeholder="Zona" value={zona} onChange={e => setZona(e.target.value)} />
        )}
        <label className="label">Descripción</label>
        <textarea className="textarea" placeholder="Qué necesita, objetivo, dónde falla..." value={desc} onChange={e => setDesc(e.target.value)} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Necesidades especiales (opcional)</h3>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 15 }}>
          <input type="checkbox" checked={neeOn} onChange={e => setNeeOn(e.target.checked)} />
          Quiero indicar necesidades especiales (TDAH, dislexia...)
        </label>
        {neeOn && (
          <>
            <input className="input" placeholder="Describe la necesidad" value={neeTexto} onChange={e => setNeeTexto(e.target.value)} />
            <label style={{ display: "flex", gap: 8, fontSize: 13 }} className="muted">
              <input type="checkbox" checked={neeConsent} onChange={e => setNeeConsent(e.target.checked)} />
              Consiento que este dato de salud se trate y se muestre a los profes para encontrar el adecuado.
            </label>
          </>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Presupuesto y frecuencia</h3>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input" placeholder="€/h mín" value={presupMin} onChange={e => setPresupMin(e.target.value)} />
          <input className="input" placeholder="€/h máx" value={presupMax} onChange={e => setPresupMax(e.target.value)} />
        </div>
        <label className="label">Nº de clases por semana</label>
        <input className="input" placeholder="Ej. 2" value={clasesSem} onChange={e => setClasesSem(e.target.value)} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Disponibilidad</h3>
        <p className="muted" style={{ fontSize: 13 }}>Marca las horas que te vienen bien cada día (pueden ser distintas).</p>
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
                        background: on ? "var(--azul)" : "var(--surface)",
                        color: on ? "#fff" : "var(--ink)",
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