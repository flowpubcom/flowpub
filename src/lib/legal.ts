// Documentos legales de FlowPub (México, español). Base sólida y honesta para
// el beta — revisarla con un profesional antes del lanzamiento amplio.
// Inspirado en la solución de Gulu: un solo lugar para Términos, Privacidad y
// Cookies, accesible desde el aviso, el menú del avatar y el onboarding.

export type LegalId = "terminos" | "privacidad" | "cookies";

export interface LegalSection {
  h?: string;
  p: string[];
}

export interface LegalDoc {
  id: LegalId;
  title: string;
  updated: string;
  sections: LegalSection[];
}

const RESPONSABLE =
  "Julio Sahagún Sánchez, radicado en Zoncuantla, Coatepec, Veracruz, México";
const CONTACTO = "pentrexyl@gmail.com";
const UPDATED = "Última actualización: julio de 2026";

export const LEGAL: Record<LegalId, LegalDoc> = {
  terminos: {
    id: "terminos",
    title: "Términos y Condiciones de uso",
    updated: UPDATED,
    sections: [
      {
        p: [
          "Bienvenida y bienvenido a FlowPub. Al usar esta plataforma aceptas estos Términos y Condiciones. Si no estás de acuerdo, por favor no la utilices.",
        ],
      },
      {
        h: "1. Responsable y contacto",
        p: [
          `El responsable de FlowPub (flowpub.app) es ${RESPONSABLE}.`,
          `Para cualquier asunto relacionado con la plataforma escribe a ${CONTACTO}.`,
        ],
      },
      {
        h: "2. Qué es FlowPub",
        p: [
          "FlowPub es una red social de voz: grabas un audio de hasta 3 minutos (un «Flow»), la plataforma lo transcribe y lo pule con inteligencia artificial hasta volverlo un artículo con portada, y la comunidad lo escucha, lo lee, lo comenta (con texto o voz), le da me gusta y lo comparte. Incluye perfiles públicos, seguidores, mensajes privados (texto y voz), notificaciones e invitaciones.",
          "Todo Flow publicado muestra su versión pulida y conserva siempre disponible el transcript original de la voz.",
        ],
      },
      {
        h: "3. Cuentas",
        p: [
          "Cualquier persona puede escuchar y leer el Pub sin cuenta. Para publicar, comentar, seguir, guardar o enviar mensajes necesitas una cuenta (correo y contraseña, o Google). El registro está protegido con Cloudflare Turnstile.",
          "Te comprometes a dar información veraz, a no suplantar identidades y a mantener tu contraseña segura. Los nombres de usuario que generen confusión con FlowPub están reservados.",
        ],
      },
      {
        h: "4. Tu contenido y tu licencia",
        p: [
          "Lo que publicas es tuyo: conservas todos los derechos sobre tus audios, textos e imágenes.",
          "Al publicar nos otorgas una licencia no exclusiva, mundial y gratuita para alojar, reproducir, transformar técnicamente (transcripción, pulido, portadas) y mostrar tu contenido dentro de la plataforma y en sus vistas previas al compartirse (por ejemplo, en WhatsApp o redes). La licencia termina cuando eliminas el contenido, salvo copias técnicas temporales.",
          "Declaras tener los derechos del contenido que publicas, incluida tu propia voz y las imágenes que subas.",
        ],
      },
      {
        h: "5. Contenido sensible y mayores de edad",
        p: [
          "Al publicar puedes (y debes, cuando aplique) marcar si tu Flow contiene palabras altisonantes o si es para mayores de 18 años. Los Flows del tema «Hot» son siempre para mayores de 18.",
          "El contenido 18+ solo puede escucharse por personas que hayan declarado su fecha de nacimiento en su perfil y sean mayores de edad. La fecha de nacimiento es privada y se usa únicamente para esta verificación.",
          "Está prohibido el contenido ilegal, el acoso, la incitación al odio, la explotación de menores en cualquier forma, y hacerse pasar por otra persona. FlowPub puede ocultar o retirar contenido y suspender cuentas que violen estos términos.",
        ],
      },
      {
        h: "6. Inteligencia artificial y servicios de terceros",
        p: [
          "La transcripción, el pulido del texto, la traducción opcional y otras funciones usan Google Gemini. Tus audios y textos se envían a ese servicio exclusivamente para prestarte estas funciones.",
          "La plataforma se apoya además en Supabase (base de datos, autenticación y almacenamiento), Vercel (alojamiento web), Cloudflare Turnstile (protección anti-bots) y Resend (correos transaccionales).",
        ],
      },
      {
        h: "7. Invitaciones",
        p: [
          "Cada cuenta recibe invitaciones para compartir por enlace. Al canjearse, quien invita y quien llega se siguen mutuamente. Las invitaciones no son transferibles fuera de su enlace ni canjeables por ningún valor.",
        ],
      },
      {
        h: "8. Moderación",
        p: [
          "FlowPub puede destacar, ocultar o retirar contenido, y suspender o eliminar cuentas, cuando exista violación de estos términos o de la ley. Buscamos avisar y explicar, salvo casos graves o urgentes.",
        ],
      },
      {
        h: "9. Propiedad intelectual de FlowPub",
        p: [
          "La marca FlowPub, la vírgula, el diseño de la plataforma y su código son propiedad de su responsable. Las portadas generativas creadas para tu Flow forman parte de tu publicación.",
        ],
      },
      {
        h: "10. Responsabilidad",
        p: [
          "FlowPub se ofrece «tal cual», en fase beta. Hacemos lo razonable para que el servicio funcione bien y tus datos estén seguros, pero no garantizamos disponibilidad ininterrumpida ni ausencia total de errores. El contenido publicado por cada persona es responsabilidad de quien lo publica.",
        ],
      },
      {
        h: "11. Cambios y ley aplicable",
        p: [
          "Podremos actualizar estos términos; los cambios relevantes se avisarán en la plataforma. El uso continuado tras un cambio implica su aceptación.",
          "Estos términos se rigen por las leyes de los Estados Unidos Mexicanos.",
        ],
      },
    ],
  },
  privacidad: {
    id: "privacidad",
    title: "Aviso de Privacidad",
    updated: UPDATED,
    sections: [
      {
        h: "1. Responsable",
        p: [
          `${RESPONSABLE} es el responsable del tratamiento de tus datos personales en FlowPub (flowpub.app). Contacto: ${CONTACTO}.`,
        ],
      },
      {
        h: "2. Qué datos tratamos",
        p: [
          "De tu cuenta: correo electrónico y contraseña (cifrada por Supabase Auth), o tu identidad de Google si entras con Google.",
          "De tu perfil: nombre para mostrar, usuario, bio, foto, banner y, si la das, tu fecha de nacimiento (privada: nunca se muestra ni se expone por la API pública; solo habilita el contenido 18+).",
          "De tu actividad: tus Flows (audio, transcript, texto pulido, portada), comentarios (texto o voz con transcript), me gusta, guardados, seguimientos, invitaciones y mensajes privados.",
          "Técnicos mínimos: cookies de sesión y preferencias locales (tema, idioma). No usamos rastreadores publicitarios ni analítica de terceros.",
        ],
      },
      {
        h: "3. Para qué los usamos",
        p: [
          "Para operar FlowPub: crear tu cuenta, publicar y mostrar tu contenido, habilitar la parte social (seguir, comentar, mensajes), enviarte correos de la cuenta (confirmación, recuperación) y proteger el registro contra bots.",
          "No vendemos tus datos ni los compartimos con fines publicitarios.",
        ],
      },
      {
        h: "4. Encargados (terceros que procesan datos por nosotros)",
        p: [
          "Supabase (base de datos, autenticación, almacenamiento de audio e imágenes), Vercel (alojamiento), Google Gemini (transcripción, pulido y traducción de tus audios/textos cuando usas esas funciones), Cloudflare Turnstile (anti-bots en el registro) y Resend (correos). Estos proveedores pueden procesar datos en servidores fuera de México (por ejemplo, Estados Unidos), bajo sus propias garantías de seguridad.",
        ],
      },
      {
        h: "5. Conservación",
        p: [
          "Tu contenido vive mientras tu cuenta exista o hasta que lo elimines. Al eliminar tu cuenta se elimina en cascada tu contenido (Flows, comentarios, likes, mensajes, invitaciones). Pueden persistir copias técnicas temporales por un periodo razonable.",
        ],
      },
      {
        h: "6. Tus derechos (ARCO)",
        p: [
          `Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos, así como revocar tu consentimiento, escribiendo a ${CONTACTO}. Atenderemos tu solicitud en los plazos que marca la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.`,
        ],
      },
      {
        h: "7. Menores",
        p: [
          "FlowPub no está dirigida a menores de 16 años. El contenido marcado 18+ requiere además mayoría de edad declarada.",
        ],
      },
      {
        h: "8. Cambios",
        p: [
          "Si este aviso cambia de forma relevante, lo publicaremos aquí y lo señalaremos en la plataforma.",
        ],
      },
    ],
  },
  cookies: {
    id: "cookies",
    title: "Política de Cookies",
    updated: UPDATED,
    sections: [
      {
        p: [
          "FlowPub usa únicamente cookies y almacenamiento local ESENCIALES para funcionar. No hay cookies publicitarias, de rastreo ni de analítica de terceros.",
        ],
      },
      {
        h: "1. Cookies de sesión",
        p: [
          "Supabase Auth guarda cookies para mantener tu sesión iniciada de forma segura. Sin ellas no podrías publicar, comentar ni ver tus mensajes.",
        ],
      },
      {
        h: "2. Preferencias locales (localStorage)",
        p: [
          "Guardamos en tu navegador tus preferencias: tema claro/oscuro (fp-theme), idioma (fp-lang), sonido, si ya viste el aviso de instalación o este aviso de cookies, y el código de invitación mientras creas tu cuenta. Estos datos viven solo en tu dispositivo.",
        ],
      },
      {
        h: "3. Cómo controlarlas",
        p: [
          "Puedes borrar las cookies y el almacenamiento local desde la configuración de tu navegador. Si borras las de sesión, tendrás que iniciar sesión de nuevo.",
          `Dudas: ${CONTACTO}.`,
        ],
      },
    ],
  },
};

export const LEGAL_ORDER: LegalId[] = ["terminos", "privacidad", "cookies"];
