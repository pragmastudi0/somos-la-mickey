import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, ShoppingBag, Wallet, Plus, Check } from 'lucide-react';
import ProgressBar from '@/components/shared/ProgressBar';
import MetodoPagoBadge from '@/components/shared/MetodoPagoBadge';
import NuevaCompraModal from '@/components/admin/NuevaCompraModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAdminPageShellStyle, adminPrimaryCtaStyle } from '@/lib/adminPageShell';

const fmt = (n) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function ClienteDetalle() {
  const isMobile = useIsMobile();
  const params = new URLSearchParams(window.location.search);
  const clienteId = params.get('id');

  const [cliente, setCliente] = useState(null);
  const [compras, setCompras] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [config, setConfig] = useState({ umbral_compras: 15 });
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [pagandoReintegro, setPagandoReintegro] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [clientes, allCompras, allCiclos, cfgs] = await Promise.all([
      api.entities.Cliente.list(),
      api.entities.Compra.list(),
      api.entities.Ciclo.list(),
      api.entities.Configuracion.list(),
    ]);
    const c = clientes.find(cl => cl.id === clienteId);
    const mis = allCompras.filter(cp => cp.cliente_id === clienteId);
    const misCiclos = allCiclos.filter(ci => ci.cliente_id === clienteId);
    setCliente(c);
    setCompras(mis.sort((a, b) => new Date(b.fecha || b.created_date) - new Date(a.fecha || a.created_date)));
    setCiclos(misCiclos.sort((a, b) => (b.numero || 0) - (a.numero || 0)));
    if (cfgs && cfgs.length > 0) setConfig(cfgs[0]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [clienteId]);

  const cicloActivo = ciclos.find(c => !c.retirado);
  const ciclosRetirados = ciclos.filter(c => c.retirado);
  const umbral = config.umbral_compras || 15;

  const handlePagarReintegro = async () => {
    if (!cicloActivo) return;
    setPagandoReintegro(true);
    const today = new Date().toISOString().split('T')[0];
    await api.entities.Ciclo.update(cicloActivo.id, {
      retirado: true, monto_retirado: cicloActivo.acum_reintegro, fecha_retiro: today,
    });
    await api.entities.Ciclo.create({
      cliente_id: clienteId, numero: (cicloActivo.numero || 0) + 1,
      acum_reintegro: 0, compras_count: 0, puede_retirar: false, retirado: false,
    });
    setPagandoReintegro(false);
    load();
  };

  if (loading) return <div style={{ color: '#888888', textAlign: 'center', padding: 80 }}>Cargando...</div>;
  if (!cliente) return <div style={{ color: '#888888', textAlign: 'center', padding: 80 }}>Cliente no encontrado</div>;

  const totalCompras = compras.length;
  const totalGastado = compras.reduce((s, c) => s + (c.monto || 0), 0);
  const totalCobrado = ciclosRetirados.reduce((s, c) => s + (c.monto_retirado || 0), 0);
  const count = cicloActivo?.compras_count || 0;

  const tieneCustom = cliente.porcentaje_efectivo_custom != null || cliente.porcentaje_tarjeta_custom != null;

  return (
    <div style={{ ...getAdminPageShellStyle(isMobile), maxWidth: 860 }}>
      <Link to={createPageUrl('Clientes')} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        color: '#888888', textDecoration: 'none', fontSize: 13, marginBottom: 20,
        minHeight: 44, WebkitTapHighlightColor: 'transparent',
      }}>
        <ChevronLeft size={14} /> Volver a socios
      </Link>

      {/* Header */}
      <div style={{
        background: '#161616', border: '1px solid #1F1F1F',
        borderRadius: 14, padding: isMobile ? '16px 18px' : '22px 24px', marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: '1 1 240px' }}>
          <div style={{
            width: 50, height: 50, borderRadius: 12,
            background: 'rgba(232,0,29,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 22, color: '#E8001D',
          }}>
            {cliente.nombre?.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: isMobile ? 18 : 22,
              letterSpacing: '-0.01em', color: '#FFFFFF', wordBreak: 'break-word',
            }}>
              {cliente.nombre}
            </div>
            <div style={{ color: '#888888', fontSize: 12, marginTop: 2, wordBreak: 'break-word', lineHeight: 1.4 }}>
              {cliente.email} {cliente.telefono && `· ${cliente.telefono}`}
              {cliente.fecha_nacimiento && ` · Nac. ${fmtDate(cliente.fecha_nacimiento)}`}
              {' '}· Alta {fmtDate(cliente.fecha_alta)}
            </div>
            {tieneCustom && (
              <div style={{ marginTop: 5, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cliente.porcentaje_efectivo_custom != null && (
                  <span style={{ background: 'rgba(232,0,29,0.12)', color: '#E8001D', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                    Efectivo {cliente.porcentaje_efectivo_custom}% personalizado
                  </span>
                )}
                {cliente.porcentaje_tarjeta_custom != null && (
                  <span style={{ background: 'rgba(249,209,0,0.12)', color: '#c8a000', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                    Tarjeta {cliente.porcentaje_tarjeta_custom}% personalizado
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{
          display: 'flex', gap: 9, flexWrap: 'wrap',
          flex: isMobile ? '1 1 100%' : '0 0 auto', justifyContent: isMobile ? 'stretch' : 'flex-end',
        }}>
          <button
            type="button"
            onClick={() => setShowCompraModal(true)}
            style={{
              background: 'transparent', color: '#FFFFFF',
              border: '2px solid #E8001D',
              borderRadius: 99, padding: '10px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: "'Nunito', sans-serif",
              minHeight: 44,
              ...adminPrimaryCtaStyle(isMobile),
            }}
          >
            <Plus size={13} /> Nueva compra
          </button>
          {cicloActivo?.puede_retirar && (
            <button
              type="button"
              onClick={handlePagarReintegro}
              disabled={pagandoReintegro}
              style={{
                background: '#E8001D', color: '#FFFFFF',
                border: 'none', borderRadius: 99, padding: '10px 16px',
                cursor: pagandoReintegro ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                opacity: pagandoReintegro ? 0.6 : 1,
                fontFamily: "'Nunito', sans-serif",
                minHeight: 44,
                ...adminPrimaryCtaStyle(isMobile),
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Check size={13} /> {pagandoReintegro ? 'Procesando...' : `Pagar ${fmt(cicloActivo.acum_reintegro)}`}
            </button>
          )}
        </div>
      </div>

      {/* Métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile
          ? 'repeat(auto-fit, minmax(140px, 1fr))'
          : 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 10, marginBottom: 16,
      }}>
        {[
          { label: 'Reintegro acumulado', value: fmt(cicloActivo?.acum_reintegro || 0), accent: '#F9D100' },
          { label: 'Total compras', value: totalCompras },
          { label: 'Total gastado', value: fmt(totalGastado) },
          { label: 'Total reintegros cobrados', value: fmt(totalCobrado) },
        ].map((m, i) => (
          <div key={i} style={{
            background: '#161616', border: '1px solid #1F1F1F',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ color: '#888888', fontSize: 11, marginBottom: 6 }}>{m.label}</div>
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 900,
              fontSize: 22, color: m.accent || '#FFFFFF', letterSpacing: '-0.01em',
            }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Progreso */}
      <div style={{
        background: '#161616', border: '1px solid #1F1F1F',
        borderRadius: 12, padding: '16px 18px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#888888' }}>
            Ciclo #{cicloActivo?.numero || 1} — progreso
          </span>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: count >= umbral ? '#F9D100' : '#FFFFFF' }}>
            {count}/{umbral}
          </span>
        </div>
        <ProgressBar value={count} max={umbral} height={8} />
        {cicloActivo?.puede_retirar && (
          <div style={{ marginTop: 10, color: '#E8001D', fontSize: 12, fontWeight: 600 }}>
            ✓ ¡Puede retirar el reintegro!
          </div>
        )}
      </div>

      {/* Historial compras */}
      <div style={{
        background: '#161616', border: '1px solid #1F1F1F',
        borderRadius: 14, overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1F1F1F' }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14, color: '#FFFFFF' }}>
            <ShoppingBag size={13} style={{ verticalAlign: 'middle', marginRight: 7, color: '#555555' }} />
            Historial de compras
          </span>
        </div>
        {compras.length === 0 ? (
          <div style={{ padding: '24px', color: '#888888', fontSize: 13, textAlign: 'center' }}>Sin compras registradas</div>
        ) : isMobile ? (
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {compras.map((cp) => (
              <div
                key={cp.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
                  padding: '12px 14px', fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <span style={{ color: '#888888' }}>{fmtDate(cp.fecha)}</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#FFFFFF' }}>{fmt(cp.monto)}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <MetodoPagoBadge metodo={cp.metodo_pago} />
                  <span style={{ color: '#888888', fontSize: 12 }}>
                    {cp.porcentaje_aplicado != null ? `${cp.porcentaje_aplicado}%` : '-'}
                  </span>
                  <span style={{ color: '#F9D100', fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>
                    {fmt(cp.reintegro_generado)}
                  </span>
                  <span style={{ color: '#555555', fontSize: 12 }}>Ciclo #{cp.ciclo_numero || 1}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F1F1F' }}>
                  {['Fecha', 'Monto', 'Método', '% Aplicado', 'Reintegro', 'Ciclo'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', color: '#555555', fontWeight: 500, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compras.map((cp, i) => (
                  <tr key={cp.id} style={{ borderBottom: i < compras.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '11px 16px', color: '#888888' }}>{fmtDate(cp.fecha)}</td>
                    <td style={{ padding: '11px 16px', fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#FFFFFF' }}>{fmt(cp.monto)}</td>
                    <td style={{ padding: '11px 16px' }}><MetodoPagoBadge metodo={cp.metodo_pago} /></td>
                    <td style={{ padding: '11px 16px', color: '#888888' }}>
                      {cp.porcentaje_aplicado != null ? `${cp.porcentaje_aplicado}%` : '-'}
                    </td>
                    <td style={{ padding: '11px 16px', color: '#F9D100', fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>{fmt(cp.reintegro_generado)}</td>
                    <td style={{ padding: '11px 16px', color: '#555555' }}>#{cp.ciclo_numero || 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reintegros cobrados */}
      {ciclosRetirados.length > 0 && (
        <div style={{
          background: '#161616', border: '1px solid #1F1F1F',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1F1F1F' }}>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14, color: '#FFFFFF' }}>
                <Wallet size={13} style={{ verticalAlign: 'middle', marginRight: 7, color: '#555555' }} />
                Reintegros cobrados
            </span>
          </div>
          {ciclosRetirados.map((ci, i) => (
            <div key={ci.id} style={{
              padding: '13px 18px', display: 'flex', justifyContent: 'space-between',
              borderBottom: i < ciclosRetirados.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>Ciclo #{ci.numero}</div>
                <div style={{ fontSize: 11, color: '#555555', marginTop: 1 }}>{fmtDate(ci.fecha_retiro)} · {ci.compras_count} compras</div>
              </div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: '#16a34a', fontSize: 16 }}>
                {fmt(ci.monto_retirado)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCompraModal && (
        <NuevaCompraModal
          clientes={[cliente]}
          clientePreseleccionado={cliente}
          onClose={() => setShowCompraModal(false)}
          onSuccess={() => { setShowCompraModal(false); load(); }}
        />
      )}
    </div>
  );
}