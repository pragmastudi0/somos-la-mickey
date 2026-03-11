import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ShoppingBag, Wallet, Plus, Check
} from 'lucide-react';
import ProgressBar from '@/components/shared/ProgressBar';
import MetodoPagoBadge from '@/components/shared/MetodoPagoBadge';
import NuevaCompraModal from '@/components/admin/NuevaCompraModal';

const fmt = (n) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function ClienteDetalle() {
  const params = new URLSearchParams(window.location.search);
  const clienteId = params.get('id');

  const [cliente, setCliente] = useState(null);
  const [compras, setCompras] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [pagandoReintegro, setPagandoReintegro] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [clientes, allCompras, allCiclos] = await Promise.all([
      base44.entities.Cliente.list(),
      base44.entities.Compra.list(),
      base44.entities.Ciclo.list(),
    ]);
    const c = clientes.find(cl => cl.id === clienteId);
    const mis = allCompras.filter(cp => cp.cliente_id === clienteId);
    const misCiclos = allCiclos.filter(ci => ci.cliente_id === clienteId);
    setCliente(c);
    setCompras(mis.sort((a, b) => new Date(b.fecha || b.created_date) - new Date(a.fecha || a.created_date)));
    setCiclos(misCiclos.sort((a, b) => (b.numero || 0) - (a.numero || 0)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [clienteId]);

  const cicloActivo = ciclos.find(c => !c.retirado);
  const ciclosRetirados = ciclos.filter(c => c.retirado);

  const handlePagarReintegro = async () => {
    if (!cicloActivo) return;
    setPagandoReintegro(true);
    const today = new Date().toISOString().split('T')[0];
    await base44.entities.Ciclo.update(cicloActivo.id, {
      retirado: true,
      monto_retirado: cicloActivo.acum_reintegro,
      fecha_retiro: today,
    });
    await base44.entities.Ciclo.create({
      cliente_id: clienteId,
      numero: (cicloActivo.numero || 0) + 1,
      acum_reintegro: 0,
      compras_count: 0,
      puede_retirar: false,
      retirado: false,
    });
    setPagandoReintegro(false);
    load();
  };

  if (loading) {
    return <div style={{ color: '#3a3a50', textAlign: 'center', padding: 80 }}>Cargando...</div>;
  }
  if (!cliente) {
    return <div style={{ color: '#3a3a50', textAlign: 'center', padding: 80 }}>Cliente no encontrado</div>;
  }

  const totalCompras = compras.length;
  const totalGastado = compras.reduce((s, c) => s + (c.monto || 0), 0);
  const totalCobrado = ciclosRetirados.reduce((s, c) => s + (c.monto_retirado || 0), 0);
  const count = cicloActivo?.compras_count || 0;

  return (
    <div style={{ padding: '28px', maxWidth: 860, margin: '0 auto' }}>
      {/* Back */}
      <Link
        to={createPageUrl('Clientes')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          color: '#3a3a50', textDecoration: 'none', fontSize: 13,
          marginBottom: 20,
        }}
      >
        <ChevronLeft size={14} /> Volver a socios
      </Link>

      {/* Header */}
      <div style={{
        background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '22px 24px', marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 12, background: 'rgba(200,240,74,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#c8f04a',
          }}>
            {cliente.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em' }}>
              {cliente.nombre}
            </div>
            <div style={{ color: '#55556a', fontSize: 12, marginTop: 2 }}>
              {cliente.email} {cliente.telefono && `· ${cliente.telefono}`} · Alta {fmtDate(cliente.fecha_alta)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button
            onClick={() => setShowCompraModal(true)}
            style={{
              background: '#0f0f1c', color: '#f0f0f8',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '9px 14px', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Plus size={13} /> Nueva compra
          </button>
          {cicloActivo?.puede_retirar && (
            <button
              onClick={handlePagarReintegro}
              disabled={pagandoReintegro}
              style={{
                background: '#c8f04a', color: '#07070f',
                border: 'none', borderRadius: 8, padding: '9px 14px',
                cursor: pagandoReintegro ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                opacity: pagandoReintegro ? 0.6 : 1,
              }}
            >
              <Check size={13} /> {pagandoReintegro ? 'Procesando...' : `Pagar ${fmt(cicloActivo.acum_reintegro)}`}
            </button>
          )}
        </div>
      </div>

      {/* Métricas */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 10, marginBottom: 16,
      }}>
        {[
          { label: 'Reintegro acumulado', value: fmt(cicloActivo?.acum_reintegro || 0), accent: true },
          { label: 'Total compras', value: totalCompras },
          { label: 'Total gastado', value: fmt(totalGastado) },
          { label: 'Total reintegros cobrados', value: fmt(totalCobrado) },
        ].map((m, i) => (
          <div key={i} style={{
            background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ color: '#55556a', fontSize: 11, marginBottom: 6 }}>{m.label}</div>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: 22, color: m.accent ? '#c8f04a' : '#f0f0f8', letterSpacing: '-0.01em',
            }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Progreso */}
      <div style={{
        background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '16px 18px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#8a8a9a' }}>
            Ciclo #{cicloActivo?.numero || 1} — progreso
          </span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: count >= 15 ? '#c8f04a' : '#f0f0f8' }}>
            {count}/15
          </span>
        </div>
        <ProgressBar value={count} max={15} height={8} />
        {cicloActivo?.puede_retirar && (
          <div style={{ marginTop: 10, color: '#c8f04a', fontSize: 12, fontWeight: 500 }}>
            ✓ ¡Puede retirar el reintegro!
          </div>
        )}
      </div>

      {/* Historial compras */}
      <div style={{
        background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14 }}>
            <ShoppingBag size={13} style={{ verticalAlign: 'middle', marginRight: 7, color: '#3a3a50' }} />
            Historial de compras
          </span>
        </div>
        {compras.length === 0 ? (
          <div style={{ padding: '24px', color: '#3a3a50', fontSize: 13, textAlign: 'center' }}>Sin compras registradas</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Fecha', 'Monto', 'Método', 'Reintegro', 'Ciclo'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', color: '#3a3a50', fontWeight: 500, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compras.map((cp, i) => (
                  <tr key={cp.id} style={{ borderBottom: i < compras.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '11px 16px', color: '#8a8a9a' }}>{fmtDate(cp.fecha)}</td>
                    <td style={{ padding: '11px 16px', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{fmt(cp.monto)}</td>
                    <td style={{ padding: '11px 16px' }}><MetodoPagoBadge metodo={cp.metodo_pago} /></td>
                    <td style={{ padding: '11px 16px', color: '#c8f04a', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{fmt(cp.reintegro_generado)}</td>
                    <td style={{ padding: '11px 16px', color: '#55556a' }}>#{cp.ciclo_numero || 1}</td>
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
          background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14 }}>
              <Wallet size={13} style={{ verticalAlign: 'middle', marginRight: 7, color: '#3a3a50' }} />
              Reintegros cobrados
            </span>
          </div>
          {ciclosRetirados.map((ci, i) => (
            <div key={ci.id} style={{
              padding: '13px 18px', display: 'flex', justifyContent: 'space-between',
              borderBottom: i < ciclosRetirados.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Ciclo #{ci.numero}</div>
                <div style={{ fontSize: 11, color: '#3a3a50', marginTop: 1 }}>{fmtDate(ci.fecha_retiro)}</div>
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#4ade80', fontSize: 16 }}>
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