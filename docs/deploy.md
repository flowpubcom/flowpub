# Deploy de FlowPub — Vercel + dominio en Namecheap

> Decisión: **el front corre en Vercel** (Next.js 16 necesita SSR/serverless;
> el hosting compartido de Namecheap Stellar no lo soporta). **El dominio
> `flowpub.lat` se queda registrado en Namecheap** y solo se apunta por DNS.

## 0) Antes del primer deploy

- [ ] Mergear la rama de trabajo a `main` (Vercel usa `main` = producción;
      las demás ramas generan *previews* con URL propia).
- [ ] Migraciones al día en Supabase (`migration_03` y `migration_04`).

## 1) Subir el repo a GitHub

1. Crea un repo **privado** en github.com (p. ej. `flowpub`). Sin README ni
   .gitignore (ya existen).
2. En `D:\FlowPub\app`:
   ```bash
   git remote add origin https://github.com/<TU-USUARIO>/flowpub.git
   git push -u origin main
   ```

## 2) Vercel

1. [vercel.com](https://vercel.com) → **Sign up with GitHub**.
2. **Add New → Project → Import** el repo `flowpub`. Detecta Next.js solo;
   no cambies build settings.
3. **Environment Variables** (antes del primer deploy) — mismos nombres que
   `.env.local`, valores directo en el dashboard (nunca al repo):

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | la URL del proyecto |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la publishable |
   | `GEMINI_API_KEY` | la llave de Gemini |
   | `NEXT_PUBLIC_SITE_URL` | `https://flowpub.lat` |
   | `SUPABASE_SERVICE_ROLE_KEY` · `TURNSTILE_*` · `RESEND_API_KEY` | cuando toquen sus fases |

4. **Deploy** → te da `flowpub-….vercel.app` para probar.

## 3) Apuntar flowpub.lat (DNS en Namecheap)

1. En Vercel: **Project → Settings → Domains** → agrega `flowpub.lat` y
   `www.flowpub.lat`. Vercel te muestra los registros exactos.
2. En Namecheap: **Domain List → flowpub.lat → Advanced DNS** → borra los
   registros de estacionamiento (`URL Redirect` en `@` y `www`) y agrega el
   que Vercel indique en Domains → tu dominio → *Learn more* (Vercel rota la
   IP; usa siempre el valor que muestre ahí, no lo copies de memoria):

   | Tipo | Host | Valor (visto 2026-07-01) |
   |---|---|---|
   | A | `@` | `216.198.79.1` |

   No agregamos `www` a propósito: desmarcamos "Redirect apex domains to www"
   al conectar el dominio en Vercel, porque `flowpub.lat` (sin www) es la URL
   canónica en todo el sitio (`NEXT_PUBLIC_SITE_URL`, sitemap, OpenGraph). Si
   más adelante quieres que `www.flowpub.lat` también funcione, agrégalo en
   Vercel como dominio con "Redirect to Another Domain" → `flowpub.lat`.

   *(Alternativa: cambiar los nameservers a `ns1/ns2.vercel-dns.com` y
   administrar el DNS desde Vercel — más simple si el dominio solo es para
   esto; quédate en Namecheap DNS si usarás correo u otros subdominios ahí.)*
3. Espera la propagación (minutos a horas). Vercel emite el HTTPS solo.

## 4) Supabase en producción

- **Auth → URL Configuration**: Site URL = `https://flowpub.lat`; en Redirect
  URLs agrega `https://flowpub.lat/**` (conserva `http://localhost:3000/**`
  para dev).
- **Google Cloud → OAuth client**: agrega `https://flowpub.lat` a *Authorized
  JavaScript origins* (el redirect URI de Supabase no cambia). Publica la
  consent screen cuando salga de Testing.
- **Antes de abrir al público**: reactivar **Confirm email** (con Resend para
  correos decentes) + **Turnstile** en signup/login.

## 5) Checklist post-deploy

- [ ] `https://flowpub.lat` carga el Pub (claro/oscuro).
- [ ] Login + onboarding funcionan (cookies en el dominio real).
- [ ] Grabar→publicar un Flow (mic requiere HTTPS: en Vercel ya hay).
- [ ] `https://flowpub.lat/sitemap.xml` y `/robots.txt` con el dominio real.
- [ ] Alta en **Google Search Console** (ver `docs/seo.md`).

## Flujo de trabajo después

`git push` a `main` → producción. Ramas → preview URLs para probar antes de
mergear. Rollback instantáneo desde el dashboard de Vercel si algo sale mal.
