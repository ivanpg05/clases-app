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

export default function FichaProfe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [imparte, setImparte] = useState<Imparte[]>([]);
  const [niveles, setNiveles] = useState<Record<string, string>>({});
  const [asigs, setAsigs] = useState<Record<number, string>>({});
  const [load, setLoad] = useState(true);

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
const [contactando, setContactando] = useState(false);
  const [errC, setErrC] = useState("");

  async function contactar() {
    setErrC("");
    const { data: s } = await supabase.auth.getUser();
    if (!s.user) { router.push("/login"); return; }

    // comprobar que es familia
    const { data: yo } = await supabase.from("profiles").select("role").eq("id", s.user.id).single();
    if (yo?.role !== "familia") { setErrC("Solo las familias pueden contactar a un profe."); return; }
    if (s.user.id === id) { setErrC("Eres tú."); return; }

    setContactando(true);

    // buscar conversación existente (1 por pareja)
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
  if (load) return <div style={{ padding: 40 }}>Cargando...</div>;
  if (!perfil) return <div style={{ padding: 40 }}>Profe no encontrado o no disponible.</div>;

  return (
    <div style={{ maxWidth: 560, margin: "32px auto", padding: 16, fontFamily: "sans-serif" }}>
      <a href="/buscar" style={{ fontSize: 13 }}>← Volver</a>
      <div style={{ display: "flex", gap: 14, alignItems: "center", margin: "12px 0" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ddd" }} />
        <div>
          <h1 style={{ margin: 0 }}>{perfil.profiles?.nombre} {perfil.profiles?.apellidos}</h1>
          <div style={{ color: "#16a34a", fontSize: 13 }}>✅ Verificado</div>
        </div>
      </div>

      <p>{perfil.bio}</p>

      <h3>Detalles</h3>
      <ul>
        <li>Modalidad: {perfil.modalidad}</li>
        {perfil.zona && <li>Zona: {perfil.zona}</li>}
        {perfil.anios_exp != null && <li>Experiencia: {perfil.anios_exp} años</li>}
      </ul>

      <h3>Precios (€/h)</h3>
      <ul>
        {perfil.precio_online != null && <li>Online: {perfil.precio_online}€</li>}
        {perfil.precio_cerca != null && <li>Presencial ≤5 km: {perfil.precio_cerca}€</li>}
        {perfil.precio_media != null && <li>Presencial 5–15 km: {perfil.precio_media}€</li>}
        {perfil.precio_lejos != null && <li>Presencial +15 km: {perfil.precio_lejos}€</li>}
      </ul>

      <h3>Asignaturas</h3>
      <ul>
        {imparte.map((i, idx) => (
          <li key={idx}>
            {niveles[i.nivel_id]} · {asigs[i.asignatura_id]}{i.idioma_nivel ? ` (${i.idioma_nivel})` : ""}
          </li>
        ))}
      </ul>

      <button onClick={contactar} disabled={contactando}
        style={{ width: "100%", padding: 12, marginTop: 16 }}>
        {contactando ? "Abriendo..." : "Contactar"}
      </button>
      {errC && <p style={{ color: "red" }}>{errC}</p>}
    </div>
  );
}