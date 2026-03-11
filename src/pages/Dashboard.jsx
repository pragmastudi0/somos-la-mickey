import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import {
  Wallet, Users, Clock, TrendingUp, Plus, ShoppingBag, ArrowRight
} from 'lucide-react';
import NuevaCompraModal from '@/components/admin/NuevaCompraModal';
import MetodoPagoBadge from '@/components/shared/MetodoPagoBadge';

const fmt = (n) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: accent ? 'rgba(200,240,74,0.1)' : 'rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={accent ? '#c8f04a' : '#6a6a80'} />
        </div>
        <span style={{ color: '#6a6a80', fontSize: 12 }}>{label}</span>
      </div>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 800,
        fontSize: 28, color: accent ? '#c8f04a' : '#f0f0f8',
        letterSpacing: '-0.02em', lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && <div style={{ color: '#3a3a50', fontSize: 11, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [clientes, setClientes] = useState([]);
  const [compras, setCompras] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [c, co, ci] = await Promise.all([
      base44.entities.Cliente.list(),
      base44.entities.Compra.list('-fecha', 50),
      base44.entities.Ciclo.list(),
    ]);
    setClientes(c);
    setCompras(co);
    setCiclos(ci);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const ciclosActivos = ciclos.filter(c => !c.retirado);
  const ciclosPuedenRetirar = ciclosActivos.filter(c => c.puede_retirar);
  const totalPendiente = ciclosPuedenRetirar.reduce((s, c) => s + (c.acum_reintegro || 0), 0);
  const clientesActivos = clientes.filter(c => c.activo);
  const proximos = ciclosActivos.filter(c => (c.compras_count || 0) >= 12 && !c.puede_retirar).length;

  const topCliente = (() => {
    const mapa = {};
    compras.forEach(cp => { mapa[cp.cliente_id] = (mapa[cp.cliente_id] || 0) + 1; });
    const topId = Object.entries(mapa).sort((a, b) => b[1] - a[1])[0]?.[0];
    return clientes.find(c => c.id === topId);
  })();

  const reintegrosPendientes = ciclosPuedenRetirar.map(ci => {
    const cliente = clientes.find(c => c.id === ci.cliente_id);
    return { ciclo: ci, cliente };
  }).filter(x => x.cliente);

  const ultimasCompras = [...compras]
    .sort((a, b) => new Date(b.fecha || b.created_date) - new Date(a.fecha || a.created_date))
    .slice(0, 6);

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24,
          color: '#f0f0f8', margin: 0, letterSpacing: '-0.02em',
        }}>
          Dashboard
        </h1>
        <p style={{ color: '#3a3a50', fontSize: 13, margin: '4px 0 0' }}>
          Somos la Mickey — Panel de socios
        </p>
      </div>

      {loading ? (
        <div style={{ color: '#3a3a50', textAlign: 'center', padding: 60 }}>Cargando...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12, marginBottom: 28,
          }}>
            <StatCard icon={Wallet} label="Reintegros pendientes" value={fmt(totalPendiente)} sub={`${ciclosPuedenRetirar.length} ciclos a pagar`} accent />
            <StatCard icon={TrendingUp} label="Cliente top" value={topCliente?.nombre?.split(' ')[0] || '-'} sub={topCliente?.nombre} />
            <StatCard icon={Clock} label="Próximos a retirar" value={proximos} sub="12-14 compras acum." />
            <StatCard icon={Users} label="Total socios" value={clientesActivos.length} sub="socios activos" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Reintegros a pagar */}
            <div style={{
              background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14 }}>
                  Reintegros a pagar
                </span>
                <Link to={createPageUrl('Reintegros')} style={{ color: '#c8f04a', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  Ver todos <ArrowRight size={11} />
                </Link>
              </div>
              <div>
                {reintegrosPendientes.length === 0 ? (
                  <div style={{ padding: '24px 20px', color: '#3a3a50', fontSize: 13, textAlign: 'center' }}>
                    Ningún reintegro pendiente
                  </div>
                ) : (
                  reintegrosPendientes.slice(0, 5).map(({ ciclo, cliente }) => (
                    <div key={ciclo.id} style={{
                      padding: '13px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{cliente.nombre}</div>
                        <div style={{ fontSize: 11, color: '#55556a', marginTop: 1 }}>Ciclo #{ciclo.numero} · {ciclo.compras_count} compras</div>
                      </div>
                      <div style={{
                        fontFamily: 'Syne, sans-serif', fontWeight: 700,
                        color: '#c8f04a', fontSize: 16,
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
              background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14 }}>
                  Últimas compras
                </span>
                <Link to={createPageUrl('Compras')} style={{ color: '#c8f04a', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
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
                        <ShoppingBag size={13} style={{ color: '#3a3a50', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{cliente?.nombre || 'Desconocido'}</div>
                          <div style={{ fontSize: 11, color: '#3a3a50', marginTop: 1 }}>{fmtDate(cp.fecha)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MetodoPagoBadge metodo={cp.metodo_pago} />
                        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#f0f0f8', minWidth: 70, textAlign: 'right' }}>
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
          background: '#c8f04a', color: '#07070f',
          border: 'none', borderRadius: 50,
          width: 52, height: 52,
          cursor: 'pointer', boxShadow: '0 4px 24px rgba(200,240,74,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.1s',
        }}
        title="Registrar compra"
      >
        <Plus size={22} />
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