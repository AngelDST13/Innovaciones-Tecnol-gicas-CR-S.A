/**
 * Textos legales del portal.
 * BORRADOR: redactado como base de referencia (Ley 8968, protección de la persona frente al
 * tratamiento de sus datos personales, Costa Rica). Debe revisarlo el área legal de la empresa
 * antes de publicarlo.
 */
export const EMPRESA = 'Innovaciones Tecnológicas CR S.A.';
export const CORREO_CONTACTO = 'recursoshumanos@innovacionescr.com';
export const FECHA_VIGENCIA = '1 de enero de 2026';

export const DOCUMENTOS_LEGALES = {
  privacidad: {
    titulo: 'Aviso de Privacidad',
    resumen: 'Qué datos personales tratamos en el portal, para qué y cómo ejercer tus derechos.',
    secciones: [
      {
        titulo: '1. Responsable del tratamiento',
        texto: `${EMPRESA} es responsable del tratamiento de los datos personales recabados a través del portal. Para consultas sobre privacidad, escribe a ${CORREO_CONTACTO}.`,
      },
      {
        titulo: '2. Datos que tratamos',
        texto: 'Identificación y contacto laboral (nombre, correo corporativo, departamento, puesto), registros de vacaciones, solicitudes, incapacidades y movimientos de personal, así como el historial de consultas realizadas al asistente.',
      },
      {
        titulo: '3. Finalidades',
        texto: 'Responder consultas de políticas de RRHH, mostrarte tus propios datos laborales, gestionar solicitudes y generar indicadores agregados para Recursos Humanos. No vendemos ni cedemos tus datos a terceros con fines comerciales.',
      },
      {
        titulo: '4. Tus derechos',
        texto: 'Puedes solicitar acceso, rectificación, actualización o eliminación de tus datos, así como revocar tu consentimiento, conforme a la Ley 8968. Presenta tu solicitud a través del correo de contacto indicado.',
      },
      {
        titulo: '5. Seguridad',
        texto: 'Aplicamos controles de acceso por rol, filtros de seguridad en las consultas al asistente y transmisión cifrada (TLS) con la base de datos.',
      },
    ],
  },
  'tratamiento-datos': {
    titulo: 'Política de Tratamiento de Datos del Colaborador',
    resumen: 'Cómo se usan, conservan y protegen los datos laborales de cada colaborador.',
    secciones: [
      {
        titulo: '1. Alcance',
        texto: 'Esta política aplica a los datos laborales que el colaborador y Recursos Humanos registran en el portal, sin importar el medio.',
      },
      {
        titulo: '2. Acceso por rol',
        texto: 'Cada colaborador accede únicamente a sus propios registros. Recursos Humanos accede a la información necesaria para gestionar al personal y los indicadores agregados. Los salarios no se muestran en el asistente.',
      },
      {
        titulo: '3. Conservación',
        texto: 'Los datos se conservan mientras dure la relación laboral y el plazo legal aplicable. Los registros de consultas al asistente se conservan para auditoría y mejora del servicio.',
      },
      {
        titulo: '4. Terceros',
        texto: 'Las consultas que el asistente procesa se envían al proveedor de inteligencia artificial solo con el contenido necesario para responderlas, sin datos de otros colaboradores.',
      },
    ],
  },
  terminos: {
    titulo: 'Términos de Uso del Portal',
    resumen: 'Condiciones para usar el portal y el asistente de RRHH.',
    secciones: [
      {
        titulo: '1. Uso permitido',
        texto: 'El portal es para uso de colaboradores y del personal de Recursos Humanos de la empresa, con fines laborales. El acceso es personal e intransferible.',
      },
      {
        titulo: '2. Naturaleza del asistente',
        texto: 'El asistente orienta sobre políticas y datos laborales, pero no reemplaza la comunicación formal de Recursos Humanos. Ante una discrepancia, prevalece el documento oficial.',
      },
      {
        titulo: '3. Conductas prohibidas',
        texto: 'Queda prohibido intentar acceder a datos de otros colaboradores, manipular las instrucciones del asistente o vulnerar los controles de seguridad del portal.',
      },
      {
        titulo: '4. Disponibilidad',
        texto: 'Buscamos mantener el servicio disponible, pero puede haber interrupciones por mantenimiento o por causas ajenas a la empresa.',
      },
    ],
  },
  cookies: {
    titulo: 'Política de Cookies',
    resumen: 'Qué cookies usa el portal y cómo puedes gestionarlas.',
    secciones: [
      {
        titulo: '1. Necesarias',
        texto: 'Mantienen la sesión y la seguridad del portal. No se pueden desactivar porque el servicio no funcionaría sin ellas.',
      },
      {
        titulo: '2. Preferencias',
        texto: 'Recuerdan ajustes como el modo día o noche y tus elecciones de este aviso.',
      },
      {
        titulo: '3. Analíticas',
        texto: 'Miden de forma anonimizada el uso del portal para mejorarlo. Solo se activan si las aceptas.',
      },
      {
        titulo: '4. Cómo cambiar tu decisión',
        texto: 'Puedes modificar tus preferencias en cualquier momento desde el enlace "Gestión de cookies" del pie de página.',
      },
    ],
  },
};
