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
