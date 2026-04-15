import { allowMethods, sendError, sendJson } from '../_lib/http.js';
import { requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

function defaultNameFromEmail(email) {
  const local = (email || '').split('@')[0] || 'Cliente';
  return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const { user } = auth;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email,
          role: 'cliente',
        },
        { onConflict: 'id' },
      );

    if (profileError) throw profileError;

    const { error: clienteError } = await supabaseAdmin
      .from('clientes')
      .upsert(
        {
          auth_user_id: user.id,
          email: user.email,
          nombre: defaultNameFromEmail(user.email),
          fecha_alta: new Date().toISOString().slice(0, 10),
          activo: true,
        },
        { onConflict: 'auth_user_id' },
      );

    if (clienteError) throw clienteError;

    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendError(res, 500, error.message || 'Failed to sync cliente');
  }
}
