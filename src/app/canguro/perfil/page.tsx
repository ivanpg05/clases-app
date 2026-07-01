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

export default function CanguroPerfil() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [verificado, setVerificado] = useState(false);

  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);

  const [bio, setBio] = useState("");
  const [ciudadId, setCiudadId] = useState("");
  const [tarifa, setTarifa] = useState("");
  const [barriosSel, setBarriosSel] = useState<number[]>([]);
  const [slots, setSlots] = useState<Record<string, Set<string>>>({});

  const [existe, setExiste] = useState(false);
  const [msg, setMsg] = useState("");
  const [load, setLoad] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      setUid(s.user.id);

      // ¿está verificado como profe? (requisito para ser canguro)
      const { data: pp } = await supabase.from("profe_perfil").select("visible").eq("profile_id", s.user.id).maybeSingle();
      setVerificado(pp?.visible === true);

      const { data: c } = await supabase.from("ciudades").select("*").order("orden");
      setCiudades(c ?? []);
      const { data: b } = await supabase.from("barrios").select("*");
      setBarrios(b ?? []);

      // cargar perfil canguro previo si existe
      const { data: cp } = await supabase.from("canguro_perfil").select("*").eq("profile_id", s.user.id).maybeSingle();
      if (cp) {
        setExiste(true);
        setBio(cp.bio ?? ""); setCiudadId(cp.ciudad_id ?? ""); setTarifa(cp.tarifa?.toString() ?? "");
        const { data: cb } = await supabase.from("canguro_barrio").select("barrio_id").eq("profile_id", s.user.id);
        setBarriosSel((cb ?? []).map(x => x.barrio_id));
        const { data: cs } = await supabase.from("canguro_slot").select("dia, hora").eq("profile_id", s.user.id);
        const map: Record<string, Set<string>> = {};
        (cs ?? []).forEach(r => { (map[r.dia] ??= new Set()).add(r.hora); });
        setSlots(map);
      }
      setCargando(false);
    })();
  }, [router]);

  const barriosDeCiudad = barrios.filter(b => b.ciudad_id === ciudadId);

  function toggleBarrio(id: number) {
    setBarriosSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }
  function toggleHora(dia: string, hora: string) {
    setSlots(prev => {
      const set = new Set(prev[dia] ?? []);
      set.has(hora) ? set.delete(hora) : set.add(hora);
      return { ...prev, [dia]: set };
    });
  }

  async function guardar() {
    setMsg("");
    if (!uid) return;
    if (!bio) { setMsg("Escribe una bio"); return; }
    if (!ciudadId) { setMsg("Elige ciudad"); return; }
    if (!tarifa) { setMsg("Indica tu tarifa €/h"); return; }
    if (barriosSel.length === 0) { setMsg("Elige al menos un barrio/zona"); return; }
    const totalSlots = Object.values(slots).reduce((n, s) => n + s.size, 0);
    if (totalSlots === 0) { setMsg("Marca al menos una franja de disponibilidad"); return; }

    setLoad(true);
    const { error: e1 } = await supabase.from("canguro_perfil").upsert({
      profile_id: uid, bio, ciudad_id: ciudadId, tarifa: Number(tarifa), activo: true,
    });
    if (e1) { setMsg("Error: " + e1.message); setLoad(false); return; }

    // barrios: borrar e insertar
    await supabase.from("canguro_barrio").delete().eq("profile_id", uid);
    const fb = barriosSel.map(id => ({ profile_id: uid, barrio_id: id }));
    if (fb.length) { await supabase.from("canguro_barrio").insert(fb); }

    // slots: borrar e insertar
    await supabase.from("canguro_slot").delete().eq("profile_id", uid);
    const fs: { profile_id: string; dia: string; hora: string }[] = [];
    for (const dia of Object.keys(slots)) for (const hora of slots[dia]) fs.push({ profile_id: uid, dia, hora });
    if (fs.length) { await supabase.from("canguro_slot").insert(fs); }

    setLoad(false);
    setExiste(true);
    setMsg("Perfil de canguro guardado ✔");
  }

  async function desactivar() {
    if (!uid) return;
    await supabase.from("canguro_perfil").update({ activo: false }).eq("profile_id", uid);
    setMsg("Perfil de canguro desactivado (no aparecerás en las búsquedas)");
  }

  if (cargando) return <div className="container"><p className="muted">Cargando...</p></div>;

  if (!verificado) {
    return (
      <div className="container-narrow" style={{ maxWidth: 600 }}>
        <h1>Ofrecer cuidado de niños</h1>
        <div className="card">
          <p>Para ofrecerte como canguro necesitas estar <strong>verificado</strong> primero, igual que los profes: hay que aportar y validar el certificado de delitos de naturaleza sexual.</p>
          <p className="muted" style={{ fontSize: 14 }}>Completa y verifica tu perfil de profe (con el certificado) y luego podrás activar aquí tu faceta de canguro.</p>
          <a href="/profe"><button className="btn btn-primary" style={{ marginTop: 8 }}>Ir a mi perfil</button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow" style={{ maxWidth: 600 }}>
      <h1>Mi perfil de canguro</h1>
      <p className="muted" style={{ fontSize: 14 }}>Ofrece cuidado de niños por las tardes. Reutilizas tu verificación ya aprobada.</p>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Sobre ti como canguro</h3>
        <textarea className="textarea" placeholder="Experiencia cuidando niños, edades con las que te manejas mejor, etc." value={bio} onChange={e => setBio(e.target.value)} />
        <label className="label">Tarifa €/h</label>
        <input className="input" placeholder="Ej. 10" value={tarifa} onChange={e => setTarifa(e.target.value)} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Dónde</h3>
        <select className="select" value={ciudadId} onChange={e => { setCiudadId(e.target.value); setBarriosSel([]); }}>
          <option value="">Elige ciudad...</option>
          {ciudades.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        {ciudadId && (
          <>
            <label className="label">Barrios/zonas donde trabajas</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {barriosDeCiudad.map(b => {
                const on = barriosSel.includes(b.id);
                return (
                  <button key={b.id} onClick={() => toggleBarrio(b.id)} style={{
                    padding: "5px 10px", fontSize: 13, borderRadius: 999, cursor: "pointer",
                    border: "1px solid " + (on ? "var(--azul)" : "var(--border)"),
                    background: on ? "var(--azul)" : "var(--surface)", color: on ? "#fff" : "var(--ink)",
                  }}>{b.nombre}</button>
                );
              })}
            </div>
          </>
        )}
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

      {msg && <p className={msg.includes("✔") ? "text-success" : "text-error"} style={{ marginTop: 14 }}>{msg}</p>}
      <button onClick={guardar} disabled={load} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
        {load ? "Guardando..." : (existe ? "Guardar cambios" : "Activar perfil de canguro")}
      </button>
      {existe && (
        <button onClick={desactivar} className="btn btn-secondary btn-block" style={{ marginTop: 10 }}>
          Desactivar perfil de canguro
        </button>
      )}
    </div>
  );
}