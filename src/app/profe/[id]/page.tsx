"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Perfil = {
  profile_id: string;
  bio: string;
  anios_exp: number | null;
  modalidad: string;
  zona: string | null;
  precio_online: number | null;
  precio_cerca: number | null;
  precio_media: number | null;
  precio_lejos: number | null;
  profiles: { nombre: string; apellidos: string } | null;
};
type Imparte = { nivel_id: string; asignatura_id: number; idioma_nivel: string | null };

function iniciales(n?: string, a?: string) {
  return `${(n?.[0] ?? "").toUpperCase()}${(a?.[0] ?? "").toUpperCase()}`;
}
function modalidadLabel(m: string) {
  if (m === "ambas") return "Online y presencial";
  if (m === "online") return "Online";
  if (m === "presencial") return "Presencial";
  return m;
}
export default function FichaProfe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [imparte, setImparte] = useState<Imparte[]>([]);
  const [niveles, setNiveles] = useState<Record<string, string>>({});
  const [asigs, setAsigs] = useState<Record<number, string>>({});
  const [load, setLoad] = useState(true);

  const [contactando, setContactando] = useState(false);
  const [errC, setErrC] = useState("");

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("profe_perfil")
        .select("*, profiles(nombre, apellidos)")
        .eq("profile_id", id).eq("visible", true).maybeSingle();
      setPerfil(p as unknown as Perfil);
      const { data: im } = await supabase.from("profe_imparte")
        .select("nivel_id, asignatura_id, idioma_nivel").eq("profile_id", id);
      setImparte(im ?? []);
      const { data: nv } = await supabase.from("niveles").select("id, nombre");
      setNiveles(Object.fromEntries((nv ?? []).map(n => [n.id, n.nombre])));
      const { data: as } = await supabase.from("asignaturas").select("id, nombre");
      setAsigs(Object.fromEntries((as ?? []).map(a => [a.id, a.nombre])));
      setLoad(false);
    })();
  }, [id]);

  async function contactar() {
    setErrC("");
    const { data: s } = await supabase.auth.getUser();
    if (!s.user) { router.push("/login"); return; }
    const { data: yo } = await supabase.from("profiles").select("role").eq("id", s.user.id).single();
    if (yo?.role !== "familia") { setErrC("Solo las familias pueden contactar a un profe."); return; }
    if (s.user.id === id) { setErrC("Eres tú."); return; }
    setContactando(true);
    const { data: existe } = await supabase.from("conversaciones")
      .select("id").eq("familia_id", s.user.id).eq("profe_id", id).maybeSingle();
    let convId = existe?.id;
    if (!convId) {
      const { data: nueva, error } = await supabase.from("conversaciones")
        .insert({ familia_id: s.user.id, profe_id: id }).select("id").single();
      if (error || !nueva) { setErrC("Error: " + (error?.message ?? "")); setContactando(false); return; }
      convId = nueva.id;
    }
    router.push(`/mensajes/${convId}`);
  }

  if (load) return <div className="container"><p className="muted">Cargando...</p></div>;
  if (!perfil) return <div className="container"><p className="muted">Profe no encontrado o no disponible.</p></div>;

  const precios = [
    perfil.precio_online != null ? { l: "Online", v: perfil.precio_online } : null,
    perfil.precio_cerca != null ? { l: "Presencial ≤5 km", v: perfil.precio_cerca } : null,
    perfil.precio_media != null ? { l: "Presencial 5–15 km", v: perfil.precio_media } : null,
    perfil.precio_lejos != null ? { l: "Presencial +15 km", v: perfil.precio_lejos } : null,
  ].filter(Boolean) as { l: string; v: number }[];

  return (
    <div className="container-narrow" style={{ maxWidth: 600 }}>
      <a href="/buscar" className="muted" style={{ fontSize: 14 }}>← Volver a buscar</a>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div className="avatar" style={{ width: 68, height: 68, fontSize: 22 }}>
            {iniciales(perfil.profiles?.nombre, perfil.profiles?.apellidos)}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>{perfil.profiles?.nombre} {perfil.profiles?.apellidos}</h1>
            <span className="badge badge-verde" style={{ marginTop: 6 }}><i className="ti ti-shield-check" /> Verificado</span>
          </div>
        </div>

        <p style={{ marginTop: 16 }}>{perfil.bio}</p>

        <div className="muted" style={{ fontSize: 14 }}>
          {modalidadLabel(perfil.modalidad)}{perfil.zona ? ` · ${perfil.zona}` : ""}{perfil.anios_exp != null ? ` · ${perfil.anios_exp} años de experiencia` : ""}
        </div>

        <h3 style={{ marginTop: 20 }}>Asignaturas</h3>
        <div>
          {imparte.map((i, idx) => (
            <span key={idx} className="pill">
              {niveles[i.nivel_id]} · {asigs[i.asignatura_id]}{i.idioma_nivel ? ` (${i.idioma_nivel})` : ""}
            </span>
          ))}
        </div>

        <h3 style={{ marginTop: 20 }}>Precios</h3>
        <div style={{ display: "grid", gap: 6 }}>
          {precios.map((p, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
              <span className="muted">{p.l}</span>
              <span style={{ fontWeight: 500 }}>{p.v}€/h</span>
            </div>
          ))}
        </div>

        {errC && <p className="text-error" style={{ marginTop: 14 }}>{errC}</p>}

        <button onClick={contactar} disabled={contactando} className="btn btn-primary btn-block" style={{ marginTop: 20 }}>
          {contactando ? "Abriendo..." : "Contactar"}
        </button>
      </div>
    </div>
  );
}