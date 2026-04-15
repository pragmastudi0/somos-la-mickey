import { allowMethods, sendError, sendJson } from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['PATCH', 'DELETE'])) return;

  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const id = req.query.id;

    if (req.method === 'PATCH') {
      const { data, error } = await supabaseAdmin
        .from('promociones')
        .update(req.body || {})
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return sendJson(res, 200, data);
    }

    const { error } = await supabaseAdmin.from('promociones').delete().eq('id', id);
    if (error) throw error;
    sendJson(res, 204, null);
  } catch (error) {
    sendError(res, 500, error.message || 'Failed to handle promocion');
  }
}
