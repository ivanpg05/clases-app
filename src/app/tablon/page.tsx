"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Anuncio = {
  id: number;
  familia_id: string;
  nivel_id: string;
  asignatura_id: number;
  modalidad: string;
  zona: string | null;
  descripcion: string;
  nee_texto: string | null;
  presup_min: number;
  presup_max: number;
  clases_semana: number;
  created_at: string;
  encaja?: boolean;
};

export default function Tablon() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [niveles, setNiveles] = useState<Record<string, string>>({});
  const [asigs, setAsigs] = useState<Record<number, string>>({});
  const [load, setLoad] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      setUid(s.user.id);

      const { data: yo } = await supabase.from("profiles").select("role").eq("id", s.user.id).single();
      setRole(yo?.role ?? "");

      // taxonomía para mostrar nombres
      const { data: nv } = await supabase.from("niveles").select("id, nombre");
      setNiveles(Object.fromEntries((nv ?? []).map(n => [n.id, n.nombre])));
      const { data: as } = await supabase.from("asignaturas").select("id, nombre");
      setAsigs(Object.fromEntries((as ?? []).map(a => [a.id, a.nombre])));

      // todos los anuncios activos
      const { data: ans } = await supabase.from("anuncios")
        .select("*").eq("estado", "activo").order("created_at", { ascending: false });
      let lista = (ans ?? []) as Anuncio[];

      // si es profe: marcar los que encajan (nivel+asignatura que imparte)
      if (yo?.role === "profe") {
        const { data: imp } = await supabase.from("profe_imparte")
          .select("nivel_id, asignatura_id").eq("profile_id", s.user.id);
        const claves = new Set((imp ?? []).map(i => `${i.nivel_id}|${i.asignatura_id}`));
        lista = lista.map(a => ({ ...a, encaja: claves.has(`${a.nivel_id}|${a.asignatura_id}`) }));
        // ordenar: encaja primero
        lista.sort((a, b) => Number(b.encaja) - Number(a.encaja));
      }

      setAnuncios(lista);
      setLoad(false);
    })();
  }, [router]);

  async function contactarFamilia(familiaId: string) {
    if (!uid) return;
    if (role !== "profe") { alert("Solo un profe contacta desde el tablón."); return; }

    // conversación 1 por pareja (familia_id, profe_id=uid)
    const { data: existe } = await supabase.from("conversaciones")
      .select("id").eq("familia_id", familiaId).eq("profe_id", uid).maybeSingle();

    let convId = existe?.id;
    if (!convId) {
      const { data: nueva, error } = await supabase.from("conversaciones")
        .insert({ familia_id: familiaId, profe_id: uid }).select("id").single();
      if (error || !nueva) { alert("Error: " + (error?.message ?? "")); return; }
      convId = nueva.id;
    }
    router.push(`/mensajes/${convId}`);
  }

  if (load) return <div style={{ padding: 40 }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Tablón de anuncios</h1>
      {role === "profe" && (
        <p style={{ color: "#888", fontSize: 14 }}>
          Los anuncios que encajan con lo que impartes salen primero, marcados con ★.
        </p>
      )}

      {anuncios.length === 0 ? (
        <p style={{ color: "#888" }}>No hay anuncios activos.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {anuncios.map(a => (
            <div key={a.id} style={{
              border: a.encaja ? "2px solid #16a34a" : "1px solid #ddd",
              borderRadius: 8, padding: 14,
            }}>
              {a.encaja && <div style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>★ Encaja contigo</div>}
              <strong>{niveles[a.nivel_id]} · {asigs[a.asignatura_id]}</strong>
              <div style={{ fontSize: 13, color: "#666" }}>
                {a.modalidad}{a.zona ? ` · ${a.zona}` : ""} · {a.clases_semana} clase(s)/sem · {a.presup_min}–{a.presup_max}€/h
              </div>
              <p style={{ fontSize: 14, margin: "8px 0" }}>{a.descripcion}</p>
              {a.nee_texto && (
                <p style={{ fontSize: 13, color: "#a16207", margin: "4px 0" }}>
                  Necesidades especiales: {a.nee_texto}
                </p>
              )}
              {role === "profe" && (
                <button onClick={() => contactarFamilia(a.familia_id)} style={{ padding: 8, marginTop: 4 }}>
                  Escribir a la familia
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}