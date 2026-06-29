"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Anuncio = {
  id: number; nivel_id: string; asignatura_id: number;
  modalidad: string; descripcion: string; estado: string;
};

export default function FamiliaHome() {
  const router = useRouter();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [niveles, setNiveles] = useState<Record<string, string>>({});
  const [asigs, setAsigs] = useState<Record<number, string>>({});
  const [load, setLoad] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      const { data: nv } = await supabase.from("niveles").select("id, nombre");
      setNiveles(Object.fromEntries((nv ?? []).map(n => [n.id, n.nombre])));
      const { data: as } = await supabase.from("asignaturas").select("id, nombre");
      setAsigs(Object.fromEntries((as ?? []).map(a => [a.id, a.nombre])));
      const { data } = await supabase.from("anuncios")
        .select("id, nivel_id, asignatura_id, modalidad, descripcion, estado")
        .eq("familia_id", s.user.id).order("created_at", { ascending: false });
      setAnuncios(data ?? []);
      setLoad(false);
    })();
  }, [router]);

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Mis anuncios</h1>
        <a href="/familia/anuncio/nuevo"><button className="btn btn-primary">+ Publicar necesidad</button></a>
      </div>

      <div style={{ marginTop: 20 }}>
        {load ? <p className="muted">Cargando...</p> : anuncios.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <p className="muted" style={{ margin: 0 }}>Aún no has publicado nada.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {anuncios.map(a => (
              <div key={a.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontFamily: "var(--font-display)", color: "var(--tinta)" }}>
                    {niveles[a.nivel_id]} · {asigs[a.asignatura_id]}
                  </strong>
                  <span className={`badge ${a.estado === "activo" ? "badge-verde" : "badge-amber"}`}>
                    {a.estado}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>{a.modalidad}</div>
                <p style={{ margin: "8px 0 0", fontSize: 14 }}>{a.descripcion.slice(0, 120)}{a.descripcion.length > 120 ? "…" : ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}