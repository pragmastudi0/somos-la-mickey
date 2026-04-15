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

export async function getClienteByAuthUserId(authUserId) {
  const { data, error } = await supabaseAdmin
    .from('clientes')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
