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
    <div className="container-narrow" style={{ paddingTop: 56 }}>
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ textAlign: "center" }}>Entrar</h1>
        <p className="muted" style={{ textAlign: "center", marginTop: -4 }}>Bienvenido de nuevo a PGAcademy.</p>

        <label className="label">Email</label>
        <input className="input" placeholder="tu@email.com" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()} />

        <label className="label">Contraseña</label>
        <input className="input" type="password" placeholder="••••••••" value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()} />

        {err && <p className="text-error" style={{ marginTop: 10 }}>{err}</p>}

        <button onClick={submit} disabled={load} className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
          {load ? "Entrando..." : "Entrar"}
        </button>

        <p className="muted" style={{ textAlign: "center", marginTop: 16, marginBottom: 0, fontSize: 14 }}>
          ¿No tienes cuenta? <a href="/registro">Crear cuenta</a>
        </p>
      </div>
    </div>
  );
}