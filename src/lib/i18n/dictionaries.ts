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
  "auth.signout": "Cerrar sesión",

  // ── Onboarding (designs/Onboarding.dc.html) ──────────────────────────────
  "onb.tagline": "La voz que se vuelve publicación.",
  "onb.eyebrow": "Crea tu cuenta",
  "onb.auth.title": "Escuchar el Pub es libre. Para publicar tu voz, entra.",
  "onb.auth.subtitle":
    "Toma menos de un minuto. Después podrás grabar tu primer Flow.",
  "onb.auth.sheet": "Escuchar es libre. Para publicar, entra.",
  "onb.haveAccount": "¿Ya tienes cuenta?",
  "onb.login": "Inicia sesión",
  "onb.noAccount": "¿No tienes cuenta?",
  "onb.createOne": "Crea una",
  "onb.legal":
    "Al continuar aceptas los Términos y el Aviso de privacidad. Protegido por Turnstile.",

  "onb.email.label": "Correo",
  "onb.email.placeholder": "tu@correo.com",
  "onb.password.label": "Contraseña",
  "onb.password.placeholder": "Mínimo 8 caracteres",
  "onb.signup.submit": "Crear cuenta",
  "onb.login.title": "Bienvenida de vuelta",
  "onb.login.subtitle": "Entra para seguir publicando tu voz.",
  "onb.login.submit": "Entrar",

  "onb.err.credentials": "Correo o contraseña incorrectos.",
  "onb.err.emailInUse": "Ese correo ya tiene cuenta. Inicia sesión.",
  "onb.err.weakPassword": "La contraseña debe tener al menos 8 caracteres.",
  "onb.err.usernameTaken": "Ese usuario ya está ocupado.",
  "onb.err.generic": "Algo salió mal. Intenta de nuevo.",
  "onb.check.email":
    "Te mandamos un correo para confirmar tu cuenta. Ábrelo para continuar.",

  "onb.themes.title": "¿Qué te mueve?",
  "onb.themes.subtitle":
    "Elige 3 temas para empezar tu Pub. Después puedes cambiarlos.",
  "onb.continue": "Continuar",

  "onb.profile.title": "¿Cómo te van a conocer?",
  "onb.profile.subtitle": "Puedes ajustar todo esto luego en tu perfil.",
  "onb.profile.photo": "Sube una foto",
  "onb.profile.optional": "opcional",
  "onb.profile.name": "Nombre",
  "onb.profile.namePlaceholder": "Tu nombre",
  "onb.profile.username": "Usuario",
  "onb.profile.usernamePlaceholder": "tunombre",
  "onb.profile.usernameHint": "Tu enlace será flowpub.lat/@tunombre",
  "onb.profile.usernameAvailable": "@{u} está disponible",
  "onb.profile.usernameMin": "Mínimo 3 caracteres",
  "onb.profile.bio": "Bio",
  "onb.profile.bioPlaceholder": "Una línea sobre tu voz…",
  "onb.profile.submit": "Crear mi Pub",

  "onb.ready.title": "Tu Pub está listo",
  "onb.ready.titleNamed": "Tu Pub está listo, {name}",
  "onb.ready.subtitle":
    "Estas son tus voces para empezar. El Pub ya se está escribiendo.",
  "onb.ready.enter": "Entrar al Pub",
  "onb.ready.record": "Grabar mi primer Flow",

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
  "auth.signout": "Sign out",

  // ── Onboarding ───────────────────────────────────────────────────────────
  "onb.tagline": "The voice that becomes a publication.",
  "onb.eyebrow": "Create your account",
  "onb.auth.title": "Listening to the Pub is free. To publish your voice, sign in.",
  "onb.auth.subtitle":
    "It takes less than a minute. Then you can record your first Flow.",
  "onb.auth.sheet": "Listening is free. To publish, sign in.",
  "onb.haveAccount": "Already have an account?",
  "onb.login": "Sign in",
  "onb.noAccount": "No account yet?",
  "onb.createOne": "Create one",
  "onb.legal":
    "By continuing you accept the Terms and Privacy Notice. Protected by Turnstile.",

  "onb.email.label": "Email",
  "onb.email.placeholder": "you@email.com",
  "onb.password.label": "Password",
  "onb.password.placeholder": "At least 8 characters",
  "onb.signup.submit": "Create account",
  "onb.login.title": "Welcome back",
  "onb.login.subtitle": "Sign in to keep publishing your voice.",
  "onb.login.submit": "Sign in",

  "onb.err.credentials": "Wrong email or password.",
  "onb.err.emailInUse": "That email already has an account. Sign in.",
  "onb.err.weakPassword": "Password must be at least 8 characters.",
  "onb.err.usernameTaken": "That username is taken.",
  "onb.err.generic": "Something went wrong. Try again.",
  "onb.check.email":
    "We sent you an email to confirm your account. Open it to continue.",

  "onb.themes.title": "What moves you?",
  "onb.themes.subtitle":
    "Pick 3 topics to start your Pub. You can change them later.",
  "onb.continue": "Continue",

  "onb.profile.title": "How will people know you?",
  "onb.profile.subtitle": "You can adjust all of this later in your profile.",
  "onb.profile.photo": "Upload a photo",
  "onb.profile.optional": "optional",
  "onb.profile.name": "Name",
  "onb.profile.namePlaceholder": "Your name",
  "onb.profile.username": "Username",
  "onb.profile.usernamePlaceholder": "yourname",
  "onb.profile.usernameHint": "Your link will be flowpub.lat/@yourname",
  "onb.profile.usernameAvailable": "@{u} is available",
  "onb.profile.usernameMin": "At least 3 characters",
  "onb.profile.bio": "Bio",
  "onb.profile.bioPlaceholder": "One line about your voice…",
  "onb.profile.submit": "Create my Pub",

  "onb.ready.title": "Your Pub is ready",
  "onb.ready.titleNamed": "Your Pub is ready, {name}",
  "onb.ready.subtitle":
    "These are your voices to start. The Pub is already being written.",
  "onb.ready.enter": "Enter the Pub",
  "onb.ready.record": "Record my first Flow",

  "common.cancel": "Cancel",
  "common.back": "Back",
  "common.minutes": "{n} min",
};

export const dictionaries: Record<Lang, Record<DictKey, string>> = { es, en };
