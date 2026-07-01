export const metadata = { title: "Política de Privacidad · PGAcademy" };

export default function Privacidad() {
  return (
    <div className="container-narrow" style={{ maxWidth: 760 }}>
      <h1>Política de Privacidad</h1>
      <p className="muted" style={{ fontSize: 14 }}>Última actualización: julio de 2026</p>

      <h3>1. Responsable del tratamiento</h3>
      <p>El responsable del tratamiento de tus datos es Iván Pérez González (en adelante, &quot;el Responsable&quot;), titular de la plataforma PGAcademy.</p>
      <p>Correo de contacto para asuntos de privacidad: <a href="mailto:ivaan.perezgonzalez@gmail.com">ivaan.perezgonzalez@gmail.com</a></p>

      <h3>2. Qué datos tratamos</h3>
      <p>Según tu uso de la plataforma, podemos tratar:</p>
      <ul>
        <li><strong>Datos de cuenta:</strong> nombre, apellidos, correo electrónico y, opcionalmente, teléfono.</li>
        <li><strong>Datos de perfil de profesor:</strong> biografía, experiencia, asignaturas, niveles, zona, precios y el certificado de delitos de naturaleza sexual aportado para la verificación.</li>
        <li><strong>Datos de anuncios de familias:</strong> nivel, asignatura, descripción de la necesidad, presupuesto y disponibilidad.</li>
        <li><strong>Mensajes</strong> intercambiados dentro de la plataforma.</li>
        <li><strong>Datos técnicos</strong> necesarios para el inicio de sesión y el funcionamiento del servicio.</li>
      </ul>

      <h3>3. Protección de menores</h3>
      <p>El titular de la cuenta debe ser mayor de edad. El servicio va dirigido a adultos (padres/madres/tutores y profesores). No se solicitan ni deben aportarse datos identificativos de menores (nombre, foto, etc.); únicamente curso y asignatura para orientar la clase.</p>

      <h3>4. Datos de categorías especiales</h3>
      <p>Si en un anuncio decides indicar necesidades educativas especiales (por ejemplo, TDAH o dislexia), ese dato puede considerarse dato de salud. Solo se tratará si otorgas tu consentimiento explícito mediante la casilla correspondiente, y con la única finalidad de ayudarte a encontrar el profesor adecuado. Puedes retirar ese consentimiento en cualquier momento eliminando el anuncio.</p>

      <h3>5. Finalidades y base legal</h3>
      <ul>
        <li><strong>Prestar el servicio</strong> (crear cuenta, publicar perfiles y anuncios, poner en contacto a familias y profesores): base legal, la ejecución del servicio que solicitas.</li>
        <li><strong>Verificar a los profesores</strong> (revisión del certificado): base legal, interés legítimo en la seguridad de la plataforma y protección de los usuarios.</li>
        <li><strong>Tratar datos de necesidades especiales:</strong> base legal, tu consentimiento explícito.</li>
        <li><strong>Cumplir obligaciones legales</strong> cuando corresponda.</li>
      </ul>

      <h3>6. Conservación</h3>
      <p>Conservamos tus datos mientras mantengas tu cuenta activa. Si la eliminas, tus datos asociados se suprimen, salvo aquellos que debamos conservar por obligación legal.</p>

      <h3>7. Destinatarios</h3>
      <p>No vendemos tus datos. Los datos se alojan en servidores de nuestro proveedor de infraestructura (Supabase), ubicados en la Unión Europea (Irlanda). Determinada información de perfil de los profesores verificados es visible públicamente en la plataforma por la propia naturaleza del servicio (catálogo).</p>

      <h3>8. Tus derechos</h3>
      <p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <a href="mailto:ivaan.perezgonzalez@gmail.com">ivaan.perezgonzalez@gmail.com</a>. También tienes derecho a reclamar ante la Agencia Española de Protección de Datos (www.aepd.es) si consideras que el tratamiento no se ajusta a la normativa.</p>

      <h3>9. Seguridad</h3>
      <p>Aplicamos medidas técnicas y organizativas razonables para proteger tus datos, incluyendo control de acceso a la información y almacenamiento privado de los documentos sensibles (como el certificado de los profesores).</p>

      <h3>10. Cambios</h3>
      <p>Podemos actualizar esta política. Publicaremos cualquier cambio en esta misma página con su fecha de actualización.</p>

      <p style={{ marginTop: 24 }}><a href="/">← Volver al inicio</a></p>
    </div>
  );
}