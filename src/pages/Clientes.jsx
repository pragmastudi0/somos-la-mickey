import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Search, Plus, ChevronRight } from 'lucide-react';
import ProgressBar from '@/components/shared/ProgressBar';
import NuevoClienteModal from '@/components/admin/NuevoClienteModal';

const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmt = (n) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [c, ci] = await Promise.all([
      base44.entities.Cliente.list(),
      base44.entities.Ciclo.list(),
    ]);
    setClientes(c);
    setCiclos(ci);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getCicloActivo = (clienteId) =>
    ciclos.filter(c => c.cliente_id === clienteId && !c.retirado)
      .sort((a, b) => (b.numero || 0) - (a.numero || 0))[0] || null;

  const filtered = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24,
            color: '#f0f0f8', margin: 0, letterSpacing: '-0.02em',
          }}>Socios</h1>
          <p style={{ color: '#3a3a50', fontSize: 13, margin: '4px 0 0' }}>
            {clientes.filter(c => c.activo).length} socios activos
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
          <Plus size={14} /> Nuevo socio
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#3a3a50' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          style={{
            width: '100%', background: '#0f0f1c',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 9, padding: '10px 14px 10px 38px',
            color: '#f0f0f8', fontSize: 13, outline: 'none',
            fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
          }}
        />
      </div>

      {loading ? (
        <div style={{ color: '#3a3a50', textAlign: 'center', padding: 60 }}>Cargando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(cliente => {
            const cicloActivo = getCicloActivo(cliente.id);
            const count = cicloActivo?.compras_count || 0;
            const acum = cicloActivo?.acum_reintegro || 0;
            const puedeRetirar = cicloActivo?.puede_retirar;
            const casiListo = !puedeRetirar && count >= 12;

            return (
              <Link
                key={cliente.id}
                to={createPageUrl(`ClienteDetalle?id=${cliente.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 18px', borderRadius: 12,
                  background: '#0f0f1c',
                  border: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none', color: '#f0f0f8',
                  transition: 'border-color 0.12s',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(200,240,74,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: '#c8f04a', fontSize: 16,
                  fontFamily: 'Syne, sans-serif',
                }}>
                  {cliente.nombre?.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{cliente.nombre}</span>
                    {puedeRetirar && (
                      <span style={{
                        background: 'rgba(200,240,74,0.12)', color: '#c8f04a',
                        fontSize: 10, fontWeight: 600, padding: '2px 8px',
                        borderRadius: 99, letterSpacing: '0.03em',
                      }}>PUEDE RETIRAR</span>
                    )}
                    {casiListo && (
                      <span style={{
                        background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
                        fontSize: 10, fontWeight: 600, padding: '2px 8px',
                        borderRadius: 99, letterSpacing: '0.03em',
                      }}>CASI LISTO</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#3a3a50', marginBottom: 7 }}>
                    {cliente.email} · Alta {fmtDate(cliente.fecha_alta)}
                  </div>
                  <ProgressBar value={count} max={15} height={5} />
                </div>

                {/* Right stats */}
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 14 }}>
                  <div style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 700,
                    fontSize: 16, color: '#c8f04a',
                  }}>
                    {fmt(acum)}
                  </div>
                  <div style={{ fontSize: 11, color: '#3a3a50', marginTop: 2 }}>
                    {count}/15 compras
                  </div>
                </div>

                <ChevronRight size={14} style={{ color: '#3a3a50', flexShrink: 0 }} />
              </Link>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ color: '#3a3a50', textAlign: 'center', padding: 60, fontSize: 14 }}>
              No se encontraron socios
            </div>
          )}
        </div>
      )}

      {showModal && (
        <NuevoClienteModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}