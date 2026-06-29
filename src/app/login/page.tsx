"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [load, setLoad] = useState(false);

  async function submit() {
    setErr(""); setLoad(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { setErr(error.message); setLoad(false); return; }

    const { data: prof } = await supabase
      .from("profiles").select("role").eq("id", data.user.id).single();

    router.push(prof?.role === "profe" ? "/profe" : "/familia");
  }

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Entrar</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
      <input placeholder="Contraseña" type="password" value={pass} onChange={e => setPass(e.target.value)} style={inp} />
      {err && <p style={{ color: "red" }}>{err}</p>}
      <button onClick={submit} disabled={load} style={{ width: "100%", padding: 10, marginTop: 8 }}>
        {load ? "Entrando..." : "Entrar"}
      </button>
      <p style={{ marginTop: 12 }}>
        ¿No tienes cuenta? <a href="/registro">Crear cuenta</a>
      </p>
    </div>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: 8, margin: "6px 0", boxSizing: "border-box" };