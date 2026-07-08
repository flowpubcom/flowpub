# Correos de Auth (Supabase) — con la marca FlowPub

Plantillas HTML de los correos que Supabase Auth envía. **No las usa la app**: se
pegan a mano en el dashboard. Viven aquí como fuente de verdad para volver a
aplicarlas si Supabase resetea una plantilla o cambia el diseño.

## Dónde se pegan

Supabase → **Authentication → Emails → Templates** → abrir cada tipo → pestaña
**Source** → pegar TODO el HTML → **Save changes**.

| Archivo | Plantilla en Supabase | Asunto | Variable |
|---|---|---|---|
| `confirmar-registro.html` | Confirm sign up | `Confirma tu correo y entra a FlowPub` | `{{ .ConfirmationURL }}` |
| `restablecer-contrasena.html` | Reset password | `Restablece tu contraseña de FlowPub` | `{{ .ConfirmationURL }}` |

> Aplicadas en producción el 2026-07-07 (proyecto `syesetjvlhfbniicdgeg`).
> Faltan por marcar (usan el default en inglés): Invite user, Magic link, Change
> email, Reauthentication. Hoy el registro es email/Google, así que no urgen;
> cuando toquen, clonar el mismo shell y cambiar copy + variable.

## Decisiones de diseño de correo (por qué así)

- **Tablas + estilos inline**, no flexbox: Gmail/Outlook ignoran mucho CSS moderno.
- **Marca = PNG hospedado** (`https://flowpub.app/icono-512`), NO la vírgula SVG:
  Gmail bloquea SVG inline. Aunque el cliente bloquee imágenes, el wordmark
  *Flow*Pub es texto y siempre se ve.
- **Fraunces** vía Google Fonts `<link>` (Apple Mail/iOS lo carga; el resto cae a
  Georgia). Grana `#C0303A` solo en el botón (rol reservado del CTA).
- Tema **claro fijo** (`color-scheme: light only`): un correo no hereda el dark
  de la app y queremos consistencia de marca.

## SMTP (Resend) — YA configurado

Custom SMTP activo en **Authentication → Emails → SMTP Settings**:
`smtp.resend.com:465`, usuario `resend`, remitente `hola@flowpub.app` (FlowPub).
Con esto los correos NO salen por el SMTP default de Supabase (2–4/hora), sino por
Resend. Verificar de vez en cuando que el dominio `flowpub.app` siga **Verified**
en el dashboard de Resend (registros DNS en Namecheap).
