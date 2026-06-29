"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profe = {
  profile_id: string; bio: string; estado: string; visible: boolean;
  certificado_url: string | null; modalidad: string;
  profiles: { nombre: string; apellidos: string } | null;
};

function iniciales(n?: string, a?: string) {
  return `${(n?.[0] ?? "").toUpperCase()}${(a?.[0] ?? "").toUpperCase()}`;
}

export default function Admin() {
  const router = useRouter();
  const [esAdmin, setEsAdmin] = useState(false);
  const [profes, setProfes] = useState<Profe[]>([]);
  const [load, setLoad] = useState(true);
  const [msg, setMsg] = useState("");

  async function cargar() {
    const { data } = await supabase.from("profe_perfil")
      .select("profile_id, bio, estado, visible, certificado_url, modalidad, profiles(nombre, apellidos)")
      .order("estado", { ascending: true });
    setProfes((data ?? []) as unknown as Profe[]);
  }

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      const { data: yo } = await supabase.from("profiles").select("is_admin").eq("id", s.user.id).single();
      if (!yo?.is_admin) { setLoad(false); return; }
      setEsAdmin(true);
      await cargar();
      setLoad(false);
    })();
  }, [router]);

  async function verCertificado(path: string | null) {
    if (!path) { alert("Este profe no ha subido certificado."); return; }
    const { data, error } = await supabase.storage.from("certificados").createSignedUrl(path, 120);
    if (error || !data) { alert("Error: " + (error?.message ?? "")); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function verificar(id: string, aprobar: boolean) {
    setMsg("");
    const { error } = await supabase.from("profe_perfil").update({ estado: aprobar ? "verificado" : "pendiente", visible: aprobar }).eq("profile_id", id);
    if (error) { setMsg("Error: " + error.message); return; }
    await cargar();
    setMsg(aprobar ? "Profe verificado ✔" : "Profe puesto en pendiente");
  }

  if (load) return <div className="container"><p className="muted">Cargando...</p></div>;
  if (!esAdmin) return <div className="container"><p className="muted">No tienes acceso a esta página.</p></div>;

  return (
    <div className="container">
      <h1>Panel de verificación</h1>
      <p className="muted" style={{ fontSize: 14 }}>Revisa el certificado y aprueba o rechaza cada profe.</p>
      {msg && <p className={msg.includes("✔") ? "text-success" : "text-error"}>{msg}</p>}

      <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
        {profes.map(p => (
          <div key={p.profile_id} className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="avatar" style={{ width: 44, height: 44, fontSize: 14 }}>{iniciales(p.profiles?.nombre, p.profiles?.apellidos)}</div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontFamily: "var(--font-display)", color: "var(--tinta)" }}>{p.profiles?.nombre} {p.profiles?.apellidos}</strong>
              </div>
              <span className={`badge ${p.estado === "verificado" ? "badge-verde" : "badge-amber"}`}>
                {p.estado === "verificado" ? "Verificado" : "Pendiente"}
              </span>
            </div>
            <p className="muted" style={{ fontSize: 14, margin: "10px 0" }}>{p.bio.slice(0, 140)}…</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => verCertificado(p.certificado_url)} className="btn btn-secondary">Ver certificado</button>
              {p.estado !== "verificado" ? (
                <button onClick={() => verificar(p.profile_id, true)} className="btn btn-success">Aprobar</button>
              ) : (
                <button onClick={() => verificar(p.profile_id, false)} className="btn btn-danger">Revocar</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}