import { allowMethods, sendError, sendJson } from '../_lib/http.js';
import { requireAdmin, requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { applySortAndLimit } from '../_lib/data.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  try {
    if (req.method === 'GET') {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const { applicationId } = auth;

      let query = supabaseAdmin
        .from('somoslamickey_promociones')
        .select('*')
        .eq('application_id', applicationId);
      if (auth.role !== 'admin') {
        query = query.eq('activa', true);
      }
      applySortAndLimit(query, req.query.sort, req.query.limit);
      const { data, error } = await query;
      if (error) throw error;
      return sendJson(res, 200, data || []);
    }

    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { applicationId } = auth;
    const payload = { ...(req.body || {}), application_id: applicationId };
    const { data, error } = await supabaseAdmin
      .from('somoslamickey_promociones')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    sendJson(res, 201, data);
  } catch (error) {
    sendError(res, 500, error.message || 'Failed to handle promociones');
  }
}
