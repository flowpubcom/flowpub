// Serializa un objeto JSON-LD para incrustarlo en <script> de forma SEGURA.
//
// `JSON.stringify` NO escapa `</script>` ni `<!--`, así que un campo editable
// por el usuario (bio, display_name, título de un Flow) podía cerrar el
// <script type="application/ld+json"> e inyectar HTML/JS arbitrario — XSS
// almacenado con robo de sesión para cualquiera que abriera esa página.
//
// Escapamos `<`, `>` y `&` a sus escapes unicode: quedan idénticos como DATO
// JSON (los parsers los leen igual) pero ya no pueden romper el tag ni abrir un
// comentario HTML. Patrón estándar para JSON embebido en HTML.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
