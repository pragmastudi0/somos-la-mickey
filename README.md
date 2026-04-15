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
```

Configurar en Vercel (Project Settings -> Environment Variables):

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Levantar local

```bash
npm install
npm run dev
```

## Migraciones SQL (Supabase)

Aplicar en orden en tu proyecto Supabase:

- `supabase/migrations/202604150001_init_socios.sql` — tablas base (nombres legacy sin prefijo)
- `supabase/migrations/202604150002_configuracion_slug_app.sql` — columna `slug_app`
- `supabase/migrations/202604160001_rename_tables_somoslamickey.sql` — renombra tablas a `somoslamickey_*`, RLS y trigger de auth

Tras la última migración, las tablas en Postgres son: `somoslamickey_profiles`, `somoslamickey_clientes`, `somoslamickey_configuracion`, `somoslamickey_ciclos`, `somoslamickey_compras`, `somoslamickey_promociones`.

### Comprobar que el alta de usuario funciona (SQL)

En el SQL Editor de Supabase:

- Deben existir `public.somoslamickey_profiles` y `public.somoslamickey_clientes`.
- El trigger `on_auth_user_created` en `auth.users` debe ejecutar `handle_new_user` que inserta en esas tablas (ver migración `202604160001_rename_tables_somoslamickey.sql`).

## Auth en producción (Supabase + Vercel)

Revisá todo en el **mismo** proyecto Supabase que usan `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`:

1. **Authentication → Providers → Email**: proveedor habilitado.
2. **Authentication → Emails**: si **Confirm email** está activo, tras registrarse el usuario **no tendrá sesión** hasta abrir el enlace del correo; hasta entonces el login con contraseña puede responder error (p. ej. email no confirmado).
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
