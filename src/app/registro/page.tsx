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
    if (!nombre || !apellidos || !email || !pass) {
      setErr("Rellena todos los campos");
      return;
    }
    setLoad(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { role, nombre, apellidos } },
    });
    if (error) { setErr(error.message); setLoad(false); return; }

    router.push(role === "profe" ? "/profe" : "/familia"); }

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Crear cuenta</h1>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <button onClick={() => setRole("familia")}
          style={{ flex: 1, padding: 8, background: role === "familia" ? "#222" : "#eee", color: role === "familia" ? "#fff" : "#000" }}>
          Soy familia
        </button>
        <button onClick={() => setRole("profe")}
          style={{ flex: 1, padding: 8, background: role === "profe" ? "#222" : "#eee", color: role === "profe" ? "#fff" : "#000" }}>
          Soy profe
        </button>
      </div>

      <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} style={inp} />
      <input placeholder="Apellidos" value={apellidos} onChange={e => setApellidos(e.target.value)} style={inp} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
      <input placeholder="Contraseña" type="password" value={pass} onChange={e => setPass(e.target.value)} style={inp} />

      {err && <p style={{ color: "red" }}>{err}</p>}

      <button onClick={submit} disabled={load} style={{ width: "100%", padding: 10, marginTop: 8 }}>
        {load ? "Creando..." : "Crear cuenta"}
      </button>

      <p style={{ marginTop: 12 }}>
        ¿Ya tienes cuenta? <a href="/login">Entrar</a>
      </p>
    </div>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: 8, margin: "6px 0", boxSizing: "border-box" };