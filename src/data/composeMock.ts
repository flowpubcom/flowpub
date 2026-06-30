// Contenido simulado del flujo de creación (front-first). Cuando entre Gemini,
// estas constantes se reemplazan por la respuesta real de transcribe/polish.

// Transcript crudo «sin pulir» (con muletillas y pausas), como lo daría el STT.
export const RAW_TRANSCRIPT =
  "eh… hola, quería hablar un poco sobre, este, sobre el barro y los datos, ¿no? " +
  "o sea, llevo días pensando en cómo lo que uno moldea con las manos también, " +
  "este, guarda memoria… y, y por qué la voz es como el primer molde de lo que " +
  "pensamos, antes de escribirlo. perdón, me enredo, pero la idea es esa: que " +
  "hablar es moldear sin miedo a romper, y que el audio guarda lo que la " +
  "transcripción pierde, las dudas, las pausas. eso. gracias.";

// Stream de palabras para el transcript «en vivo» durante la grabación.
export const WORDS = RAW_TRANSCRIPT.split(/\s+/);

// Artículo pulido (markdown only) que devolvería el pulido con IA.
export const POLISHED_MD = `## El barro recuerda

Llevo días pensando en algo que vive entre el barro y los datos: cómo lo que se moldea con las manos también guarda memoria.

La voz es el **primer molde**. Antes de escribir, antes de endurecer una idea, la decimos. Y al decirla, ya le damos forma.

> El barro guarda memoria; la voz es el primer molde de lo que pensamos, antes de que la escritura lo endurezca.

Tres cosas que me llevo:

- Hablar es moldear sin miedo a romper.
- El audio guarda lo que la transcripción pierde: las dudas, las pausas.
- Publicar la voz es dejar la huella antes del barniz.`;

export const SUGGESTED_TITLE = "Nueve minutos sobre el barro";
export const SUGGESTED_TAGS = ["Arte", "Cultura"];
