"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Msg = { id: number; autor_id: string; texto: string; created_at: string };

export default function Conversacion() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [otro, setOtro] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [load, setLoad] = useState(true);
  const [err, setErr] = useState("");
  const fin = useRef<HTMLDivElement>(null);

  async function cargar(userId: string) {
    const { data: conv } = await supabase.from("conversaciones").select("familia_id, profe_id").eq("id", id).maybeSingle();
    if (!conv) { setErr("Conversación no encontrada"); setLoad(false); return; }
    if (conv.familia_id !== userId && conv.profe_id !== userId) { setErr("No tienes acceso a esta conversación"); setLoad(false); return; }
    const otroId = conv.familia_id === userId ? conv.profe_id : conv.familia_id;
    const { data: po } = await supabase.from("profiles").select("nombre, apellidos").eq("id", otroId).single();
    setOtro(`${po?.nombre ?? ""} ${po?.apellidos ?? ""}`.trim());
    const { data: m } = await supabase.from("mensajes").select("id, autor_id, texto, created_at").eq("conversacion_id", id).order("created_at");
    setMsgs(m ?? []);
    setLoad(false);
  }

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) { router.push("/login"); return; }
      setUid(s.user.id);
      await cargar(s.user.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => { fin.current?.scrollIntoView(); }, [msgs]);

  async function enviar() {
    if (!texto.trim() || !uid) return;
    const t = texto.trim();
    setTexto("");
    const { error } = await supabase.from("mensajes").insert({ conversacion_id: Number(id), autor_id: uid, texto: t });
    if (error) { setErr(error.message); return; }
    await cargar(uid);
  }

  if (load) return <div className="container"><p className="muted">Cargando...</p></div>;
  if (err) return <div className="container"><p className="text-error">{err}</p><a href="/mensajes">← Volver</a></div>;

  return (
    <div className="container-narrow" style={{ maxWidth: 600 }}>
      <a href="/mensajes" className="muted" style={{ fontSize: 14 }}>← Mis mensajes</a>
      <h2 style={{ marginTop: 8 }}>{otro}</h2>

      <div className="card" style={{ padding: 16, height: 380, overflowY: "auto", marginBottom: 12 }}>
        {msgs.length === 0 ? (
          <p className="muted">Aún no hay mensajes. Escribe el primero.</p>
        ) : msgs.map(m => {
          const mio = m.autor_id === uid;
          return (
            <div key={m.id} style={{ textAlign: mio ? "right" : "left", margin: "8px 0" }}>
              <span style={{
                display: "inline-block", padding: "9px 13px", borderRadius: 14, maxWidth: "75%", fontSize: 15,
                background: mio ? "var(--azul)" : "var(--page)",
                color: mio ? "#fff" : "var(--ink)",
                border: mio ? "none" : "1px solid var(--border)",
              }}>{m.texto}</span>
            </div>
          );
        })}
        <div ref={fin} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input className="input" style={{ margin: 0 }} value={texto} onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === "Enter" && enviar()} placeholder="Escribe un mensaje..." />
        <button onClick={enviar} className="btn btn-primary">Enviar</button>
      </div>
    </div>
  );
}