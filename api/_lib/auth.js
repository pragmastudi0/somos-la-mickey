import { supabaseAdmin } from './supabaseAdmin.js';
import { sendError } from './http.js';
import { requireApplicationId } from './application.js';

async function getUserByToken(token) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

async function getRole(userId, applicationId) {
  const { data, error } = await supabaseAdmin
    .from('somoslamickey_profiles')
    .select('role')
    .eq('id', userId)
    .eq('application_id', applicationId)
    .maybeSingle();

  if (error) throw error;
  return data?.role || 'cliente';
}

export async function requireAuth(req, res) {
  const applicationId = requireApplicationId(req, res);
  if (!applicationId) return null;

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    sendError(res, 401, 'Missing bearer token');
    return null;
  }

  const token = header.slice('Bearer '.length);
  const user = await getUserByToken(token);
  if (!user) {
    sendError(res, 401, 'Invalid token');
    return null;
  }

  const role = await getRole(user.id, applicationId);
  return { user, role, applicationId };
}

export async function requireAdmin(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return null;
  if (auth.role !== 'admin') {
    sendError(res, 403, 'Admin role required');
    return null;
  }
  return auth;
}
