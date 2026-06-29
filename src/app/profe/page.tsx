"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Nivel = { id: string; nombre: string; orden: number };
type Asig = { id: number; nivel_id: string; nombre: string };
type Sel = { nivel_id: string; asignatura_id: number; idioma_nivel?: string };

export default function ProfePerfil() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asigs, setAsigs] = useState<Asig[]>([]);

  const [bio, setBio] = useState("");
  const [anios, setAnios] = useState("");
  const [modalidad, setModalidad] = useState<"online" | "presencial" | "ambas">("online");
  const [zona, setZona] = useState("");
  const [pOnline, setPOnline] = useState("");
  const [pCerca, setPCerca] = useState("");
  const [pMedia, setPMedia] = useState("");
  const [pLejos, setPLejos] = useState("");

  const [nivelSel, setNivelSel] = useState("");
  const [asigSel, setAsigSel] = useState("");
  const [idiomaNivel, setIdiomaNivel] = useState("");
  const [imparte, setImparte] = useState<Sel[]>([]);

  const [cert, setCert] = useState<File | null>(null);
  const [estado, setEstado] = useState<string>("");

  const [msg, setMsg] = useState("");
  const [load, setLoad] = useState(false);

  // cargar sesión + taxonomía + datos previos
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      setUid(s.user.id);

      const { data: nv } = await supabase.from("niveles").select("*").order("orden");
      setNiveles(nv ?? []);
      const { data: as } = await supabase.from("asignaturas").select("*");
      setAsigs(as ?? []);

      const { data: pp } = await supabase.from("profe_perfil")
        .select("*").eq("profile_id", s.user.id).maybeSingle();
      if (pp) {
        setBio(pp.bio ?? ""); setAnios(pp.anios_exp?.toString() ?? "");
        setModalidad(pp.modalidad); setZona(pp.zona ?? "");
        setPOnline(pp.precio_online?.toString() ?? "");
        setPCerca(pp.precio_cerca?.toString() ?? "");
        setPMedia(pp.precio_media?.toString() ?? "");
        setPLejos(pp.precio_lejos?.toString() ?? "");
        setEstado(pp.estado);
      }
      const { data: pi } = await supabase.from("profe_imparte")
        .select("nivel_id, asignatura_id, idioma_nivel").eq("profile_id", s.user.id);
      if (pi) setImparte(pi as Sel[]);
    })();
  }, [router]);

  const asigsDeNivel = asigs.filter(a => a.nivel_id === nivelSel);

  function addImparte() {
    if (!nivelSel || !asigSel) return;
    const ya = imparte.some(i => i.nivel_id === nivelSel && i.asignatura_id === Number(asigSel));
    if (ya) return;
    const nuevo: Sel = { nivel_id: nivelSel, asignatura_id: Number(asigSel) };
    if (nivelSel === "idiomas" && idiomaNivel) nuevo.idioma_nivel = idiomaNivel;
    setImparte([...imparte, nuevo]);
    setAsigSel(""); setIdiomaNivel("");
  }

  function quitar(i: number) {
    setImparte(imparte.filter((_, idx) => idx !== i));
  }

  function nombreAsig(id: number) {
    return asigs.find(a => a.id === id)?.nombre ?? id;
  }
  function nombreNivel(id: string) {
    return niveles.find(n => n.id === id)?.nombre ?? id;
  }

  async function guardar() {
    setMsg("");
    if (!uid) return;
    if (!bio) { setMsg("Falta la bio"); return; }
    if (imparte.length === 0) { setMsg("Añade al menos una asignatura"); return; }
    if ((modalidad === "online" || modalidad === "ambas") && !pOnline) { setMsg("Falta precio online"); return; }
    if ((modalidad === "presencial" || modalidad === "ambas")) {
      if (!zona) { setMsg("Falta zona (presencial)"); return; }
      if (!pCerca || !pMedia) { setMsg("Faltan precios presencial (≤5 y 5–15)"); return; }
    }
    if (!cert && !estado) { setMsg("Sube el certificado"); return; }

    setLoad(true);

    // 1) subir certificado si hay archivo nuevo
    let certPath: string | undefined;
    if (cert) {
      const ext = cert.name.split(".").pop();
      const path = `${uid}/certificado.${ext}`;
      const { error: eUp } = await supabase.storage.from("certificados")
        .upload(path, cert, { upsert: true });
      if (eUp) { setMsg("Error subiendo certificado: " + eUp.message); setLoad(false); return; }
      certPath = path;
    }

    // 2) guardar perfil (upsert)
    const fila: Record<string, unknown> = {
      profile_id: uid,
      bio,
      anios_exp: anios ? Number(anios) : null,
      modalidad,
      zona: (modalidad === "online") ? null : zona,
      precio_online: (modalidad === "presencial") ? null : (pOnline ? Number(pOnline) : null),
      precio_cerca: (modalidad === "online") ? null : (pCerca ? Number(pCerca) : null),
      precio_media: (modalidad === "online") ? null : (pMedia ? Number(pMedia) : null),
      precio_lejos: (modalidad === "online") ? null : (pLejos ? Number(pLejos) : null),
    };
    if (certPath) fila.certificado_url = certPath;

    const { error: ePP } = await supabase.from("profe_perfil").upsert(fila);
    if (ePP) { setMsg("Error guardando perfil: " + ePP.message); setLoad(false); return; }

    // 3) re-escribir asignaturas: borrar e insertar
    await supabase.from("profe_imparte").delete().eq("profile_id", uid);
    const filas = imparte.map(i => ({
      profile_id: uid,
      nivel_id: i.nivel_id,
      asignatura_id: i.asignatura_id,
      idioma_nivel: i.idioma_nivel ?? null,
    }));
    const { error: ePI } = await supabase.from("profe_imparte").insert(filas);
    if (ePI) { setMsg("Error guardando asignaturas: " + ePI.message); setLoad(false); return; }

    setLoad(false);
    setMsg("Guardado correctamente ✔");
  }

  return (
    <div style={{ maxWidth: 560, margin: "32px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Mi perfil de profe</h1>
      <p style={{ color: "#888" }}>
        Estado: {estado === "verificado" ? "✅ Verificado" : "⏳ Pendiente de verificar"}
        {estado !== "verificado" && " (tu perfil no es visible hasta verificarlo)"}
      </p>

      <h3>Sobre ti</h3>
      <textarea placeholder="Bio (experiencia, cómo das clase...)" value={bio}
        onChange={e => setBio(e.target.value)} style={{ ...inp, height: 90 }} />
      <input placeholder="Años de experiencia (opcional)" value={anios}
        onChange={e => setAnios(e.target.value)} style={inp} />

      <h3>Modalidad y precios (€/h)</h3>
      <select value={modalidad} onChange={e => setModalidad(e.target.value as never)} style={inp}>
        <option value="online">Solo online</option>
        <option value="presencial">Solo presencial</option>
        <option value="ambas">Ambas</option>
      </select>

      {(modalidad === "online" || modalidad === "ambas") && (
        <input placeholder="Precio online €/h" value={pOnline}
          onChange={e => setPOnline(e.target.value)} style={inp} />
      )}
      {(modalidad === "presencial" || modalidad === "ambas") && (
        <>
          <input placeholder="Zona (presencial)" value={zona}
            onChange={e => setZona(e.target.value)} style={inp} />
          <input placeholder="Precio ≤5 km €/h" value={pCerca}
            onChange={e => setPCerca(e.target.value)} style={inp} />
          <input placeholder="Precio 5–15 km €/h" value={pMedia}
            onChange={e => setPMedia(e.target.value)} style={inp} />
          <input placeholder="Precio +15 km €/h (opcional)" value={pLejos}
            onChange={e => setPLejos(e.target.value)} style={inp} />
        </>
      )}

      <h3>Qué imparto</h3>
      <select value={nivelSel} onChange={e => { setNivelSel(e.target.value); setAsigSel(""); }} style={inp}>
        <option value="">Elige nivel...</option>
        {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
      </select>
      {nivelSel && (
        <select value={asigSel} onChange={e => setAsigSel(e.target.value)} style={inp}>
          <option value="">Elige asignatura...</option>
          {asigsDeNivel.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      )}
      {nivelSel === "idiomas" && (
        <select value={idiomaNivel} onChange={e => setIdiomaNivel(e.target.value)} style={inp}>
          <option value="">Nivel idioma (A1–C2)...</option>
          {["A1","A2","B1","B2","C1","C2"].map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      )}
      <button onClick={addImparte} style={{ padding: 8, marginBottom: 8 }}>+ Añadir</button>

      <ul>
        {imparte.map((i, idx) => (
          <li key={idx} style={{ margin: "4px 0" }}>
            {nombreNivel(i.nivel_id)} · {nombreAsig(i.asignatura_id)}
            {i.idioma_nivel ? ` (${i.idioma_nivel})` : ""}
            <button onClick={() => quitar(idx)} style={{ marginLeft: 8 }}>x</button>
          </li>
        ))}
      </ul>

      <h3>Certificado de delitos sexuales</h3>
      <p style={{ color: "#888", fontSize: 13 }}>Obligatorio. Privado. Solo lo ve el administrador para verificarte.</p>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png"
        onChange={e => setCert(e.target.files?.[0] ?? null)} style={{ margin: "6px 0" }} />

      {msg && <p style={{ color: msg.includes("✔") ? "green" : "red" }}>{msg}</p>}

      <button onClick={guardar} disabled={load}
        style={{ width: "100%", padding: 12, marginTop: 12 }}>
        {load ? "Guardando..." : "Guardar perfil"}
      </button>
    </div>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: 8, margin: "6px 0", boxSizing: "border-box" };