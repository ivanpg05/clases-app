"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Registro() {
  const router = useRouter();
  const [role, setRole] = useState<"familia" | "profe">("familia");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [load, setLoad] = useState(false);

  async function submit() {
    setErr("");
    if (!nombre || !apellidos || !email || !pass) { setErr("Rellena todos los campos"); return; }
    if (pass.length < 6) { setErr("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoad(true);

    const { data, error } = await supabase.auth.signUp({
      email, password: pass,
      options: { data: { role, nombre, apellidos } },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("registered")) {
        setErr("Ese correo ya tiene una cuenta. Entra con él o usa otro distinto.");
      } else {
        setErr(error.message);
      }
      setLoad(false);
      return;
    }

    // Supabase devuelve un usuario "vacío" (sin identidades) si el email ya existía
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setErr("Ese correo ya tiene una cuenta. Entra con él o usa otro distinto.");
      setLoad(false);
      return;
    }

    router.push(role === "profe" ? "/profe" : "/familia");
  }

  const tabBase: React.CSSProperties = {
    flex: 1, padding: "12px", borderRadius: "var(--radius-sm)", cursor: "pointer",
    fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500, border: "1px solid var(--border)",
  };

  return (
    <div className="container-narrow" style={{ paddingTop: 48 }}>
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ textAlign: "center" }}>Crear cuenta</h1>
        <p className="muted" style={{ textAlign: "center", marginTop: -4 }}>Únete a PGAcademy.</p>

        <div style={{ display: "flex", gap: 10, margin: "16px 0 8px" }}>
          <button onClick={() => setRole("familia")} style={{
            ...tabBase,
            background: role === "familia" ? "var(--tinta)" : "var(--surface)",
            color: role === "familia" ? "#fff" : "var(--ink)",
            borderColor: role === "familia" ? "var(--tinta)" : "var(--border)",
          }}>Soy familia</button>
          <button onClick={() => setRole("profe")} style={{
            ...tabBase,
            background: role === "profe" ? "var(--tinta)" : "var(--surface)",
            color: role === "profe" ? "#fff" : "var(--ink)",
            borderColor: role === "profe" ? "var(--tinta)" : "var(--border)",
          }}>Soy profe</button>
        </div>

        <label className="label">Nombre</label>
        <input className="input" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
        <label className="label">Apellidos</label>
        <input className="input" placeholder="Apellidos" value={apellidos} onChange={e => setApellidos(e.target.value)} />
        <label className="label">Email</label>
        <input className="input" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="label">Contraseña</label>
        <input className="input" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} />

        {err && <p className="text-error" style={{ marginTop: 10 }}>{err}</p>}

        <button onClick={submit} disabled={load} className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
          {load ? "Creando..." : "Crear cuenta"}
        </button>

        <p className="muted" style={{ textAlign: "center", marginTop: 16, marginBottom: 0, fontSize: 14 }}>
          ¿Ya tienes cuenta? <a href="/login">Entrar</a>
        </p>
      </div>
    </div>
  );
}