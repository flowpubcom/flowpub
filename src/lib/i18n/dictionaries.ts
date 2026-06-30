// Catálogo i18n — SOLO el chrome (interfaz) se traduce; el contenido de un Flow
// se queda en su idioma (con «Traducir» opt-in por Flow). Semilla de las keys de
// designs/Idiomas.dc.html; crece por fase. {n} = interpolación.

export type Lang = "es" | "en";

const es = {
  "nav.pub": "El Pub",
  "nav.explore": "Explorar",
  "nav.messages": "Mensajes",
  "nav.notifications": "Notificaciones",
  "nav.profile": "Perfil",

  "record": "Grabar un Flow",
  "record.short": "Grabar",
  "tagline": "Habla. FlowPub lo vuelve publicación.",

  "filter.all": "Todos",

  "audio": "Audio",
  "play": "Reproducir",
  "pause": "Pausar",
  "like": "Me gusta",
  "comment": "Comentar",
  "share": "Compartir",
  "save": "Guardar",
  "follow": "Seguir",
  "following": "Siguiendo",
  "view_transcript": "Ver transcript",
  "translate": "Traducir",
  "original_content": "Contenido en su idioma original",

  "theme.light": "Tema claro",
  "theme.dark": "Tema oscuro",
  "sound.on": "Sonido activado",
  "sound.off": "Silenciado",
  "lang.auto": "Automático",

  "auth.title": "Para grabar un Flow, entra a FlowPub",
  "auth.body":
    "Cualquiera puede escuchar el Pub. Para publicar tu voz, crea tu cuenta —toma menos de un minuto.",
  "auth.google": "Continuar con Google",
  "auth.email": "Crear cuenta con correo",
  "auth.dismiss": "Ahora no, sigo escuchando",

  "common.cancel": "Cancelar",
  "common.back": "Atrás",
  "common.minutes": "{n} min",
} as const;

export type DictKey = keyof typeof es;

const en: Record<DictKey, string> = {
  "nav.pub": "The Pub",
  "nav.explore": "Explore",
  "nav.messages": "Messages",
  "nav.notifications": "Notifications",
  "nav.profile": "Profile",

  "record": "Record a Flow",
  "record.short": "Record",
  "tagline": "Speak. FlowPub turns it into a publication.",

  "filter.all": "All",

  "audio": "Audio",
  "play": "Play",
  "pause": "Pause",
  "like": "Like",
  "comment": "Comment",
  "share": "Share",
  "save": "Save",
  "follow": "Follow",
  "following": "Following",
  "view_transcript": "View transcript",
  "translate": "Translate",
  "original_content": "Content in its original language",

  "theme.light": "Light theme",
  "theme.dark": "Dark theme",
  "sound.on": "Sound on",
  "sound.off": "Muted",
  "lang.auto": "Automatic",

  "auth.title": "To record a Flow, sign in to FlowPub",
  "auth.body":
    "Anyone can listen to the Pub. To publish your voice, create your account —it takes less than a minute.",
  "auth.google": "Continue with Google",
  "auth.email": "Create account with email",
  "auth.dismiss": "Not now, I'll keep listening",

  "common.cancel": "Cancel",
  "common.back": "Back",
  "common.minutes": "{n} min",
};

export const dictionaries: Record<Lang, Record<DictKey, string>> = { es, en };
