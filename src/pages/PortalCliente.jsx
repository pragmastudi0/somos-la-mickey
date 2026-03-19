import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tag, LogOut, Gift } from 'lucide-react';
import ProgressBar from '@/components/shared/ProgressBar';
import MetodoPagoBadge from '@/components/shared/MetodoPagoBadge';

const fmt = (n) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
};

const BADGE_COLORS = {
  HOT: { bg: 'rgba(232,0,29,0.1)', color: '#E8001D' },
  NUEVO: { bg: 'rgba(22,163,74,0.1)', color: '#16a34a' },
  ESPECIAL: { bg: 'rgba(37,99,235,0.1)', color: '#2563eb' },
  LIMITADO: { bg: 'rgba(249,209,0,0.1)', color: '#c8a000' }
};

export default function PortalCliente() {
  const [user, setUser] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [compras, setCompras] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [promos, setPromos] = useState([]);
  const [config, setConfig] = useState({ umbral_compras: 15 });
  const [loading, setLoading] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);

  useEffect(() => {
    const init = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const [clientes, allCompras, allCiclos, allPromos, cfgs] = await Promise.all([
      base44.entities.Cliente.list(),
      base44.entities.Compra.list(),
      base44.entities.Ciclo.list(),
      base44.entities.Promocion.list(),
      base44.entities.Configuracion.list()]
      );
      const cl = clientes.find((c) => c.email === u.email);
      if (!cl) {setNoEncontrado(true);setLoading(false);return;}
      setCliente(cl);
      setCompras(allCompras.filter((c) => c.cliente_id === cl.id).sort((a, b) => new Date(b.fecha || b.created_date) - new Date(a.fecha || a.created_date)));
      setCiclos(allCiclos.filter((c) => c.cliente_id === cl.id).sort((a, b) => (b.numero || 0) - (a.numero || 0)));
      setPromos(allPromos.filter((p) => p.activa));
      if (cfgs && cfgs.length > 0) setConfig(cfgs[0]);
      setLoading(false);
    };
    init().catch(() => {base44.auth.redirectToLogin();});
  }, []);

  if (loading) {
    return (
      <div style={{
        background: '#FFD94D', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          width: 28, height: 28, border: '3px solid rgba(232,0,29,0.15)',
          borderTop: '3px solid #E8001D', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
      </div>);

  }

  if (noEncontrado) {
    return (
      <div style={{
        background: '#FFFFFF', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A', padding: 24, textAlign: 'center'
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 22, marginBottom: 8, color: '#1A1A1A' }}>
          No encontramos tu cuenta
        </div>
        <div style={{ color: '#6B7280', fontSize: 14, marginBottom: 20, maxWidth: 320 }}>
          Tu email ({user?.email}) no está registrado como socio.
          <br />Consultá con el negocio para que te den de alta.
        </div>
        <button onClick={() => base44.auth.logout()} style={{
          background: 'transparent', color: '#888888',
          border: '1px solid #E0E0E0',
          borderRadius: 99, padding: '9px 18px', cursor: 'pointer',
          fontSize: 13, fontFamily: "'DM Sans', sans-serif"
        }}>
          Cerrar sesión
        </button>
      </div>);

  }

  const cicloActivo = ciclos.find((c) => !c.retirado);
  const ciclosRetirados = ciclos.filter((c) => c.retirado);
  const count = cicloActivo?.compras_count || 0;
  const acum = cicloActivo?.acum_reintegro || 0;
  const puedeRetirar = cicloActivo?.puede_retirar;
  const umbral = config.umbral_compras || 15;
  const totalComprasHistoricas = compras.length;
  const ultimasCompras = compras.slice(0, 5);

  return (
    <div style={{
      background: '#F9FAFB', minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif",
      color: '#1A1A1A',
      paddingBottom: 40
    }} className="bg-yellow-100">
      {/* Header sticky */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#FFFFFF',
        borderBottom: '1px solid #F0F0F0',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: 480, margin: '0 auto', padding: '14px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900, fontSize: 16, color: '#E8001D',
              letterSpacing: '-0.01em', lineHeight: 1
            }}>
              Somos la Mickey
            </div>
            <div style={{ color: '#6B7280', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              App Socios
            </div>
          </div>
          <button
            onClick={() => base44.auth.logout()}
            style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4 }}>
            
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        {/* Saludo */}
        <div style={{ paddingTop: 24, marginBottom: 18 }}>
          <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 2 }}>Bienvenida/o,</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#1A1A1A' }}>
            {cliente?.nombre?.split(' ')[0]} 👋
          </div>
        </div>

        {/* Hero card — reintegro */}
        <div style={{
          background: '#E8001D',
          borderRadius: 20, padding: '24px 22px', marginBottom: 12,
          boxShadow: '0 8px 32px rgba(232,0,29,0.2)'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Reintegro acumulado
          </div>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 900,
            fontSize: 56, letterSpacing: '-0.04em', lineHeight: 1,
            color: '#F9D100', marginBottom: 16
          }}>
            {fmt(acum)}
          </div>
          {puedeRetirar ?
          <div style={{
            background: 'rgba(249,209,0,0.15)', border: '1px solid rgba(249,209,0,0.3)',
            borderRadius: 12, padding: '12px 14px',
            color: '#F9D100', fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: "'Nunito', sans-serif"
          }}>
              🎉 ¡Podés pedirle el reintegro al dueño!
            </div> :

          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              Te faltan <strong style={{ color: '#FFFFFF', fontFamily: "'Nunito', sans-serif" }}>{umbral - count}</strong> compras para poder retirar
            </div>
          }
        </div>

        {/* Barra de progreso */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #F0F0F0',
          borderRadius: 16, padding: '18px 18px', marginBottom: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Ciclo actual #{cicloActivo?.numero || 1}</span>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 15, color: count >= umbral ? '#E8001D' : '#1A1A1A' }}>
              {count}/{umbral}
            </span>
          </div>
          <ProgressBar value={count} max={umbral} height={10} light />
          <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 10 }}>
            {totalComprasHistoricas} compras totales en tu historial
          </div>
        </div>

        {/* Últimas compras */}
        {ultimasCompras.length > 0 &&
        <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 10, color: '#1A1A1A' }}>
              Mis compras recientes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ultimasCompras.map((cp) =>
            <div key={cp.id} style={{
              background: '#FFFFFF', border: '1px solid #F0F0F0',
              borderRadius: 12, padding: '13px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 17, color: '#1A1A1A' }}>
                      {fmt(cp.monto)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
                      <MetodoPagoBadge metodo={cp.metodo_pago} />
                      <span style={{ color: '#9CA3AF', fontSize: 11 }}>{fmtDate(cp.fecha)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 2 }}>reintegro</div>
                    <div style={{ color: '#E8001D', fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 15 }}>
                      {fmt(cp.reintegro_generado)}
                    </div>
                  </div>
                </div>
            )}
            </div>
          </div>
        }

        {/* Reintegros cobrados */}
        {ciclosRetirados.length > 0 &&
        <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 10, color: '#1A1A1A' }}>
              Reintegros cobrados
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {ciclosRetirados.map((ci) =>
            <div key={ci.id} style={{
              background: '#FFFFFF', border: '1px solid #F0F0F0',
              borderRadius: 12, padding: '13px 14px',
              display: 'flex', justifyContent: 'space-between'
            }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>Ciclo #{ci.numero}</div>
                    <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>
                      {fmtDate(ci.fecha_retiro)} · {ci.compras_count} compras
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: '#16a34a', fontSize: 17 }}>
                    {fmt(ci.monto_retirado)}
                  </div>
                </div>
            )}
            </div>
          </div>
        }

        {/* Promociones */}
        {promos.length > 0 &&
        <div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 10, color: '#1A1A1A' }}>
              Promociones activas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {promos.map((promo) => {
              const bStyle = BADGE_COLORS[promo.badge] || BADGE_COLORS.NUEVO;
              return (
                <div key={promo.id} style={{
                  background: '#FFFFFF', border: '1px solid #F0F0F0',
                  borderRadius: 14, padding: '15px 16px'
                }}>
                    {promo.badge &&
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 9px', borderRadius: 99,
                    background: bStyle.bg, color: bStyle.color,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    marginBottom: 8
                  }}>
                        <Tag size={8} /> {promo.badge}
                      </span>
                  }
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 4, color: '#1A1A1A' }}>
                      {promo.titulo}
                    </div>
                    <div style={{ color: '#6B7280', fontSize: 13 }}>{promo.descripcion}</div>
                  </div>);

            })}
            </div>
          </div>
        }
      </div>
    </div>);

}