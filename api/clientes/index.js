import { allowMethods, sendError, sendJson } from '../_lib/http.js';
import { requireAdmin, requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { applySortAndLimit, getClienteByAuthUserId } from '../_lib/data.js';

const DEFAULT_TEMP_PASSWORD = '123456';
const APP_SLUG = process.env.APP_SLUG?.trim() || 'somos-la-mickey';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isAlreadyRegisteredAuthError(error) {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toLowerCase();
  return (
    code === 'user_already_exists'
    || message.includes('already registered')
    || message.includes('already exists')
    || message.includes('user already')
  );
}

async function findAuthUserByEmail(email) {
  const perPage = 200;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const match = users.find((user) => normalizeEmail(user.email) === email);
    if (match) return match;
    if (users.length < perPage) break;
  }
  return null;
}

async function resolveAuthUserForCliente({ email, applicationId, nombre, telefono, fechaNacimiento }) {
  const userMetadata = {
    nombre,
    slug_app: APP_SLUG,
    application_id: applicationId,
  };
  if (telefono) userMetadata.telefono = telefono;
  if (fechaNacimiento) userMetadata.fecha_nacimiento = fechaNacimiento;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEFAULT_TEMP_PASSWORD,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (!error && data?.user) return data.user;
  if (error && isAlreadyRegisteredAuthError(error)) {
    const existing = await findAuthUserByEmail(email);
    if (existing) return existing;
    throw createHttpError(409, 'El email ya existe en Auth, pero no se pudo recuperar el usuario.');
  }
  throw error || createHttpError(500, 'No se pudo crear el usuario en Auth.');
}

async function upsertClienteForApplication({
  authUserId,
  email,
  nombre,
  telefono,
  fechaNacimiento,
  applicationId,
}) {
  const patch = {
    auth_user_id: authUserId,
    email,
    nombre,
    activo: true,
    application_id: applicationId,
  };
  if (telefono) patch.telefono = telefono;
  if (fechaNacimiento) patch.fecha_nacimiento = fechaNacimiento;

  const { data: byAuth, error: byAuthError } = await supabaseAdmin
    .from('somoslamickey_clientes')
    .update(patch)
    .eq('auth_user_id', authUserId)
    .eq('application_id', applicationId)
    .select('*')
    .maybeSingle();
  if (byAuthError) throw byAuthError;
  if (byAuth) return { cliente: byAuth, created: false };

  const { data: byEmail, error: byEmailError } = await supabaseAdmin
    .from('somoslamickey_clientes')
    .update(patch)
    .eq('email', email)
    .eq('application_id', applicationId)
    .select('*')
    .maybeSingle();
  if (byEmailError) throw byEmailError;
  if (byEmail) return { cliente: byEmail, created: false };

  const insertPayload = {
    ...patch,
    fecha_alta: new Date().toISOString().slice(0, 10),
  };
  const { data: createdCliente, error: insertError } = await supabaseAdmin
    .from('somoslamickey_clientes')
    .insert(insertPayload)
    .select('*')
    .single();
  if (insertError) throw insertError;
  return { cliente: createdCliente, created: true };
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  try {
    if (req.method === 'GET') {
      const auth = await requireAuth(req, res);
      if (!auth) return;
      const { applicationId } = auth;

      let query = supabaseAdmin
        .from('somoslamickey_clientes')
        .select('*')
        .eq('application_id', applicationId);
      if (auth.role !== 'admin') {
        const cliente = await getClienteByAuthUserId(auth.user.id, applicationId);
        if (!cliente?.id) return sendJson(res, 200, []);
        query = query.eq('id', cliente.id);
      }
      applySortAndLimit(query, req.query.sort, req.query.limit);
      const { data, error } = await query;
      if (error) throw error;
      return sendJson(res, 200, data || []);
    }

    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { applicationId } = auth;

    const nombre = String(req.body?.nombre || '').trim();
    const email = normalizeEmail(req.body?.email);
    if (!nombre) throw createHttpError(400, 'El nombre es obligatorio.');
    if (!email) throw createHttpError(400, 'El email es obligatorio.');

    const telefono = String(req.body?.telefono || '').trim() || null;
    const fechaNacimiento = String(req.body?.fecha_nacimiento || '').trim() || null;

    const authUser = await resolveAuthUserForCliente({
      email,
      applicationId,
      nombre,
      telefono,
      fechaNacimiento,
    });

    const { cliente, created } = await upsertClienteForApplication({
      authUserId: authUser.id,
      email,
      nombre,
      telefono,
      fechaNacimiento,
      applicationId,
    });

    sendJson(res, created ? 201 : 200, cliente);
  } catch (error) {
    sendError(res, error.status || 500, error.message || 'Failed to handle clientes');
  }
}
