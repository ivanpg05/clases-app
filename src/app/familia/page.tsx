"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Anuncio = {
  id: number; nivel_id: string; asignatura_id: number;
  modalidad: string; descripcion: string; estado: string;
};

export default function FamiliaHome() {
  const router = useRouter();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      const { data } = await supabase.from("anuncios")
        .select("id, nivel_id, asignatura_id, modalidad, descripcion, estado")
        .eq("familia_id", s.user.id).order("created_at", { ascending: false });
      setAnuncios(data ?? []);
      setLoad(false);
    })();
  }, [router]);

  return (
    <div style={{ maxWidth: 560, margin: "32px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Panel familia</h1>
      <a href="/familia/anuncio/nuevo">
        <button style={{ padding: 10, marginBottom: 16 }}>+ Publicar nueva necesidad</button>
      </a>

      <h3>Mis anuncios</h3>
      {load ? <p>Cargando...</p> : anuncios.length === 0 ? (
        <p style={{ color: "#888" }}>Aún no has publicado nada.</p>
      ) : (
        <ul>
          {anuncios.map(a => (
            <li key={a.id} style={{ margin: "6px 0" }}>
              #{a.id} · {a.modalidad} · {a.estado} — {a.descripcion.slice(0, 50)}…
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}