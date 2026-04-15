import { allowMethods, sendError, sendJson } from '../_lib/http.js';
import { requireAdmin, requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { applySortAndLimit, getClienteByAuthUserId } from '../_lib/data.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  try {
    if (req.method === 'GET') {
      const auth = await requireAuth(req, res);
      if (!auth) return;

      let query = supabaseAdmin.from('somoslamickey_ciclos').select('*');
      if (auth.role !== 'admin') {
        const cliente = await getClienteByAuthUserId(auth.user.id);
        if (!cliente?.id) return sendJson(res, 200, []);
        query = query.eq('cliente_id', cliente.id);
      }
      applySortAndLimit(query, req.query.sort, req.query.limit);
      const { data, error } = await query;
      if (error) throw error;
      return sendJson(res, 200, data || []);
    }

    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { data, error } = await supabaseAdmin.from('somoslamickey_ciclos').insert(req.body || {}).select('*').single();
    if (error) throw error;
    sendJson(res, 201, data);
  } catch (error) {
    sendError(res, 500, error.message || 'Failed to handle ciclos');
  }
}
