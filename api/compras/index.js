import { allowMethods, sendError, sendJson } from '../_lib/http.js';
import { requireAdmin, requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { applySortAndLimit, getClienteByAuthUserId } from '../_lib/data.js';

async function getConfig() {
  const { data, error } = await supabaseAdmin.from('configuracion').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data || { porcentaje_efectivo: 10, porcentaje_tarjeta: 5, umbral_compras: 15 };
}

async function getOrCreateActiveCiclo(clienteId) {
  const { data: ciclos, error } = await supabaseAdmin
    .from('ciclos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('numero', { ascending: false });
  if (error) throw error;

  let activo = (ciclos || []).find((item) => !item.retirado);
  if (activo) return activo;

  const maxNumero = (ciclos || []).reduce((acc, item) => Math.max(acc, item.numero || 0), 0);
  const { data: created, error: createError } = await supabaseAdmin
    .from('ciclos')
    .insert({
      cliente_id: clienteId,
      numero: maxNumero + 1,
      acum_reintegro: 0,
      compras_count: 0,
      puede_retirar: false,
      retirado: false,
    })
    .select('*')
    .single();
  if (createError) throw createError;
  activo = created;
  return activo;
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  try {
    if (req.method === 'GET') {
      const auth = await requireAuth(req, res);
      if (!auth) return;

      let query = supabaseAdmin.from('compras').select('*');
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

    const payload = req.body || {};
    const config = await getConfig();
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('id', payload.cliente_id)
      .single();
    if (clienteError) throw clienteError;

    const metodo = payload.metodo_pago;
    const monto = Number(payload.monto || 0);
    const pct =
      metodo === 'efectivo'
        ? cliente.porcentaje_efectivo_custom ?? config.porcentaje_efectivo ?? 10
        : cliente.porcentaje_tarjeta_custom ?? config.porcentaje_tarjeta ?? 5;

    const reintegro = Math.round((monto * pct) / 100);
    const cicloActivo = await getOrCreateActiveCiclo(payload.cliente_id);

    const compraInput = {
      cliente_id: payload.cliente_id,
      monto,
      metodo_pago: metodo,
      reintegro_generado: reintegro,
      porcentaje_aplicado: pct,
      fecha: payload.fecha,
      ciclo_id: cicloActivo.id,
      ciclo_numero: cicloActivo.numero,
    };

    const { data: compra, error: compraError } = await supabaseAdmin
      .from('compras')
      .insert(compraInput)
      .select('*')
      .single();
    if (compraError) throw compraError;

    const newCount = (cicloActivo.compras_count || 0) + 1;
    const umbral = config.umbral_compras || 15;
    const { error: cicloError } = await supabaseAdmin
      .from('ciclos')
      .update({
        compras_count: newCount,
        acum_reintegro: (cicloActivo.acum_reintegro || 0) + reintegro,
        puede_retirar: newCount >= umbral,
      })
      .eq('id', cicloActivo.id);
    if (cicloError) throw cicloError;

    sendJson(res, 201, compra);
  } catch (error) {
    sendError(res, 500, error.message || 'Failed to handle compras');
  }
}
