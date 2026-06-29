"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Anuncio = {
  id: number; familia_id: string; nivel_id: string; asignatura_id: number;
  modalidad: string; zona: string | null; descripcion: string; nee_texto: string | null;
  presup_min: number; presup_max: number; clases_semana: number; created_at: string; encaja?: boolean;
};

export default function Tablon() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [logueado, setLogueado] = useState(true);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [niveles, setNiveles] = useState<Record<string, string>>({});
  const [asigs, setAsigs] = useState<Record<number, string>>({});
  const [load, setLoad] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) {
        setLogueado(false);
      } else {
        setUid(s.user.id);
        const { data: yo } = await supabase.from("profiles").select("role").eq("id", s.user.id).single();
        setRole(yo?.role ?? "");
      }

      const { data: nv } = await supabase.from("niveles").select("id, nombre");
      setNiveles(Object.fromEntries((nv ?? []).map(n => [n.id, n.nombre])));
      const { data: as } = await supabase.from("asignaturas").select("id, nombre");
      setAsigs(Object.fromEntries((as ?? []).map(a => [a.id, a.nombre])));

      const { data: ans } = await supabase.from("anuncios").select("*").eq("estado", "activo").order("created_at", { ascending: false });
      let lista = (ans ?? []) as Anuncio[];

      if (s.user) {
        const { data: yo2 } = await supabase.from("profiles").select("role").eq("id", s.user.id).single();
        if (yo2?.role === "profe") {
          const { data: imp } = await supabase.from("profe_imparte").select("nivel_id, asignatura_id").eq("profile_id", s.user.id);
          const claves = new Set((imp ?? []).map(i => `${i.nivel_id}|${i.asignatura_id}`));
          lista = lista.map(a => ({ ...a, encaja: claves.has(`${a.nivel_id}|${a.asignatura_id}`) }));
          lista.sort((a, b) => Number(b.encaja) - Number(a.encaja));
        }
      }

      setAnuncios(lista);
      setLoad(false);
    })();
  }, [router]);

  async function contactarFamilia(familiaId: string) {
    if (!uid || role !== "profe") return;
    const { data: existe } = await supabase.from("conversaciones").select("id").eq("familia_id", familiaId).eq("profe_id", uid).maybeSingle();
    let convId = existe?.id;
    if (!convId) {
      const { data: nueva, error } = await supabase.from("conversaciones").insert({ familia_id: familiaId, profe_id: uid }).select("id").single();
      if (error || !nueva) { alert("Error: " + (error?.message ?? "")); return; }
      convId = nueva.id;
    }
    router.push(`/mensajes/${convId}`);
  }

  if (load) return <div className="container"><p className="muted">Cargando...</p></div>;

  return (
    <div className="container">
      <h1>Tablón de anuncios</h1>
      {role === "profe" && <p className="muted" style={{ fontSize: 14 }}>Los anuncios que encajan con lo que impartes salen primero, marcados con ★.</p>}

      <div style={{ position: "relative" }}>
        {!logueado && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 2,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            textAlign: "center", padding: 20,
            background: "linear-gradient(to bottom, rgba(248,250,252,.3), rgba(248,250,252,.85))",
          }}>
            <div className="card" style={{ maxWidth: 360 }}>
              <h3 style={{ marginTop: 0 }}>Regístrate para ver el tablón</h3>
              <p className="muted" style={{ fontSize: 14 }}>Crea una cuenta gratis para ver lo que buscan las familias y contactar.</p>
              <a href="/registro"><button className="btn btn-primary btn-block">Crear cuenta</button></a>
              <p className="muted" style={{ fontSize: 13, marginTop: 10, marginBottom: 0 }}>
                ¿Ya tienes cuenta? <a href="/login">Entrar</a>
              </p>
            </div>
          </div>
        )}

        <div style={!logueado ? { filter: "blur(6px)", pointerEvents: "none", userSelect: "none" } : undefined}>
          {anuncios.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}><p className="muted" style={{ margin: 0 }}>No hay anuncios activos.</p></div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {anuncios.map(a => (
                <div key={a.id} className="card" style={a.encaja ? { borderColor: "var(--verde)", borderWidth: 2 } : undefined}>
                  {a.encaja && <span className="badge badge-verde" style={{ marginBottom: 8 }}>★ Encaja contigo</span>}
                  <strong style={{ fontFamily: "var(--font-display)", color: "var(--tinta)", display: "block" }}>
                    {niveles[a.nivel_id]} · {asigs[a.asignatura_id]}
                  </strong>
                  <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                    {a.modalidad}{a.zona ? ` · ${a.zona}` : ""} · {a.clases_semana} clase(s)/sem · {a.presup_min}–{a.presup_max}€/h
                  </div>
                  <p style={{ fontSize: 15, margin: "10px 0" }}>{a.descripcion}</p>
                  {a.nee_texto && (
                    <p style={{ fontSize: 13, color: "#92400E", background: "#FEF3C7", padding: "8px 12px", borderRadius: "var(--radius-sm)", margin: "8px 0" }}>
                      Necesidades especiales: {a.nee_texto}
                    </p>
                  )}
                  {role === "profe" && (
                    <button onClick={() => contactarFamilia(a.familia_id)} className="btn btn-primary" style={{ marginTop: 4 }}>
                      Escribir a la familia
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}