/*"use client";
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

  let links: { href: string; label: string }[] = [];
  if (estado === "fuera") {
    links = [{ href: "/buscar", label: "Buscar profes" }, { href: "/tablon", label: "Tablón" }];
  } else if (estado === "familia") {
    links = [
      { href: "/buscar", label: "Buscar profes" },
      { href: "/canguro/buscar", label: "Buscar canguro" },
      { href: "/familia", label: "Mis anuncios" },
      { href: "/tablon", label: "Tablón" },
      { href: "/canguro/tablon", label: "Tablón canguros" },
      { href: "/recursos", label: "Recursos" },
      { href: "/mensajes", label: "Mensajes" },
    ];
  } else if (estado === "profe") {
    links = [
      { href: "/tablon", label: "Tablón" },
      { href: "/canguro/tablon", label: "Tablón canguros" },
      { href: "/profe", label: "Mi perfil" },
      { href: "/profe/documentos", label: "Mis documentos" },
       { href: "/canguro/perfil", label: "Ser canguro" },
      { href: "/recursos", label: "Recursos" },
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

        <button onClick={() => setOpen(o => !o)} aria-label="Menú" className="nav-burger"
          style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
          <i className={`ti ti-${open ? "x" : "menu-2"}`} style={{ fontSize: 20, color: "var(--tinta)" }} />
        </button>

        <div className="nav-desktop" style={{ marginLeft: "auto", alignItems: "center", gap: 16 }}>
          {links.map(l => <a key={l.href} href={l.href} style={{ color: "var(--ink)", textDecoration: "none" }}>{l.label}</a>)}
          {estado === "fuera" ? (
            <a href="/login"><button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 14 }}>Entrar</button></a>
          ) : estado !== "cargando" ? (
            <button onClick={salir} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: 14 }}>Salir</button>
          ) : null}
        </div>
      </div>

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
}*/

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Estado = "cargando" | "fuera" | "familia" | "profe";
type Link = { href: string; label: string };
type Grupo = { titulo: string; links: Link[] };

export default function Nav() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [open, setOpen] = useState(false);              // menú móvil
  const [abierto, setAbierto] = useState<string | null>(null); // desplegable abierto

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
    setOpen(false); setAbierto(null);
    router.push("/");
  }

  // construir los grupos según el estado
  let grupos: Grupo[] = [];
  if (estado === "fuera") {
    grupos = [
      { titulo: "Clases", links: [{ href: "/buscar", label: "Buscar profes" }, { href: "/tablon", label: "Tablón" }] },
      { titulo: "Canguros", links: [{ href: "/canguro", label: "Descubrir" }, { href: "/canguro/buscar", label: "Buscar canguro" }, { href: "/canguro/tablon", label: "Tablón" }] },
    ];
  } else if (estado === "familia") {
    grupos = [
      { titulo: "Clases", links: [
        { href: "/buscar", label: "Buscar profes" },
        { href: "/familia", label: "Mis anuncios" },
        { href: "/tablon", label: "Tablón" },
        { href: "/recursos", label: "Recursos" },
      ]},
      { titulo: "Canguros", links: [
        { href: "/canguro", label: "Descubrir" },
        { href: "/canguro/buscar", label: "Buscar canguro" },
        { href: "/canguro/tablon", label: "Tablón / publicar" },
      ]},
    ];
  } else if (estado === "profe") {
    grupos = [
      { titulo: "Clases", links: [
        { href: "/profe", label: "Mi perfil" },
        { href: "/tablon", label: "Tablón" },
        { href: "/profe/documentos", label: "Mis documentos" },
        { href: "/recursos", label: "Recursos" },
      ]},
      { titulo: "Canguros", links: [
        { href: "/canguro", label: "Descubrir" },
        { href: "/canguro/perfil", label: "Ser canguro" },
        { href: "/canguro/tablon", label: "Tablón" },
      ]},
    ];
  }

  return (
    <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", position: "relative" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <a href="/" onClick={() => { setOpen(false); setAbierto(null); }} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ background: "var(--tinta)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>PG</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--tinta)" }}>Academy</span>
        </a>

        {/* hamburguesa móvil */}
        <button onClick={() => setOpen(o => !o)} aria-label="Menú" className="nav-burger"
          style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
          <i className={`ti ti-${open ? "x" : "menu-2"}`} style={{ fontSize: 20, color: "var(--tinta)" }} />
        </button>

        {/* escritorio: dos desplegables */}
        <div className="nav-desktop" style={{ marginLeft: "auto", alignItems: "center", gap: 8 }}>
          {estado !== "cargando" && estado !== "fuera" && grupos.map(g => (
            <Desplegable key={g.titulo} grupo={g} abierto={abierto === g.titulo}
              onToggle={() => setAbierto(a => a === g.titulo ? null : g.titulo)}
              onNav={() => setAbierto(null)} />
          ))}
          {estado === "fuera" && grupos.map(g => (
            <Desplegable key={g.titulo} grupo={g} abierto={abierto === g.titulo}
              onToggle={() => setAbierto(a => a === g.titulo ? null : g.titulo)}
              onNav={() => setAbierto(null)} />
          ))}
          <a href="/mensajes" style={{ color: "var(--ink)", textDecoration: "none", padding: "8px 4px" }}
             className={estado === "fuera" || estado === "cargando" ? "oculto" : ""}>Mensajes</a>
          {estado === "fuera" ? (
            <a href="/login"><button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 14 }}>Entrar</button></a>
          ) : estado !== "cargando" ? (
            <button onClick={salir} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: 14 }}>Salir</button>
          ) : null}
        </div>
      </div>

      {/* móvil: acordeón */}
      {open && (
        <div className="nav-mobile" style={{ borderTop: "1px solid var(--border)", padding: "8px 20px 16px" }}>
          {grupos.map(g => (
            <div key={g.titulo} style={{ borderBottom: "1px solid var(--border)" }}>
              <button onClick={() => setAbierto(a => a === g.titulo ? null : g.titulo)}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--tinta)" }}>
                {g.titulo}
                <i className={`ti ti-chevron-${abierto === g.titulo ? "up" : "down"}`} />
              </button>
              {abierto === g.titulo && (
                <div style={{ paddingBottom: 8 }}>
                  {g.links.map(l => (
                    <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                      style={{ display: "block", padding: "10px 16px", color: "var(--ink)", textDecoration: "none" }}>
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {estado !== "fuera" && estado !== "cargando" && (
            <a href="/mensajes" onClick={() => setOpen(false)}
              style={{ display: "block", padding: "12px 4px", color: "var(--ink)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
              Mensajes
            </a>
          )}
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

function Desplegable({ grupo, abierto, onToggle, onNav }: { grupo: Grupo; abierto: boolean; onToggle: () => void; onNav: () => void }) {
  return (
    <div style={{ position: "relative" }}>
      <button onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "var(--ink)", padding: "8px 6px" }}>
        {grupo.titulo}
        <i className={`ti ti-chevron-${abierto ? "up" : "down"}`} style={{ fontSize: 15 }} />
      </button>
      {abierto && (
        <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "0 6px 20px rgba(0,0,0,.08)", minWidth: 190, zIndex: 20, overflow: "hidden" }}>
          {grupo.links.map(l => (
            <a key={l.href} href={l.href} onClick={onNav}
              style={{ display: "block", padding: "10px 14px", color: "var(--ink)", textDecoration: "none", fontSize: 14 }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--page)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}