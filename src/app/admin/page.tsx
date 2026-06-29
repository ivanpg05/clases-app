"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profe = {
  profile_id: string;
  bio: string;
  estado: string;
  visible: boolean;
  certificado_url: string | null;
  modalidad: string;
  profiles: { nombre: string; apellidos: string } | null;
};

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
    if (error || !data) { alert("Error abriendo certificado: " + (error?.message ?? "")); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function verificar(id: string, aprobar: boolean) {
    setMsg("");
    const { error } = await supabase.from("profe_perfil")
      .update({
        estado: aprobar ? "verificado" : "pendiente",
        visible: aprobar,
      }).eq("profile_id", id);
    if (error) { setMsg("Error: " + error.message); return; }
    await cargar();
    setMsg(aprobar ? "Profe verificado ✔" : "Profe puesto en pendiente");
  }

  if (load) return <div style={{ padding: 40 }}>Cargando...</div>;
  if (!esAdmin) return <div style={{ padding: 40 }}>No tienes acceso a esta página.</div>;

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Panel de verificación</h1>
      <p style={{ color: "#888", fontSize: 14 }}>Revisa el certificado y aprueba o rechaza.</p>
      {msg && <p style={{ color: msg.includes("✔") ? "green" : "red" }}>{msg}</p>}

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {profes.map(p => (
          <div key={p.profile_id} style={{
            border: "1px solid #ddd", borderRadius: 8, padding: 14,
            background: p.estado === "verificado" ? "#f0fdf4" : "#fff",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{p.profiles?.nombre} {p.profiles?.apellidos}</strong>
              <span style={{ fontSize: 13, color: p.estado === "verificado" ? "#16a34a" : "#a16207" }}>
                {p.estado === "verificado" ? "✅ Verificado" : "⏳ Pendiente"}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#555", margin: "6px 0" }}>{p.bio.slice(0, 120)}…</p>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => verCertificado(p.certificado_url)} style={{ padding: 8 }}>
                Ver certificado
              </button>
              {p.estado !== "verificado" ? (
                <button onClick={() => verificar(p.profile_id, true)}
                  style={{ padding: 8, background: "#16a34a", color: "#fff", border: "none", borderRadius: 4 }}>
                  Aprobar
                </button>
              ) : (
                <button onClick={() => verificar(p.profile_id, false)}
                  style={{ padding: 8, background: "#dc2626", color: "#fff", border: "none", borderRadius: 4 }}>
                  Revocar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}