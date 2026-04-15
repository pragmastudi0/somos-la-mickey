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

El esquema inicial está en:

- `supabase/migrations/202604150001_init_socios.sql`

Aplicar la migración en tu proyecto Supabase antes de usar la app.

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
