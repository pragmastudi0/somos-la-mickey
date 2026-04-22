import { allowMethods, sendError, sendJson } from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { assertScopedRecordExists } from '../_lib/data.js';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['PATCH', 'DELETE'])) return;

  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { applicationId } = auth;

    const id = req.query.id;

    if (req.method === 'PATCH') {
      await assertScopedRecordExists('somoslamickey_clientes', id, applicationId);
      const { data, error } = await supabaseAdmin
        .from('somoslamickey_clientes')
        .update(req.body || {})
        .eq('id', id)
        .eq('application_id', applicationId)
        .select('*')
        .single();

      if (error) throw error;
      return sendJson(res, 200, data);
    }

    await assertScopedRecordExists('somoslamickey_clientes', id, applicationId);
    const { error } = await supabaseAdmin
      .from('somoslamickey_clientes')
      .delete()
      .eq('id', id)
      .eq('application_id', applicationId);
    if (error) throw error;
    sendJson(res, 204, null);
  } catch (error) {
    sendError(res, 500, error.message || 'Failed to handle cliente');
  }
}
