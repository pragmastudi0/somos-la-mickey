import { allowMethods, sendError, sendJson } from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['PATCH'])) return;

  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;

    const { data, error } = await supabaseAdmin
      .from('configuracion')
      .update(req.body || {})
      .eq('id', req.query.id)
      .select('*')
      .single();
    if (error) throw error;
    sendJson(res, 200, data);
  } catch (error) {
    sendError(res, 500, error.message || 'Failed to update configuracion');
  }
}
