import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing env var ${key}`);
  }
}

const sourcePath = process.argv[2];
if (!sourcePath) {
  throw new Error('Usage: node scripts/migrate-legacy-to-supabase.mjs <export-file.json>');
}

const resolvedPath = path.resolve(process.cwd(), sourcePath);
const raw = await fs.readFile(resolvedPath, 'utf8');
const source = JSON.parse(raw);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function upsert(table, rows, conflictColumn) {
  if (!rows?.length) return [];
  const { data, error } = await supabase.from(table).upsert(rows, { onConflict: conflictColumn }).select('*');
  if (error) throw error;
  return data || [];
}

const clientes = source.clientes || [];
const configuracion = source.configuracion || [];
const ciclos = source.ciclos || [];
const compras = source.compras || [];
const promociones = source.promociones || [];
const configuracionNormalized = configuracion.map((item) => ({
  ...item,
  slug_app: item.slug_app || 'somos-la-mickey',
}));

await upsert('somoslamickey_clientes', clientes, 'id');
await upsert('somoslamickey_configuracion', configuracionNormalized, 'id');
await upsert('somoslamickey_ciclos', ciclos, 'id');
await upsert('somoslamickey_compras', compras, 'id');
await upsert('somoslamickey_promociones', promociones, 'id');

const checks = {};
for (const table of [
  'somoslamickey_clientes',
  'somoslamickey_configuracion',
  'somoslamickey_ciclos',
  'somoslamickey_compras',
  'somoslamickey_promociones',
]) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  checks[table] = count ?? 0;
}

console.log('Migration complete');
console.log(JSON.stringify(checks, null, 2));
