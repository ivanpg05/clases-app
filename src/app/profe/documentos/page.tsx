"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Nivel = { id: string; nombre: string; orden: number };
type Asig = { id: number; nivel_id: string; nombre: string };
type Doc = {
  id: number; titulo: string; descripcion: string | null;
  nivel_id: string; asignatura_id: number; archivo_url: string; tipo: string; acceso: string;
};

export default function MisDocumentos() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asigs, setAsigs] = useState<Asig[]>([]);
  const [nivelesMap, setNivelesMap] = useState<Record<string, string>>({});
  const [asigsMap, setAsigsMap] = useState<Record<number, string>>({});
  const [mios, setMios] = useState<Doc[]>([]);

  const [nivelId, setNivelId] = useState("");
  const [asigId, setAsigId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [desc, setDesc] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);

  const [msg, setMsg] = useState("");
  const [load, setLoad] = useState(false);

  async function cargarMios(userId: string) {
    const { data } = await supabase.from("documentos")
      .select("*").eq("profe_id", userId).order("created_at", { ascending: false });
    setMios((data ?? []) as Doc[]);
  }

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      const { data: yo } = await supabase.from("profiles").select("role").eq("id", s.user.id).single();
      if (yo?.role !== "profe") { router.push("/"); return; }
      setUid(s.user.id);
      const { data: nv } = await supabase.from("niveles").select("*").order("orden");
      setNiveles(nv ?? []);
      setNivelesMap(Object.fromEntries((nv ?? []).map(n => [n.id, n.nombre])));
      const { data: as } = await supabase.from("asignaturas").select("*");
      setAsigs(as ?? []);
      setAsigsMap(Object.fromEntries((as ?? []).map(a => [a.id, a.nombre])));
      await cargarMios(s.user.id);
    })();
  }, [router]);

  const asigsDeNivel = asigs.filter(a => a.nivel_id === nivelId);

  async function subir() {
    setMsg("");
    if (!uid) return;
    if (!nivelId || !asigId) { setMsg("Elige nivel y asignatura"); return; }
    if (!titulo) { setMsg("Pon un título"); return; }
    if (!archivo) { setMsg("Elige un archivo"); return; }

    const ext = (archivo.name.split(".").pop() ?? "").toLowerCase();
    const permitidos = ["pdf", "doc", "docx", "html", "jpg", "jpeg", "png"];
    if (!permitidos.includes(ext)) { setMsg("Formato no permitido (PDF, DOC, DOCX, HTML, JPG, PNG)"); return; }

    setLoad(true);
    const path = `${uid}/${Date.now()}_${archivo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: eUp } = await supabase.storage.from("documentos").upload(path, archivo);
    if (eUp) { setMsg("Error subiendo: " + eUp.message); setLoad(false); return; }

    const { data: pub } = supabase.storage.from("documentos").getPublicUrl(path);

    const { error: eIns } = await supabase.from("documentos").insert({
      profe_id: uid, nivel_id: nivelId, asignatura_id: Number(asigId),
      titulo, descripcion: desc || null,
      archivo_url: pub.publicUrl, tipo: ext, acceso: "gratis",
    });
    if (eIns) { setMsg("Error guardando: " + eIns.message); setLoad(false); return; }

    setTitulo(""); setDesc(""); setArchivo(null); setNivelId(""); setAsigId("");
    await cargarMios(uid);
    setLoad(false);
    setMsg("Documento subido ✔");
  }

  async function borrar(id: number) {
    if (!uid) return;
    await supabase.from("documentos").delete().eq("id", id);
    await cargarMios(uid);
  }

  return (
    <div className="container-narrow" style={{ maxWidth: 600 }}>
      <h1>Mis documentos</h1>
      <p className="muted" style={{ fontSize: 14 }}>Sube material de estudio. Se organiza por nivel y asignatura para que las familias lo encuentren.</p>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Subir documento</h3>
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
        <label className="label">Título</label>
        <input className="input" placeholder="Ej. Repaso de ecuaciones" value={titulo} onChange={e => setTitulo(e.target.value)} />
        <label className="label">Descripción (opcional)</label>
        <textarea className="textarea" placeholder="De qué trata..." value={desc} onChange={e => setDesc(e.target.value)} style={{ minHeight: 70 }} />
        <label className="label">Archivo (PDF, DOC, DOCX, HTML, JPG, PNG)</label>
        <input type="file" accept=".pdf,.doc,.docx,.html,.jpg,.jpeg,.png" onChange={e => setArchivo(e.target.files?.[0] ?? null)} />

        {msg && <p className={msg.includes("✔") ? "text-success" : "text-error"} style={{ marginTop: 10 }}>{msg}</p>}
        <button onClick={subir} disabled={load} className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
          {load ? "Subiendo..." : "Subir documento"}
        </button>
      </div>

      <h3 style={{ marginTop: 24 }}>Subidos por ti</h3>
      {mios.length === 0 ? (
        <p className="muted">Aún no has subido nada.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {mios.map(d => (
            <div key={d.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <i className="ti ti-file-text" style={{ fontSize: 22, color: "var(--azul)" }} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontFamily: "var(--font-display)", color: "var(--tinta)" }}>{d.titulo}</strong>
                <div className="muted" style={{ fontSize: 13 }}>{nivelesMap[d.nivel_id]} · {asigsMap[d.asignatura_id]} · {d.tipo.toUpperCase()}</div>
              </div>
              <button onClick={() => borrar(d.id)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 13 }}>Borrar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}