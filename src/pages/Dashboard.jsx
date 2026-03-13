import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Wallet, Users, Clock, TrendingUp, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import NuevaCompraModal from '@/components/admin/NuevaCompraModal';
import MetodoPagoBadge from '@/components/shared/MetodoPagoBadge';

const fmt = (n) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function StatCard({ icon: Icon, label, value, sub, accentColor, bgColor }) {
  return (
    <div style={{
      background: '#161616', border: '1px solid #1F1F1F',
      borderRadius: 14, padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: bgColor || 'rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={accentColor || '#888888'} />
        </div>
        <span style={{ color: '#888888', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      </div>
      <div style={{
        fontFamily: "'Nunito', sans-serif", fontWeight: 900,
        fontSize: 30, color: accentColor || '#FFFFFF',
        letterSpacing: '-0.02em', lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && <div style={{ color: '#444444', fontSize: 11, marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [clientes, setClientes] = useState([]);
  const [compras, setCompras] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [config, setConfig] = useState({ umbral_compras: 15 });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [c, co, ci, cfgs] = await Promise.all([
      base44.entities.Cliente.list(),
      base44.entities.Compra.list('-fecha', 50),
      base44.entities.Ciclo.list(),
      base44.entities.Configuracion.list(),
    ]);
    setClientes(c);
    setCompras(co);
    setCiclos(ci);
    if (cfgs && cfgs.length > 0) setConfig(cfgs[0]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const umbral = config.umbral_compras || 15;
  const ciclosActivos = ciclos.filter(c => !c.retirado);
  const ciclosPuedenRetirar = ciclosActivos.filter(c => c.puede_retirar);
  const totalAcumulado = ciclosActivos.reduce((s, c) => s + (c.acum_reintegro || 0), 0);
  const totalListos = ciclosPuedenRetirar.reduce((s, c) => s + (c.acum_reintegro || 0), 0);
  const clientesActivos = clientes.filter(c => c.activo);
  const proximos = ciclosActivos.filter(c => {
    const cnt = c.compras_count || 0;
    return cnt >= umbral - 3 && !c.puede_retirar;
  }).length;

  const reintegrosPendientes = ciclosPuedenRetirar.map(ci => {
    const cliente = clientes.find(c => c.id === ci.cliente_id);
    return { ciclo: ci, cliente };
  }).filter(x => x.cliente);

  const ultimasCompras = [...compras]
    .sort((a, b) => new Date(b.fecha || b.created_date) - new Date(a.fecha || a.created_date))
    .slice(0, 6);

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 26,
          color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em',
        }}>
          Dashboard
        </h1>
        <p style={{ color: '#888888', fontSize: 13, margin: '4px 0 0' }}>
          Somos la Mickey — Panel de socios
        </p>
      </div>

      {loading ? (
        <div style={{ color: '#444444', textAlign: 'center', padding: 60 }}>Cargando...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12, marginBottom: 28,
          }}>
            <StatCard
              icon={TrendingUp} label="Total acumulado en reintegros"
              value={fmt(totalAcumulado)} sub="Suma de todos los ciclos activos"
              accentColor="#F9D100" bgColor="rgba(249,209,0,0.1)"
            />
            <StatCard
              icon={Wallet} label="Listos para retirar"
              value={fmt(totalListos)} sub={`${ciclosPuedenRetirar.length} ciclos habilitados`}
              accentColor="#E8001D" bgColor="rgba(232,0,29,0.1)"
            />
            <StatCard
              icon={Clock} label="Próximos a retirar"
              value={proximos} sub={`Con ${umbral - 3} o más compras`}
              accentColor="#FFFFFF" bgColor="rgba(255,255,255,0.05)"
            />
            <StatCard
              icon={Users} label="Total socios"
              value={clientesActivos.length} sub="socios activos"
              accentColor="#FFFFFF" bgColor="rgba(255,255,255,0.05)"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Reintegros a pagar */}
            <div style={{
              background: '#161616', border: '1px solid #1F1F1F',
              borderRadius: 14, overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #1F1F1F',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14 }}>
                  Reintegros a pagar
                </span>
                <Link to={createPageUrl('Reintegros')} style={{ color: '#E8001D', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  Ver todos <ArrowRight size={11} />
                </Link>
              </div>
              <div>
                {reintegrosPendientes.length === 0 ? (
                  <div style={{ padding: '24px 20px', color: '#444444', fontSize: 13, textAlign: 'center' }}>
                    Ningún reintegro pendiente
                  </div>
                ) : (
                  reintegrosPendientes.slice(0, 5).map(({ ciclo, cliente }) => (
                    <div key={ciclo.id} style={{
                      padding: '13px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 8,
                          background: 'rgba(232,0,29,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "'Nunito', sans-serif", fontWeight: 800,
                          color: '#E8001D', fontSize: 14,
                        }}>
                          {cliente.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{cliente.nombre}</div>
                          <div style={{ fontSize: 11, color: '#555555', marginTop: 1 }}>
                            Ciclo #{ciclo.numero} · {ciclo.compras_count} compras
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontFamily: "'Nunito', sans-serif", fontWeight: 900,
                        color: '#F9D100', fontSize: 17,
                      }}>
                        {fmt(ciclo.acum_reintegro)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Últimas compras */}
            <div style={{
              background: '#161616', border: '1px solid #1F1F1F',
              borderRadius: 14, overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #1F1F1F',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14 }}>
                  Últimas compras
                </span>
                <Link to={createPageUrl('Compras')} style={{ color: '#E8001D', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  Ver todas <ArrowRight size={11} />
                </Link>
              </div>
              <div>
                {ultimasCompras.map((cp, i) => {
                  const cliente = clientes.find(c => c.id === cp.cliente_id);
                  return (
                    <div key={cp.id} style={{
                      padding: '11px 20px',
                      borderBottom: i < ultimasCompras.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShoppingBag size={13} style={{ color: '#444444', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{cliente?.nombre || 'Desconocido'}</div>
                          <div style={{ fontSize: 11, color: '#444444', marginTop: 1 }}>{fmtDate(cp.fecha)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MetodoPagoBadge metodo={cp.metodo_pago} />
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14, color: '#FFFFFF', minWidth: 70, textAlign: 'right' }}>
                          {fmt(cp.monto)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed', bottom: 28, right: 28,
          background: '#E8001D', color: '#FFFFFF',
          border: 'none', borderRadius: 99,
          padding: '13px 20px',
          cursor: 'pointer', boxShadow: '0 4px 24px rgba(232,0,29,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14,
          transition: 'transform 0.1s',
        }}
        title="Registrar compra"
      >
        <Plus size={17} /> Registrar compra
      </button>

      {showModal && (
        <NuevaCompraModal
          clientes={clientes.filter(c => c.activo)}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}