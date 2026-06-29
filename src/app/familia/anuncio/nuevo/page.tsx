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

  // disponibilidad: { "L": Set<"10-11",...> }
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
      familia_id: uid,
      nivel_id: nivelId,
      asignatura_id: Number(asigId),
      modalidad,
      zona: modalidad === "presencial" ? zona : null,
      descripcion: desc,
      nee_texto: neeOn && neeTexto ? neeTexto : null,
      nee_consent: neeOn && neeTexto ? neeConsent : false,
      presup_min: Number(presupMin),
      presup_max: Number(presupMax),
      clases_semana: Number(clasesSem),
    }).select("id").single();

    if (error || !anu) { setMsg("Error: " + (error?.message ?? "")); setLoad(false); return; }

    const filas: { anuncio_id: number; dia: string; hora: string }[] = [];
    for (const dia of Object.keys(slots)) {
      for (const hora of slots[dia]) filas.push({ anuncio_id: anu.id, dia, hora });
    }
    if (filas.length) {
      const { error: e2 } = await supabase.from("anuncio_slot").insert(filas);
      if (e2) { setMsg("Anuncio creado pero error en horarios: " + e2.message); setLoad(false); return; }
    }

    router.push("/familia");
  }

  return (
    <div style={{ maxWidth: 560, margin: "32px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Publicar necesidad</h1>

      <h3>Qué busco</h3>
      <select value={nivelId} onChange={e => { setNivelId(e.target.value); setAsigId(""); }} style={inp}>
        <option value="">Nivel...</option>
        {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
      </select>
      {nivelId && (
        <select value={asigId} onChange={e => setAsigId(e.target.value)} style={inp}>
          <option value="">Asignatura...</option>
          {asigsDeNivel.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      )}

      <select value={modalidad} onChange={e => setModalidad(e.target.value as never)} style={inp}>
        <option value="online">Online</option>
        <option value="presencial">Presencial</option>
      </select>
      {modalidad === "presencial" && (
        <input placeholder="Zona" value={zona} onChange={e => setZona(e.target.value)} style={inp} />
      )}

      <textarea placeholder="Descripción: qué necesita, objetivo, dónde falla..."
        value={desc} onChange={e => setDesc(e.target.value)} style={{ ...inp, height: 90 }} />

      <h3>Necesidades especiales (opcional)</h3>
      <label style={{ display: "block", margin: "4px 0" }}>
        <input type="checkbox" checked={neeOn} onChange={e => setNeeOn(e.target.checked)} /> Quiero indicar necesidades especiales (TDAH, dislexia...)
      </label>
      {neeOn && (
        <>
          <input placeholder="Describe la necesidad" value={neeTexto}
            onChange={e => setNeeTexto(e.target.value)} style={inp} />
          <label style={{ display: "block", margin: "4px 0", fontSize: 13, color: "#555" }}>
            <input type="checkbox" checked={neeConsent} onChange={e => setNeeConsent(e.target.checked)} />{" "}
            Consiento que este dato de salud se trate y se muestre a los profes para encontrar el adecuado.
          </label>
        </>
      )}

      <h3>Presupuesto y frecuencia</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="€/h mín" value={presupMin} onChange={e => setPresupMin(e.target.value)} style={inp} />
        <input placeholder="€/h máx" value={presupMax} onChange={e => setPresupMax(e.target.value)} style={inp} />
      </div>
      <input placeholder="Nº clases por semana" value={clasesSem}
        onChange={e => setClasesSem(e.target.value)} style={inp} />

      <h3>Disponibilidad</h3>
      <p style={{ color: "#888", fontSize: 13 }}>Marca las horas que te vienen bien cada día (pueden ser distintas).</p>
      {DIAS.map(dia => (
        <div key={dia} style={{ border: "1px solid #ddd", borderRadius: 6, padding: 8, margin: "6px 0" }}>
          <strong>{dia}</strong>
          {Object.entries(FRANJAS).map(([franja, horas]) => (
            <div key={franja} style={{ margin: "4px 0" }}>
              <span style={{ fontSize: 12, color: "#777" }}>{franja}: </span>
              {horas.map(h => {
                const on = slots[dia]?.has(h);
                return (
                  <button key={h} onClick={() => toggleHora(dia, h)}
                    style={{ margin: 2, padding: "2px 6px", fontSize: 12,
                      background: on ? "#222" : "#eee", color: on ? "#fff" : "#000",
                      border: "none", borderRadius: 4, cursor: "pointer" }}>
                    {h}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ))}

      {msg && <p style={{ color: "red" }}>{msg}</p>}
      <button onClick={publicar} disabled={load} style={{ width: "100%", padding: 12, marginTop: 12 }}>
        {load ? "Publicando..." : "Publicar anuncio"}
      </button>
    </div>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: 8, margin: "6px 0", boxSizing: "border-box" };