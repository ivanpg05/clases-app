"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Perfil = {
  profile_id: string;
  bio: string;
  ciudad_id: string;
  tarifa: number;
  profiles: { nombre: string; apellidos: string } | null;
};

function iniciales(n?: string, a?: string) {
  return `${(n?.[0] ?? "").toUpperCase()}${(a?.[0] ?? "").toUpperCase()}`;
}

const ORDEN_DIAS = ["L", "M", "X", "J", "V", "S", "D"];

export default function FichaCanguro() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [ciudadNombre, setCiudadNombre] = useState("");
  const [barriosNombres, setBarriosNombres] = useState<string[]>([]);
  const [slots, setSlots] = useState<Record<string, string[]>>({});
  const [load, setLoad] = useState(true);

  const [contactando, setContactando] = useState(false);
  const [errC, setErrC] = useState("");

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("canguro_perfil")
        .select("*, profiles(nombre, apellidos)").eq("profile_id", id).eq("activo", true).maybeSingle();
      setPerfil(p as unknown as Perfil);

      if (p) {
        const { data: ciu } = await supabase.from("ciudades").select("nombre").eq("id", p.ciudad_id).single();
        setCiudadNombre(ciu?.nombre ?? "");
        const { data: cb } = await supabase.from("canguro_barrio").select("barrio_id").eq("profile_id", id);
        const ids = (cb ?? []).map(x => x.barrio_id);
        if (ids.length) {
          const { data: bn } = await supabase.from("barrios").select("nombre").in("id", ids);
          setBarriosNombres((bn ?? []).map(x => x.nombre));
        }
        const { data: cs } = await supabase.from("canguro_slot").select("dia, hora").eq("profile_id", id);
        const map: Record<string, string[]> = {};
        (cs ?? []).forEach(r => { (map[r.dia] ??= []).push(r.hora); });
        setSlots(map);
      }
      setLoad(false);
    })();
  }, [id]);

  async function contactar() {
    setErrC("");
    const { data: s } = await supabase.auth.getUser();
    if (!s.user) { router.push("/login"); return; }
    const { data: yo } = await supabase.from("profiles").select("role").eq("id", s.user.id).single();
    if (yo?.role !== "familia") { setErrC("Solo las familias pueden contactar."); return; }
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
  if (!perfil) return <div className="container"><p className="muted">Canguro no encontrado o no disponible.</p></div>;

  return (
    <div className="container-narrow" style={{ maxWidth: 600 }}>
      <a href="/canguro/buscar" className="muted" style={{ fontSize: 14 }}>← Volver a buscar</a>

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

        <div className="muted" style={{ fontSize: 14 }}>{ciudadNombre} · {perfil.tarifa}€/h</div>

        {barriosNombres.length > 0 && (
          <>
            <h3 style={{ marginTop: 20 }}>Zonas</h3>
            <div>{barriosNombres.map((b, i) => <span key={i} className="pill">{b}</span>)}</div>
          </>
        )}

        <h3 style={{ marginTop: 20 }}>Disponibilidad</h3>
        {Object.keys(slots).length === 0 ? (
          <p className="muted" style={{ fontSize: 14 }}>Sin disponibilidad indicada.</p>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {ORDEN_DIAS.filter(d => slots[d]).map(d => (
              <div key={d} style={{ fontSize: 14 }}>
                <strong style={{ fontFamily: "var(--font-display)", color: "var(--tinta)" }}>{d}:</strong>{" "}
                {slots[d].join(", ")}
              </div>
            ))}
          </div>
        )}

        {errC && <p className="text-error" style={{ marginTop: 14 }}>{errC}</p>}

        <button onClick={contactar} disabled={contactando} className="btn btn-primary btn-block" style={{ marginTop: 20 }}>
          {contactando ? "Abriendo..." : "Contactar"}
        </button>
      </div>
    </div>
  );
}