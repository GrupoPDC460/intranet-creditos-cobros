# Intranet · Créditos y Cobros · Grupo PDC

Portal corporativo interno del Departamento de Créditos y Cobros de **Grupo PDC**. Centraliza en un solo lugar todos los recursos del equipo —dashboards, sistemas, tableros de Power BI, carpetas de OneDrive/SharePoint, reportes, formularios y enlaces— organizados en una jerarquía **Categorías → Subcategorías → Recursos**, con buscador global, favoritos por usuario y un panel de administración protegido para gestionar todo el contenido sin tocar código.

> Diseño premium "midnight glass": interfaz oscura azul-tinta, vidrio esmerilado por capas, microinteracciones a 60 fps y respeto por `prefers-reduced-motion`. Todo en español.

---

## Tabla de contenidos

1. [Stack tecnológico](#stack-tecnológico)
2. [Arranque local](#arranque-local)
3. [Variables de entorno](#variables-de-entorno)
4. [Acceso al panel de administración](#acceso-al-panel-de-administración)
5. [Cómo agregar una URL / recurso](#cómo-agregar-una-url--recurso)
6. [Cómo administrar categorías y subcategorías](#cómo-administrar-categorías-y-subcategorías)
7. [Importar y exportar (CSV)](#importar-y-exportar-csv)
8. [Modo semilla vs. Supabase](#modo-semilla-vs-supabase)
9. [Base de datos: Supabase / PostgreSQL](#base-de-datos-supabase--postgresql)
10. [Despliegue en Vercel](#despliegue-en-vercel)
11. [Seguridad](#seguridad)
12. [Estructura del proyecto](#estructura-del-proyecto)
13. [Migración futura a Entra ID](#migración-futura-a-entra-id)
14. [Notas conocidas](#notas-conocidas)

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | **Next.js 14** (App Router) + React 18 + TypeScript |
| Estilos | Tailwind CSS 3 + design tokens propios (CSS variables) |
| Animación | Framer Motion (con *fallback* a `prefers-reduced-motion`) |
| Iconos | lucide-react |
| Persistencia | **Supabase** (PostgreSQL) en producción · repositorio de semilla de solo lectura como respaldo |
| Auth admin | Sesión firmada **HMAC-SHA256** (Web Crypto), cookie `httpOnly` |
| CSV | papaparse |
| Deploy | Vercel |

El acceso a datos usa un **patrón Repository**: la app funciona con datos de semilla incluso sin base de datos configurada, y pasa automáticamente a Supabase en cuanto se definen sus variables de entorno.

---

## Arranque local

Requisitos: **Node.js 18.17+** (recomendado 20 o 22).

```bash
# 1. Instalar dependencias
npm install

# 2. Crear tu archivo de entorno local a partir del ejemplo
cp .env.example .env.local
# edita .env.local y define al menos ADMIN_PASSWORD y SESSION_SECRET

# 3. Levantar en modo desarrollo
npm run dev
# → http://localhost:3000

# Build de producción / arranque
npm run build
npm start
```

> Sin variables de Supabase, la app arranca en **modo semilla** (solo lectura): verás las 5 categorías y 12 recursos de ejemplo, pero el panel no podrá guardar cambios (devuelve un aviso claro). Es el estado ideal para probar la interfaz.

---

## Variables de entorno

Copia `.env.example` a `.env.local` (local) o configúralas en el panel de Vercel (producción). **Nunca** se suben al repositorio (`.gitignore` ya excluye `.env*`).

| Variable | Obligatoria | Descripción |
|----------|:-----------:|-------------|
| `ADMIN_PASSWORD` | ✅ | Contraseña del panel de administración. |
| `SESSION_SECRET` | ✅ | Cadena aleatoria larga (32+ caracteres) para firmar la cookie de sesión. Genera una con `openssl rand -base64 48`. |
| `NEXT_PUBLIC_SUPABASE_URL` | ⛅ | URL del proyecto Supabase. Si falta, la app corre en modo semilla. |
| `SUPABASE_SERVICE_ROLE_KEY` | ⛅ | *Service role key* de Supabase (lado servidor; **no** exponer al cliente). Requerida para escribir. |

⛅ = requerida solo para habilitar persistencia real (lectura/escritura) en Supabase.

---

## Acceso al panel de administración

1. Ve a **`/login`**.
2. Ingresa la contraseña definida en `ADMIN_PASSWORD`.
3. Al validarse se crea una sesión firmada (cookie `pdc_session`, `httpOnly`, vigencia 8 h) y entras al panel en **`/admin`**.

Rutas protegidas (redirigen a `/login` si no hay sesión): todo bajo `/admin`. El *middleware* preserva el destino con `?next=` para regresarte a donde ibas tras iniciar sesión.

Para salir: botón **Cerrar sesión** en la barra lateral del panel.

---

## Cómo agregar una URL / recurso

Desde el panel (`/admin/recursos`):

1. Clic en **"Nuevo recurso"**.
2. Completa el formulario:
   - **Nombre** y **descripción** (opcional).
   - **URL** — se valida que sea `http(s)` segura; se rechazan esquemas peligrosos (`javascript:`, `data:`, etc.).
   - **Tipo** — dashboard, sistema, Power BI, OneDrive, SharePoint, Excel, Teams, formulario, documento, aplicación, web u otro (cada tipo tiene su ícono y color).
   - **Categoría** y **subcategoría** (opcional).
   - Interruptores **Activo** (visible al público) y **Destacado** (aparece en "Accesos rápidos"/destacados de la portada).
3. **Guardar**. El recurso aparece de inmediato en la categoría correspondiente y en el buscador global.

También puedes activar/desactivar o destacar recursos con los interruptores en línea de la tabla, editarlos o eliminarlos (con confirmación).

---

## Cómo administrar categorías y subcategorías

Desde **`/admin/categorias`**:

- **Crear categoría**: nombre, descripción, *slug* (URL) e ícono.
- **Subcategorías**: se agregan, renombran y **reordenan** (▲▼) dentro de cada categoría.
- **Eliminar**: al borrar una categoría se eliminan en cascada sus subcategorías y recursos (con confirmación).

Las categorías definen las páginas públicas en `/categoria/<slug>` (por ejemplo `/categoria/cobros`).

---

## Importar y exportar (CSV)

En `/admin/recursos`:

- **Exportar CSV** — descarga todos los recursos actuales.
- **Importar CSV** — carga masiva (hasta 1000 filas por lote). Columnas reconocidas:

  ```csv
  name,description,url,type,category,subcategory,featured,active
  Portal KACE,Gestión de tickets,https://ejemplo.quest.com,sistema,Operaciones,Sistemas,false,true
  ```

  - `type` acepta alias en español (p. ej. `power bi`, `powerbi`, `formulario`, `hoja de cálculo`).
  - Si la **categoría** no existe, se crea automáticamente.
  - El resultado informa cuántos recursos se crearon y detalla los errores por fila.

> La importación/exportación requiere **modo Supabase** (escritura). En modo semilla el panel lo indica.

---

## Modo semilla vs. Supabase

| | Modo semilla (sin BD) | Modo Supabase |
|---|---|---|
| Lectura | ✅ 5 categorías + 12 recursos de ejemplo | ✅ datos reales |
| Escritura (crear/editar/borrar/importar) | ❌ devuelve aviso "solo lectura" | ✅ |
| Cuándo se activa | por defecto | al definir `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` |

El panel muestra un **banner** cuando está en solo lectura, con la guía para conectar Supabase.

---

## Base de datos: Supabase / PostgreSQL

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor** y ejecuta el archivo [`supabase/schema.sql`](supabase/schema.sql). Crea las tablas `categories`, `subcategories`, `resources` (con claves foráneas en cascada e índices), habilita **RLS** con políticas de lectura pública y carga la misma semilla inicial.
3. En **Project Settings → API** copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
4. Define esas variables (local en `.env.local`, producción en Vercel) y reinicia. La app detecta Supabase y habilita la escritura.

El esquema usa `snake_case`; el repositorio de Supabase mapea automáticamente a/desde el `camelCase` de la app.

---

## Despliegue en Vercel

1. Sube este repositorio a GitHub (ya está en la organización **GrupoPDC460**).
2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importa el repositorio.
3. Framework: **Next.js** (autodetectado). No requiere configuración especial de build.
4. En **Settings → Environment Variables** agrega las cuatro variables:
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. **Deploy**. Cada `git push` a `main` genera un despliegue automático.

> Recomendado: ejecutar primero `supabase/schema.sql` en Supabase para que producción arranque con persistencia real.

---

## Seguridad

- **Sin secretos en el código**: todo por variables de entorno; `.gitignore` excluye `.env*`.
- **Sesión firmada** HMAC-SHA256 con cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción; verificación en tiempo constante de la contraseña.
- **Validación de URLs**: se bloquean esquemas peligrosos (`javascript:`, `data:`, `vbscript:`).
- **Cabeceras** de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
- **Rutas de escritura** exigen sesión de administrador; en modo semilla devuelven `501` con guía en lugar de fallar silenciosamente.
- Sitio marcado **`noindex`** (intranet interna).

---

## Estructura del proyecto

```
src/
  app/
    page.tsx                    # Portada (categorías, destacados, favoritos)
    categoria/[slug]/page.tsx   # Página de una categoría
    favoritos/page.tsx          # Favoritos del usuario (localStorage)
    login/page.tsx              # Inicio de sesión
    admin/                      # Panel protegido (dashboard, recursos, categorías, destacados, configuración)
    api/                        # Endpoints (auth, resources, categories, import)
    layout.tsx / error.tsx / not-found.tsx / loading.tsx
  components/                   # UI pública, tarjetas, buscador, panel admin
  lib/
    data/                       # repository, seed, seed-repo, supabase-repo, public
    auth.ts, validation.ts, utils.ts, types.ts, icons.tsx
  middleware.ts                 # Protección de /admin
supabase/schema.sql             # Esquema + semilla + RLS
```

---

## Migración futura a Entra ID

La autenticación está aislada en `src/lib/auth.ts` y el *middleware*. Para migrar a **Microsoft Entra ID (Azure AD)** basta con reemplazar la verificación de contraseña por el flujo OIDC/SSO (p. ej. NextAuth con el proveedor de Entra) y mantener la misma cookie de sesión; el resto de la app no cambia.

---

## Notas conocidas

- **Estado 404 de categoría inexistente**: `/categoria/<slug-invalido>` **muestra correctamente la página de "no encontrada"**, pero responde con estado HTTP 200 en lugar de 404. Es una limitación conocida de Next.js 14 al combinar renderizado dinámico con un *provider* de cliente global en el layout raíz (el shell hace *stream* y fija el 200 antes de que la página ejecute `notFound()`). Se mantiene así de forma deliberada porque la alternativa (`dynamicParams=false`) rompería la capacidad de que el administrador agregue categorías en tiempo de ejecución. Sin impacto real: el sitio es `noindex` y la experiencia de usuario es correcta.
- Las fuentes se cargan por `<link>` en el `<head>` (no `next/font`) por restricciones de red del entorno de construcción; funciona con normalidad en Vercel. El *warning* de lint `no-page-custom-font` es esperado y aceptado.
