"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Estado = "cargando" | "fuera" | "familia" | "profe";

export default function Nav() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let activo = true;
    async function leer() {
      const { data: s } = await supabase.auth.getUser();
      if (!activo) return;
      if (!s.user) { setEstado("fuera"); return; }
      const { data: p } = await supabase.from("profiles").select("role").eq("id", s.user.id).single();
      setEstado(p?.role === "profe" ? "profe" : "familia");
    }
    leer();
    const { data: sub } = supabase.auth.onAuthStateChange(() => leer());
    return () => { activo = false; sub.subscription.unsubscribe(); };
  }, []);

  async function salir() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
  }

  // enlaces según estado
  let links: { href: string; label: string }[] = [];
  if (estado === "fuera") {
    links = [{ href: "/buscar", label: "Buscar profes" }, { href: "/tablon", label: "Tablón" }];
  } else if (estado === "familia") {
    links = [
      { href: "/buscar", label: "Buscar profes" },
      { href: "/familia", label: "Mis anuncios" },
      { href: "/tablon", label: "Tablón" },
      { href: "/mensajes", label: "Mensajes" },
    ];
  } else if (estado === "profe") {
    links = [
      { href: "/tablon", label: "Tablón" },
      { href: "/profe", label: "Mi perfil" },
      { href: "/mensajes", label: "Mensajes" },
    ];
  }

  return (
    <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <a href="/" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ background: "var(--tinta)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>PG</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--tinta)" }}>Academy</span>
        </a>

        {/* botón hamburguesa (solo móvil) */}
        <button onClick={() => setOpen(o => !o)} aria-label="Menú" className="nav-burger"
          style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
          <i className={`ti ti-${open ? "x" : "menu-2"}`} style={{ fontSize: 20, color: "var(--tinta)" }} />
        </button>

        {/* enlaces escritorio */}
        <div className="nav-desktop" style={{ marginLeft: "auto", alignItems: "center", gap: 16 }}>
          {links.map(l => <a key={l.href} href={l.href} style={{ color: "var(--ink)", textDecoration: "none" }}>{l.label}</a>)}
          {estado === "fuera" ? (
            <a href="/login"><button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 14 }}>Entrar</button></a>
          ) : estado !== "cargando" ? (
            <button onClick={salir} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: 14 }}>Salir</button>
          ) : null}
        </div>
      </div>

      {/* panel desplegable móvil */}
      {open && (
        <div className="nav-mobile" style={{ borderTop: "1px solid var(--border)", padding: "8px 20px 16px" }}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              style={{ display: "block", padding: "12px 4px", color: "var(--ink)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
              {l.label}
            </a>
          ))}
          <div style={{ marginTop: 12 }}>
            {estado === "fuera" ? (
              <a href="/login" onClick={() => setOpen(false)}><button className="btn btn-primary btn-block">Entrar</button></a>
            ) : estado !== "cargando" ? (
              <button onClick={salir} className="btn btn-secondary btn-block">Salir</button>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}