import React, { useMemo, useState } from 'react';
import { Check, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAdminPageShellStyle, adminHeadingStyle } from '@/lib/adminPageShell';
import { useCiclosQuery, useClientesQuery, useCreateCicloMutation, useUpdateCicloMutation } from '@/hooks/useAppEntities';

const fmt = (n) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function Reintegros() {
  const isMobile = useIsMobile();
  const [pagando, setPagando] = useState(null);
  const ciclosQuery = useCiclosQuery();
  const clientesQuery = useClientesQuery();
  const updateCicloMutation = useUpdateCicloMutation();
  const createCicloMutation = useCreateCicloMutation();
  const ciclos = useMemo(
    () => [...(ciclosQuery.data || [])].sort((a, b) => (b.numero || 0) - (a.numero || 0)),
    [ciclosQuery.data],
  );
  const clientes = clientesQuery.data || [];
  const loading = ciclosQuery.isLoading || clientesQuery.isLoading;
  const reload = async () => {
    await Promise.all([ciclosQuery.refetch(), clientesQuery.refetch()]);
  };

  const handlePagar = async (ciclo) => {
    setPagando(ciclo.id);
    const today = new Date().toISOString().split('T')[0];
    await updateCicloMutation.mutateAsync({ id: ciclo.id, payload: {
      retirado: true, monto_retirado: ciclo.acum_reintegro, fecha_retiro: today,
    } });
    await createCicloMutation.mutateAsync({
      cliente_id: ciclo.cliente_id, numero: (ciclo.numero || 0) + 1,
      acum_reintegro: 0, compras_count: 0, puede_retirar: false, retirado: false,
    });
    setPagando(null);
    await reload();
  };

  const pendientes = ciclos.filter(c => c.puede_retirar && !c.retirado);
  const pagados = ciclos.filter(c => c.retirado);
  const totalPendiente = pendientes.reduce((s, c) => s + (c.acum_reintegro || 0), 0);

  return (
    <div style={{ ...getAdminPageShellStyle(isMobile), maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={adminHeadingStyle(isMobile)}>
          Reintegros
        </h1>
        <p style={{ color: '#888888', fontSize: 13, margin: '4px 0 0' }}>Gestión de pagos a socios</p>
      </div>

      {/* Banner total */}
      {totalPendiente > 0 && (
        <div style={{
          background: 'rgba(232,0,29,0.06)',
          border: '1px solid rgba(232,0,29,0.2)',
          borderRadius: 14, padding: '20px 24px', marginBottom: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#E8001D', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
              TOTAL A PAGAR
            </div>
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 900,
              fontSize: isMobile ? 28 : 40, color: '#F9D100', letterSpacing: '-0.03em',
              wordBreak: 'break-word', lineHeight: 1.05,
            }}>
              {fmt(totalPendiente)}
            </div>
          </div>
          <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: isMobile ? 22 : 28, color: '#FFFFFF' }}>
              {pendientes.length}
            </div>
            <div style={{ color: '#888888', fontSize: 12 }}>socios pendientes</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#888888', textAlign: 'center', padding: 60 }}>Cargando...</div>
      ) : (
        <>
          {/* Pendientes */}
          {pendientes.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ color: '#888888', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10 }}>
                PENDIENTES DE PAGO
              </div>
              <div style={{ background: '#161616', border: '1px solid #1F1F1F', borderRadius: 14, overflow: 'hidden' }}>
                {pendientes.map((ciclo, i) => {
                  const cliente = clientes.find(c => c.id === ciclo.cliente_id);
                  return (
                    <div key={ciclo.id} style={{
                      padding: '16px 20px',
                      borderBottom: i < pendientes.length - 1 ? '1px solid #1F1F1F' : 'none',
                      display: 'flex', alignItems: 'center', gap: 14,
                      flexWrap: 'wrap',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: 'rgba(232,0,29,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: '#E8001D', fontSize: 16,
                      }}>
                        {cliente?.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#FFFFFF', wordBreak: 'break-word' }}>{cliente?.nombre}</div>
                        <div style={{ color: '#555555', fontSize: 11, marginTop: 2 }}>
                          Ciclo #{ciclo.numero} · {ciclo.compras_count} compras
                        </div>
                      </div>
                      <div style={{
                        fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 22, color: '#F9D100',
                        marginRight: 8, flexShrink: 0,
                      }}>
                        {fmt(ciclo.acum_reintegro)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePagar(ciclo)}
                        disabled={pagando === ciclo.id}
                        style={{
                          background: '#E8001D', color: '#FFFFFF',
                          border: 'none', borderRadius: 99,
                          padding: '10px 16px', cursor: pagando === ciclo.id ? 'not-allowed' : 'pointer',
                          fontSize: 13, fontWeight: 700,
                          opacity: pagando === ciclo.id ? 0.6 : 1,
                          display: 'flex', alignItems: 'center', gap: 5,
                          fontFamily: "'Nunito', sans-serif",
                          minHeight: 44,
                          flex: isMobile ? '1 1 100%' : '0 0 auto',
                          justifyContent: 'center',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <Check size={13} />
                        {pagando === ciclo.id ? 'Procesando...' : 'Marcar pagado'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {pendientes.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '36px', color: '#555555',
              background: '#161616', border: '1px solid #1F1F1F',
              borderRadius: 14, marginBottom: 28,
            }}>
              <Clock size={24} style={{ margin: '0 auto 10px', display: 'block', color: '#555555' }} />
              No hay reintegros pendientes
            </div>
          )}

          {/* Historial */}
          {pagados.length > 0 && (
            <div>
              <div style={{ color: '#888888', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10 }}>
                HISTORIAL DE PAGOS
              </div>
              <div style={{ background: '#161616', border: '1px solid #1F1F1F', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1F1F1F' }}>
                        {['Socio', 'Ciclo', 'Compras', 'Monto cobrado', 'Fecha cobro'].map(h => (
                          <th key={h} style={{ padding: '11px 16px', color: '#555555', fontWeight: 500, textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagados.map((ci, i) => {
                        const cliente = clientes.find(c => c.id === ci.cliente_id);
                        return (
                          <tr key={ci.id} style={{ borderBottom: i < pagados.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 500, color: '#FFFFFF' }}>{cliente?.nombre || '—'}</td>
                            <td style={{ padding: '12px 16px', color: '#888888' }}>#{ci.numero}</td>
                            <td style={{ padding: '12px 16px', color: '#888888' }}>{ci.compras_count}</td>
                            <td style={{ padding: '12px 16px', fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#16a34a' }}>{fmt(ci.monto_retirado)}</td>
                            <td style={{ padding: '12px 16px', color: '#888888' }}>{fmtDate(ci.fecha_retiro)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}