import { supabaseAdmin } from './supabaseAdmin.js';

export function applySortAndLimit(query, sortRaw, limitRaw) {
  if (sortRaw) {
    const descending = sortRaw.startsWith('-');
    const column = descending ? sortRaw.slice(1) : sortRaw;
    query.order(column, { ascending: !descending });
  }

  const limit = Number(limitRaw);
  if (!Number.isNaN(limit) && limit > 0) {
    query.limit(limit);
  }

  return query;
}

export async function getClienteByAuthUserId(authUserId, applicationId) {
  const { data, error } = await supabaseAdmin
    .from('somoslamickey_clientes')
    .select('id')
    .eq('auth_user_id', authUserId)
    .eq('application_id', applicationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function assertScopedRecordExists(table, id, applicationId) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('id')
    .eq('id', id)
    .eq('application_id', applicationId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) {
    throw new Error('Record not found for this application');
  }
}
