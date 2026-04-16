import { allowMethods, sendError, sendJson } from '../_lib/http.js';
import { requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

function defaultNameFromEmail(email) {
  const local = (email || '').split('@')[0] || 'Cliente';
  return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function displayNameFromUser(user) {
  const raw = user?.user_metadata?.nombre;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).trim();
  }
  return defaultNameFromEmail(user?.email);
}

function fechaNacimientoFromUser(user) {
  const raw = user?.user_metadata?.fecha_nacimiento;
  if (raw == null || String(raw).trim() === '') return null;
  const s = String(raw).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const { user } = auth;

    // No escribir somoslamickey_profiles aquí: el rol lo define la DB (trigger + SQL admin).
    // Evita que un upsert parcial vuelva a aplicar default 'cliente' al rol.

    // Si existe un cliente previo con ese email, lo asociamos al auth_user_id actual.
    const { error: linkByEmailError } = await supabaseAdmin
      .from('somoslamickey_clientes')
      .update({
        auth_user_id: user.id,
        activo: true,
      })
      .eq('email', user.email)
      .or(`auth_user_id.is.null,auth_user_id.neq.${user.id}`);

    if (linkByEmailError) throw linkByEmailError;

    const clienteRow = {
      auth_user_id: user.id,
      email: user.email,
      nombre: displayNameFromUser(user),
      fecha_alta: new Date().toISOString().slice(0, 10),
      activo: true,
    };
    const fn = fechaNacimientoFromUser(user);
    if (fn) clienteRow.fecha_nacimiento = fn;

    const { error: clienteError } = await supabaseAdmin
      .from('somoslamickey_clientes')
      .upsert(clienteRow, { onConflict: 'auth_user_id' });

    if (clienteError) throw clienteError;

    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendError(res, 500, error.message || 'Failed to sync cliente');
  }
}
