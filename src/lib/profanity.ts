// Detección ligera de lenguaje altisonante (ES-MX + EN) para pre-marcar la
// casilla del composer. NO es censura: solo sugiere la etiqueta; el autor
// decide. Palabras completas (con acentos normalizados), sin subcadenas —
// «asistente» no dispara por «tente».

const WORDS = [
  // español / mexicano
  "pendejo", "pendeja", "pendejada", "cabron", "cabrona", "cabrones",
  "chingar", "chingada", "chingado", "chingados", "chinga", "chingon",
  "chingona", "chingaderas", "chingadera", "verga", "vergas", "wey", "guey",
  "pinche", "pinches", "mierda", "mierdas", "puta", "puto", "putas", "putos",
  "putada", "joder", "jodido", "jodida", "carajo", "coño", "culero", "culera",
  "culeros", "mamon", "mamona", "mamadas", "mamada", "pedo", "pedos",
  "cagada", "cagado", "cabrear", "estupido", "estupida", "imbecil",
  "huevon", "huevona", "ojete", "naco", "zorra", "perra", "malparido",
  "gilipollas", "polla", "capullo", "hostia",
  // inglés
  "fuck", "fucking", "fucked", "fucker", "shit", "shitty", "bullshit",
  "asshole", "bitch", "bitches", "bastard", "dick", "cunt", "motherfucker",
  "damn", "goddamn", "crap", "piss", "pissed", "whore", "slut",
];

const SET = new Set(WORDS);

/** Normaliza: minúsculas y sin acentos (chingón → chingon). */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** ¿El texto trae palabras altisonantes? (palabras completas) */
export function hasProfanity(text: string): boolean {
  if (!text) return false;
  const tokens = normalize(text).split(/[^a-zñü]+/);
  for (const t of tokens) {
    if (t && SET.has(t)) return true;
  }
  return false;
}
