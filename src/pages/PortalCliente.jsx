import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tag, LogOut, Sparkles } from 'lucide-react';
import ProgressBar from '@/components/shared/ProgressBar';
import MetodoPagoBadge from '@/components/shared/MetodoPagoBadge';

const fmt = (n) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
};

const BADGE_COLORS = {
  HOT:      { bg: 'rgba(239,68,68,0.12)',    color: '#ef4444' },
  NUEVO:    { bg: 'rgba(74,222,128,0.12)',   color: '#4ade80' },
  ESPECIAL: { bg: 'rgba(96,165,250,0.12)',   color: '#60a5fa' },
  LIMITADO: { bg: 'rgba(251,191,36,0.12)',   color: '#fbbf24' },
};

export default function PortalCliente() {
  const [user, setUser] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [compras, setCompras] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);

  useEffect(() => {
    const init = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const [clientes, allCompras, allCiclos, allPromos] = await Promise.all([
        base44.entities.Cliente.list(),
        base44.entities.Compra.list(),
        base44.entities.Ciclo.list(),
        base44.entities.Promocion.list(),
      ]);
      const cl = clientes.find(c => c.email === u.email);
      if (!cl) { setNoEncontrado(true); setLoading(false); return; }
      setCliente(cl);
      setCompras(allCompras.filter(c => c.cliente_id === cl.id).sort((a, b) => new Date(b.fecha || b.created_date) - new Date(a.fecha || a.created_date)));
      setCiclos(allCiclos.filter(c => c.cliente_id === cl.id).sort((a, b) => (b.numero || 0) - (a.numero || 0)));
      setPromos(allPromos.filter(p => p.activa));
      setLoading(false);
    };
    init().catch(() => { base44.auth.redirectToLogin(); });
  }, []);

  if (loading) {
    return (
      <div style={{
        background: '#07070f', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 28, height: 28, border: '3px solid rgba(200,240,74,0.15)',
          borderTop: '3px solid #c8f04a', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    );
  }

  if (noEncontrado) {
    return (
      <div style={{
        background: '#07070f', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif", color: '#f0f0f8', padding: 24, textAlign: 'center',
      }}>
        <Sparkles size={28} style={{ color: '#c8f04a', marginBottom: 12 }} />
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
          No encontramos tu cuenta
        </div>
        <div style={{ color: '#55556a', fontSize: 14, marginBottom: 20 }}>
          Tu email ({user?.email}) no está registrado como socio.
          <br />Consultá al local para que te den de alta.
        </div>
        <button onClick={() => base44.auth.logout()} style={{
          background: 'transparent', color: '#6a6a80',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '9px 18px', cursor: 'pointer',
          fontSize: 13, fontFamily: "'DM Sans', sans-serif",
        }}>
          Cerrar sesión
        </button>
      </div>
    );
  }

  const cicloActivo = ciclos.find(c => !c.retirado);
  const ciclosRetirados = ciclos.filter(c => c.retirado);
  const count = cicloActivo?.compras_count || 0;
  const acum = cicloActivo?.acum_reintegro || 0;
  const puedeRetirar = cicloActivo?.puede_retirar;
  const totalComprasHistoricas = compras.length;
  const ultimasCompras = compras.slice(0, 5);

  return (
    <div style={{
      background: '#07070f', minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif",
      color: '#f0f0f8',
      paddingBottom: 40,
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 0 8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} style={{ color: '#c8f04a' }} />
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: '#c8f04a' }}>
              La Mickey
            </span>
          </div>
          <button
            onClick={() => base44.auth.logout()}
            style={{
              background: 'none', border: 'none', color: '#3a3a50',
              cursor: 'pointer', padding: 4,
            }}
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Saludo */}
        <div style={{ paddingTop: 12, marginBottom: 20 }}>
          <div style={{ color: '#3a3a50', fontSize: 12, marginBottom: 3 }}>Bienvenida/o,</div>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            {cliente?.nombre?.split(' ')[0]} 👋
          </div>
        </div>

        {/* Hero card */}
        <div style={{
          background: puedeRetirar
            ? 'linear-gradient(135deg, rgba(200,240,74,0.12) 0%, rgba(200,240,74,0.04) 100%)'
            : '#0f0f1c',
          border: puedeRetirar
            ? '1px solid rgba(200,240,74,0.25)'
            : '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '24px 22px', marginBottom: 12,
        }}>
          <div style={{ color: '#55556a', fontSize: 11, letterSpacing: '0.04em', marginBottom: 8 }}>
            REINTEGRO ACUMULADO
          </div>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 52, letterSpacing: '-0.03em', lineHeight: 1,
            color: puedeRetirar ? '#c8f04a' : '#f0f0f8', marginBottom: 16,
          }}>
            {fmt(acum)}
          </div>
          {puedeRetirar ? (
            <div style={{
              background: 'rgba(200,240,74,0.1)', border: '1px solid rgba(200,240,74,0.2)',
              borderRadius: 10, padding: '12px 14px',
              color: '#c8f04a', fontSize: 13, fontWeight: 500,
            }}>
              🎉 ¡Podés pedirle el reintegro al dueño!
            </div>
          ) : (
            <div style={{ color: '#55556a', fontSize: 13 }}>
              Te faltan <strong style={{ color: '#f0f0f8' }}>{15 - count}</strong> compras para poder retirar
            </div>
          )}
        </div>

        {/* Progress */}
        <div style={{
          background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '16px 18px', marginBottom: 20,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 10,
          }}>
            <span style={{ fontSize: 12, color: '#8a8a9a' }}>Ciclo actual #{cicloActivo?.numero || 1}</span>
            <span style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: 14, color: count >= 15 ? '#c8f04a' : '#f0f0f8',
            }}>
              {count}/15
            </span>
          </div>
          <ProgressBar value={count} max={15} height={8} />
          <div style={{ color: '#3a3a50', fontSize: 11, marginTop: 8 }}>
            {totalComprasHistoricas} compras totales en tu historial
          </div>
        </div>

        {/* Últimas compras */}
        {ultimasCompras.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
              Mis compras recientes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {ultimasCompras.map(cp => (
                <div key={cp.id} style={{
                  background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 11, padding: '13px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>
                      {fmt(cp.monto)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                      <MetodoPagoBadge metodo={cp.metodo_pago} />
                      <span style={{ color: '#3a3a50', fontSize: 11 }}>{fmtDate(cp.fecha)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#3a3a50', fontSize: 10, marginBottom: 2 }}>reintegro</div>
                    <div style={{ color: '#c8f04a', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>
                      {fmt(cp.reintegro_generado)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reintegros cobrados */}
        {ciclosRetirados.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
              Reintegros cobrados
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ciclosRetirados.map(ci => (
                <div key={ci.id} style={{
                  background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 10, padding: '12px 14px',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Ciclo #{ci.numero}</div>
                    <div style={{ color: '#3a3a50', fontSize: 11, marginTop: 2 }}>
                      {fmtDate(ci.fecha_retiro)} · {ci.compras_count} compras
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#4ade80', fontSize: 16 }}>
                    {fmt(ci.monto_retirado)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promociones */}
        {promos.length > 0 && (
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
              Promociones activas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {promos.map(promo => {
                const bStyle = BADGE_COLORS[promo.badge] || BADGE_COLORS.NUEVO;
                return (
                  <div key={promo.id} style={{
                    background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: '14px 16px',
                  }}>
                    {promo.badge && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '2px 8px', borderRadius: 99,
                        background: bStyle.bg, color: bStyle.color,
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                        marginBottom: 7,
                      }}>
                        <Tag size={8} /> {promo.badge}
                      </span>
                    )}
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                      {promo.titulo}
                    </div>
                    <div style={{ color: '#6a6a80', fontSize: 12 }}>{promo.descripcion}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}