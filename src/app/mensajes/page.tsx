"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Conv = {
  id: number; familia_id: string; profe_id: string;
  created_at: string;
  otroNombre?: string;
};

export default function Bandeja() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      setUid(s.user.id);

      const { data } = await supabase.from("conversaciones")
        .select("id, familia_id, profe_id, created_at")
        .or(`familia_id.eq.${s.user.id},profe_id.eq.${s.user.id}`)
        .order("created_at", { ascending: false });

      const lista = (data ?? []) as Conv[];
      // nombre del otro
      for (const c of lista) {
        const otroId = c.familia_id === s.user.id ? c.profe_id : c.familia_id;
        const { data: p } = await supabase.from("profiles")
          .select("nombre, apellidos").eq("id", otroId).single();
        c.otroNombre = `${p?.nombre ?? ""} ${p?.apellidos ?? ""}`;
      }
      setConvs(lista);
      setLoad(false);
    })();
  }, [router]);

  return (
    <div style={{ maxWidth: 560, margin: "32px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Mis mensajes</h1>
      {load ? <p>Cargando...</p> : convs.length === 0 ? (
        <p style={{ color: "#888" }}>No tienes conversaciones todavía.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {convs.map(c => (
            <li key={c.id} style={{ borderBottom: "1px solid #eee" }}>
              <a href={`/mensajes/${c.id}`}
                style={{ display: "block", padding: "12px 4px", textDecoration: "none", color: "inherit" }}>
                💬 {c.otroNombre}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}