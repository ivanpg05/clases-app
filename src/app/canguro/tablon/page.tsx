"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Anuncio = {
  id: number; familia_id: string; ciudad_id: string; barrio_id: number;
  num_ninos: number; edad_aprox: string; tareas: string | null;
  descripcion: string; tarifa_min: number; tarifa_max: number; created_at: string;
};

export default function TablonCanguro() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [esCanguro, setEsCanguro] = useState(false);
  const [logueado, setLogueado] = useState(true);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [ciudadesMap, setCiudadesMap] = useState<Record<string, string>>({});
  const [barriosMap, setBarriosMap] = useState<Record<number, string>>({});
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
        const { data: cp } = await supabase.from("canguro_perfil").select("activo").eq("profile_id", s.user.id).maybeSingle();
        setEsCanguro(cp?.activo === true);
      }
      const { data: c } = await supabase.from("ciudades").select("id, nombre");
      setCiudadesMap(Object.fromEntries((c ?? []).map(x => [x.id, x.nombre])));
      const { data: b } = await supabase.from("barrios").select("id, nombre");
      setBarriosMap(Object.fromEntries((b ?? []).map(x => [x.id, x.nombre])));

      const { data: ans } = await supabase.from("canguro_anuncio").select("*").eq("estado", "activo").order("created_at", { ascending: false });
      setAnuncios((ans ?? []) as Anuncio[]);
      setLoad(false);
    })();
  }, [router]);

  async function contactarFamilia(familiaId: string) {
    if (!uid) return;
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Tablón de canguros</h1>
        {role === "familia" && (
          <a href="/canguro/anuncio/nuevo"><button className="btn btn-primary">+ Buscar canguro</button></a>
        )}
      </div>
      {esCanguro && <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>Familias que buscan canguro. Puedes escribirles.</p>}

      <div style={{ position: "relative", marginTop: 12 }}>
        {!logueado && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 2, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", textAlign: "center", padding: 20,
            background: "linear-gradient(to bottom, rgba(248,250,252,.3), rgba(248,250,252,.85))",
          }}>
            <div className="card" style={{ maxWidth: 360 }}>
              <h3 style={{ marginTop: 0 }}>Regístrate para ver el tablón</h3>
              <p className="muted" style={{ fontSize: 14 }}>Crea una cuenta gratis para ver las familias que buscan canguro.</p>
              <a href="/registro"><button className="btn btn-primary btn-block">Crear cuenta</button></a>
              <p className="muted" style={{ fontSize: 13, marginTop: 10, marginBottom: 0 }}>¿Ya tienes cuenta? <a href="/login">Entrar</a></p>
            </div>
          </div>
        )}

        <div style={!logueado ? { filter: "blur(6px)", pointerEvents: "none", userSelect: "none" } : undefined}>
          {anuncios.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}><p className="muted" style={{ margin: 0 }}>No hay anuncios activos.</p></div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {anuncios.map(a => (
                <div key={a.id} className="card">
                  <strong style={{ fontFamily: "var(--font-display)", color: "var(--tinta)", display: "block" }}>
                    {ciudadesMap[a.ciudad_id]} · {barriosMap[a.barrio_id]}
                  </strong>
                  <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                    {a.num_ninos} niño(s) · {a.edad_aprox} · {a.tarifa_min}–{a.tarifa_max}€/h
                  </div>
                  {a.tareas && (
                    <div style={{ margin: "8px 0" }}>
                      {a.tareas.split(", ").map((t, i) => <span key={i} className="pill">{t}</span>)}
                    </div>
                  )}
                  <p style={{ fontSize: 15, margin: "10px 0" }}>{a.descripcion}</p>
                  {esCanguro && (
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