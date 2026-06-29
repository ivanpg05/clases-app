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
    <nav style={{
      display: "flex", alignItems: "center", gap: 20,
      padding: "14px 20px", background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
    }}>
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <span style={{
          background: "var(--tinta)", color: "#fff", fontFamily: "var(--font-display)",
          fontWeight: 700, fontSize: 15, width: 32, height: 32, display: "flex",
          alignItems: "center", justifyContent: "center", borderRadius: 8,
        }}>PG</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--tinta)" }}>Academy</span>
      </a>

      <div style={{ display: "flex", gap: 16, marginLeft: 12, fontSize: 15 }}>
        <a href="/buscar" style={navLink}>Buscar</a>
        <a href="/tablon" style={navLink}>Tablón</a>
        <a href="/familia" style={navLink}>Familia</a>
        <a href="/profe" style={navLink}>Profe</a>
        <a href="/mensajes" style={navLink}>Mensajes</a>
        <a href="/admin" style={navLink}>Admin</a>
      </div>

      <button onClick={salir} className="btn btn-secondary" style={{ marginLeft: "auto", padding: "8px 14px", fontSize: 14 }}>
        Salir
      </button>
    </nav>
  );
}

const navLink: React.CSSProperties = { color: "var(--ink)", textDecoration: "none" };