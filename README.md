# somos-la-mickey

Frontend en React + Vite, autenticación con Supabase Auth y capa backend con API Routes de Vercel para la app `somos-la-mickey`.

## Requisitos

- Node.js 20+
- Proyecto en Supabase
- Vercel CLI opcional para pruebas de deploy

## Variables de entorno

Crear `.env.local` para desarrollo frontend:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_APPLICATION_ID=...
```

Configurar en Vercel (Project Settings -> Environment Variables):

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_APPLICATION_ID=...
```

`VITE_APPLICATION_ID` es obligatoria para aislar datos por aplicacion.  
Para este proyecto debe ser:

```bash
VITE_APPLICATION_ID=somoslamickey
```

## Levantar local

```bash
npm install
npm run dev
```

## Setup Supabase desde cero (recomendado)

Para una instalacion limpia, usar solo el bootstrap consolidado:

- `supabase/migrations/202604170001_bootstrap_somoslamickey.sql`

Ese SQL crea todo en esquema prefijado y deja listo:
`somoslamickey_profiles`, `somoslamickey_clientes`, `somoslamickey_configuracion`,
`somoslamickey_ciclos`, `somoslamickey_compras`, `somoslamickey_promociones`,
indices, trigger de auth, RLS y policies.

### Pasos exactos

1. Crear un proyecto nuevo en Supabase (o limpiar DB si queres reset total).
2. En SQL Editor, ejecutar completo `202604170001_bootstrap_somoslamickey.sql`.
3. En `Authentication -> Providers -> Email`, habilitar Email/Password.
4. En `Authentication -> Providers -> Email`, desactivar `Confirm email` para login inmediato al registrarse.
5. Probar registro nuevo desde la app.

### Checklist rapido de verificacion

- Existe trigger `on_auth_user_created` sobre `auth.users`.
- `public.handle_new_user` inserta en `somoslamickey_profiles` y `somoslamickey_clientes`.
- Al registrarte, se crea fila en ambas tablas para el `auth.users.id`.

## Auth en producción (Supabase + Vercel)

Revisá todo en el **mismo** proyecto Supabase que usan `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`:

1. **Authentication → Providers → Email**: proveedor habilitado.
2. **Authentication → Providers → Email**: para este setup inicial dejar **Confirm email** desactivado.
3. **Authentication → URL configuration**: **Site URL** = la URL pública de la app (ej. `https://somos-la-mickey.vercel.app`). En **Redirect URLs** incluí esa URL y comodines necesarios (ej. `https://somos-la-mickey.vercel.app/**`).
4. **Vercel**: mismas variables que en `.env.local` para el frontend; además `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para las rutas en `api/` (sync de cliente, etc.).

Los registros nuevos quedan con rol `cliente`. Para el **primer administrador**, en SQL (sustituí el email):

```sql
update public.somoslamickey_profiles
set role = 'admin'
where email = 'tu-admin@ejemplo.com';
```

## Migración de datos históricos

Script idempotente:

```bash
node scripts/migrate-legacy-to-supabase.mjs ./ruta/export.json
```

El JSON de entrada debe incluir arrays: `clientes`, `configuracion`, `ciclos`, `compras`, `promociones`.

## Deploy en Vercel

- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: `Vite`
- API Routes: carpeta `api/`

El proyecto incluye `vercel.json` con rewrite para SPA y rutas internas.
