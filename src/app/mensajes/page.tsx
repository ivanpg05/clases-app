"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Conv = { id: number; familia_id: string; profe_id: string; created_at: string; otroNombre?: string };

function iniciales(nombre?: string) {
  const p = (nombre ?? "").trim().split(" ");
  return `${(p[0]?.[0] ?? "").toUpperCase()}${(p[1]?.[0] ?? "").toUpperCase()}`;
}

export default function Bandeja() {
  const router = useRouter();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      const { data } = await supabase.from("conversaciones")
        .select("id, familia_id, profe_id, created_at")
        .or(`familia_id.eq.${s.user.id},profe_id.eq.${s.user.id}`)
        .order("created_at", { ascending: false });
      const lista = (data ?? []) as Conv[];
      for (const c of lista) {
        const otroId = c.familia_id === s.user.id ? c.profe_id : c.familia_id;
        const { data: p } = await supabase.from("profiles").select("nombre, apellidos").eq("id", otroId).single();
        c.otroNombre = `${p?.nombre ?? ""} ${p?.apellidos ?? ""}`.trim();
      }
      setConvs(lista);
      setLoad(false);
    })();
  }, [router]);

  return (
    <div className="container-narrow" style={{ maxWidth: 600 }}>
      <h1>Mis mensajes</h1>
      {load ? <p className="muted">Cargando...</p> : convs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted" style={{ margin: 0 }}>No tienes conversaciones todavía.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {convs.map(c => (
            <a key={c.id} href={`/mensajes/${c.id}`} className="card card-link" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="avatar" style={{ width: 44, height: 44, fontSize: 14 }}>{iniciales(c.otroNombre)}</div>
              <span style={{ fontWeight: 500 }}>{c.otroNombre}</span>
              <i className="ti ti-chevron-right" style={{ marginLeft: "auto", color: "var(--muted)" }} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}