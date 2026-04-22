import { allowMethods, sendError, sendJson } from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { assertScopedRecordExists } from '../_lib/data.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['PATCH'])) return;

  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { applicationId } = auth;
    await assertScopedRecordExists('somoslamickey_ciclos', req.query.id, applicationId);

    const { data, error } = await supabaseAdmin
      .from('somoslamickey_ciclos')
      .update(req.body || {})
      .eq('id', req.query.id)
      .eq('application_id', applicationId)
      .select('*')
      .single();

    if (error) throw error;
    sendJson(res, 200, data);
  } catch (error) {
    sendError(res, 500, error.message || 'Failed to update ciclo');
  }
}
