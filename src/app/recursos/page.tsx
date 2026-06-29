"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Nivel = { id: string; nombre: string; orden: number };
type Asig = { id: number; nivel_id: string; nombre: string };
type Doc = {
  id: number; titulo: string; descripcion: string | null;
  nivel_id: string; asignatura_id: number; archivo_url: string; tipo: string; acceso: string;
  profiles: { nombre: string; apellidos: string } | null;
};

function pathDesdeUrl(url: string): string | null {
  const marca = "/documentos/";
  const i = url.indexOf(marca);
  if (i === -1) return null;
  return url.substring(i + marca.length);
}

async function descargar(url: string, titulo: string, tipo: string) {
  const path = pathDesdeUrl(url);
  if (!path) { window.open(url, "_blank"); return; }
  const { data, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(path, 60, { download: `${titulo}.${tipo}` });
  if (error || !data) { alert("No se pudo descargar"); return; }
  const a = document.createElement("a");
  a.href = data.signedUrl;
  a.click();
}

export default function Recursos() {
  const router = useRouter();
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asigs, setAsigs] = useState<Asig[]>([]);
  const [nivelesMap, setNivelesMap] = useState<Record<string, string>>({});
  const [asigsMap, setAsigsMap] = useState<Record<number, string>>({});
  const [docs, setDocs] = useState<Doc[]>([]);
  const [load, setLoad] = useState(true);

  const [fNivel, setFNivel] = useState("");
  const [fAsig, setFAsig] = useState("");

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      const { data: nv } = await supabase.from("niveles").select("*").order("orden");
      setNiveles(nv ?? []);
      setNivelesMap(Object.fromEntries((nv ?? []).map(n => [n.id, n.nombre])));
      const { data: as } = await supabase.from("asignaturas").select("*");
      setAsigs(as ?? []);
      setAsigsMap(Object.fromEntries((as ?? []).map(a => [a.id, a.nombre])));
      await cargar();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const asigsDeNivel = asigs.filter(a => a.nivel_id === fNivel);

  async function cargar() {
    setLoad(true);
    let q = supabase.from("documentos")
      .select("*, profiles(nombre, apellidos)")
      .order("created_at", { ascending: false });
    if (fNivel) q = q.eq("nivel_id", fNivel);
    if (fAsig) q = q.eq("asignatura_id", Number(fAsig));
    const { data } = await q;
    setDocs((data ?? []) as unknown as Doc[]);
    setLoad(false);
  }

  return (
    <div className="container">
      <h1>Recursos de estudio</h1>
      <p className="muted">Material subido por los profes, organizado por nivel y asignatura.</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, alignItems: "end" }}>
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
        </div>
        <button onClick={cargar} className="btn btn-primary" style={{ marginTop: 12 }}>Filtrar</button>
      </div>

      {load ? <p className="muted">Cargando...</p> : docs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted" style={{ margin: 0 }}>No hay documentos para ese filtro todavía.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {docs.map(d => (
            <div key={d.id} className="card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <i className="ti ti-file-text" style={{ fontSize: 26, color: "var(--azul)", flex: "none" }} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontFamily: "var(--font-display)", color: "var(--tinta)" }}>{d.titulo}</strong>
                <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                  {nivelesMap[d.nivel_id]} · {asigsMap[d.asignatura_id]} · {d.tipo.toUpperCase()}
                  {d.profiles ? ` · ${d.profiles.nombre} ${d.profiles.apellidos}` : ""}
                </div>
                {d.descripcion && <p style={{ fontSize: 14, margin: "6px 0 0" }}>{d.descripcion}</p>}
              </div>
              <button onClick={() => descargar(d.archivo_url, d.titulo, d.tipo)} className="btn btn-secondary" style={{ padding: "8px 14px" }}>
                <i className="ti ti-download" /> Descargar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}