import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import MetodoPagoBadge from '@/components/shared/MetodoPagoBadge';
import NuevaCompraModal from '@/components/admin/NuevaCompraModal';

const fmt = (n) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const METODOS = ['todos', 'efectivo', 'tarjeta', 'transferencia'];

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [co, cl] = await Promise.all([
      base44.entities.Compra.list(),
      base44.entities.Cliente.list(),
    ]);
    setCompras(co.sort((a, b) => new Date(b.fecha || b.created_date) - new Date(a.fecha || a.created_date)));
    setClientes(cl);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filtro === 'todos' ? compras : compras.filter(c => c.metodo_pago === filtro);

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24,
            color: '#f0f0f8', margin: 0, letterSpacing: '-0.02em',
          }}>Compras</h1>
          <p style={{ color: '#3a3a50', fontSize: 13, margin: '4px 0 0' }}>
            {compras.length} compras registradas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: '#c8f04a', color: '#07070f', border: 'none',
            borderRadius: 9, padding: '10px 16px', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={14} /> Nueva compra
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
        {METODOS.map(m => (
          <button
            key={m}
            onClick={() => setFiltro(m)}
            style={{
              padding: '7px 14px', borderRadius: 8,
              border: filtro === m ? '1px solid rgba(200,240,74,0.3)' : '1px solid rgba(255,255,255,0.06)',
              background: filtro === m ? 'rgba(200,240,74,0.08)' : '#0f0f1c',
              color: filtro === m ? '#c8f04a' : '#6a6a80',
              cursor: 'pointer', fontSize: 12, fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#3a3a50', textAlign: 'center', padding: 60 }}>Cargando...</div>
      ) : (
        <div style={{
          background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Fecha', 'Socio', 'Monto', 'Método', 'Reintegro generado', 'Ciclo'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', color: '#3a3a50',
                      fontWeight: 500, textAlign: 'left',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((cp, i) => {
                  const cliente = clientes.find(c => c.id === cp.cliente_id);
                  return (
                    <tr key={cp.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '13px 16px', color: '#8a8a9a' }}>{fmtDate(cp.fecha)}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 500 }}>{cliente?.nombre || '—'}</td>
                      <td style={{ padding: '13px 16px', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{fmt(cp.monto)}</td>
                      <td style={{ padding: '13px 16px' }}><MetodoPagoBadge metodo={cp.metodo_pago} /></td>
                      <td style={{ padding: '13px 16px', color: '#c8f04a', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{fmt(cp.reintegro_generado)}</td>
                      <td style={{ padding: '13px 16px', color: '#55556a' }}>#{cp.ciclo_numero || 1}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#3a3a50' }}>
                      No hay compras para este filtro
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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