export const metadata = { title: "Política de Cookies · PGAcademy" };

export default function Cookies() {
  return (
    <div className="container-narrow" style={{ maxWidth: 760 }}>
      <h1>Política de Cookies</h1>
      <p className="muted" style={{ fontSize: 14 }}>Última actualización: julio de 2026</p>

      <h3>1. Qué son las cookies</h3>
      <p>Una cookie es un pequeño archivo que un sitio web guarda en tu navegador. Sirve, entre otras cosas, para recordar tu sesión y que no tengas que iniciarla en cada página.</p>

      <h3>2. Qué cookies utilizamos</h3>
      <p>PGAcademy utiliza únicamente <strong>cookies técnicas necesarias</strong> para el funcionamiento del servicio. En concreto, las que gestionan tu inicio de sesión y mantienen tu cuenta identificada mientras navegas.</p>
      <ul>
        <li><strong>Cookies de sesión y autenticación:</strong> generadas por nuestro proveedor de autenticación (Supabase) para saber que has iniciado sesión y mantenerte dentro de tu cuenta de forma segura.</li>
      </ul>
      <p><strong>No utilizamos</strong> cookies de publicidad, de seguimiento ni de analítica de terceros.</p>

      <h3>3. Base legal</h3>
      <p>Las cookies técnicas necesarias no requieren consentimiento previo, ya que son imprescindibles para prestar el servicio que solicitas (iniciar sesión y usar tu cuenta). Por eso te informamos de su uso, pero no es necesario un banner de aceptación de cookies para ellas.</p>

      <h3>4. Cómo gestionarlas</h3>
      <p>Puedes ver, bloquear o eliminar las cookies desde la configuración de tu navegador. Ten en cuenta que, si bloqueas las cookies técnicas, no podrás iniciar sesión ni usar las funciones que requieren una cuenta.</p>

      <h3>5. Cambios</h3>
      <p>Si en el futuro incorporamos otro tipo de cookies (por ejemplo, de analítica), actualizaremos esta política y, cuando la normativa lo exija, solicitaremos tu consentimiento mediante un aviso específico.</p>

      <p style={{ marginTop: 24 }}><a href="/">← Volver al inicio</a></p>
    </div>
  );
}