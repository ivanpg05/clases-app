"use client";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Nav() {
  const router = useRouter();
  async function salir() {
    await supabase.auth.signOut();
    router.push("/login");
  }
  return (
    <div style={{ display: "flex", gap: 14, padding: 12, borderBottom: "1px solid #ddd", fontFamily: "sans-serif", fontSize: 14 }}>
      <a href="/buscar">Buscar</a>
      <a href="/familia">Familia</a>
      <a href="/profe">Mi perfil profe</a>
      <a href="/mensajes">Mensajes</a>
      <a href="/tablon">Tablón</a>
      <a href="/admin">Admin</a>
      <button onClick={salir} style={{ marginLeft: "auto" }}>Cerrar sesión</button>
    </div>
  );
}