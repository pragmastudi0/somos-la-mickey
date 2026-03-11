import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pause, Play, Tag } from 'lucide-react';

const BADGE_COLORS = {
  HOT:      { bg: 'rgba(239,68,68,0.12)',    color: '#ef4444' },
  NUEVO:    { bg: 'rgba(74,222,128,0.12)',   color: '#4ade80' },
  ESPECIAL: { bg: 'rgba(96,165,250,0.12)',   color: '#60a5fa' },
  LIMITADO: { bg: 'rgba(251,191,36,0.12)',   color: '#fbbf24' },
};

const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const BADGES = ['NUEVO', 'HOT', 'ESPECIAL', 'LIMITADO'];

function NuevaPromoModal({ onClose, onSuccess }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [badge, setBadge] = useState('NUEVO');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!titulo || !descripcion) return;
    setSaving(true);
    await base44.entities.Promocion.create({
      titulo, descripcion, badge,
      activa: true,
      fecha_inicio: new Date().toISOString().split('T')[0],
    });
    setSaving(false);
    onSuccess();
  };

  const inputStyle = {
    width: '100%', background: '#080810',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '10px 13px',
    color: '#f0f0f8', fontSize: 14, outline: 'none',
    fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18, width: '100%', maxWidth: 420,
          color: '#f0f0f8', fontFamily: "'DM Sans', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16 }}>
            Nueva promoción
          </span>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', color: '#8a8a9a', fontSize: 12, marginBottom: 6 }}>Título *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} style={inputStyle} placeholder="Ej: 2x1 en accesorios" />
          </div>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', color: '#8a8a9a', fontSize: 12, marginBottom: 6 }}>Descripción *</label>
            <textarea
              value={descripcion} onChange={e => setDescripcion(e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Describe la promo..."
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#8a8a9a', fontSize: 12, marginBottom: 8 }}>Badge</label>
            <div style={{ display: 'flex', gap: 7 }}>
              {BADGES.map(b => {
                const s = BADGE_COLORS[b];
                return (
                  <button
                    key={b}
                    onClick={() => setBadge(b)}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                      border: badge === b ? `1.5px solid ${s.color}` : '1px solid rgba(255,255,255,0.07)',
                      background: badge === b ? s.bg : 'transparent',
                      color: badge === b ? s.color : '#55556a',
                      fontSize: 11, fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            <button onClick={onClose} style={{
              flex: 1, background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 9, padding: '11px', color: '#8a8a9a',
              cursor: 'pointer', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
            }}>Cancelar</button>
            <button
              onClick={handleSave}
              disabled={!titulo || !descripcion || saving}
              style={{
                flex: 2, background: '#c8f04a', color: '#07070f',
                border: 'none', borderRadius: 9, padding: '11px',
                fontSize: 14, fontWeight: 600,
                cursor: !titulo || !descripcion || saving ? 'not-allowed' : 'pointer',
                opacity: !titulo || !descripcion || saving ? 0.4 : 1,
              }}
            >
              {saving ? 'Guardando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Promociones() {
  const [promos, setPromos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const p = await base44.entities.Promocion.list();
    setPromos(p.sort((a, b) => (b.activa ? 1 : 0) - (a.activa ? 1 : 0)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (promo) => {
    await base44.entities.Promocion.update(promo.id, { activa: !promo.activa });
    load();
  };

  const eliminar = async (id) => {
    await base44.entities.Promocion.delete(id);
    load();
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24,
            color: '#f0f0f8', margin: 0, letterSpacing: '-0.02em',
          }}>Promociones</h1>
          <p style={{ color: '#3a3a50', fontSize: 13, margin: '4px 0 0' }}>
            {promos.filter(p => p.activa).length} activas · {promos.filter(p => !p.activa).length} pausadas
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
          <Plus size={14} /> Nueva promoción
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#3a3a50', textAlign: 'center', padding: 60 }}>Cargando...</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}>
          {promos.map(promo => {
            const bStyle = BADGE_COLORS[promo.badge] || BADGE_COLORS.NUEVO;
            return (
              <div
                key={promo.id}
                style={{
                  background: '#0f0f1c',
                  border: `1px solid ${promo.activa ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: 14, padding: '18px',
                  opacity: promo.activa ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  {promo.badge && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 9px', borderRadius: 99,
                      background: bStyle.bg, color: bStyle.color,
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    }}>
                      <Tag size={9} /> {promo.badge}
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 5, marginLeft: 'auto' }}>
                    <button
                      onClick={() => toggle(promo)}
                      title={promo.activa ? 'Pausar' : 'Activar'}
                      style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: '#6a6a80',
                      }}
                    >
                      {promo.activa ? <Pause size={11} /> : <Play size={11} />}
                    </button>
                    <button
                      onClick={() => eliminar(promo.id)}
                      style={{
                        background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)',
                        borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: '#ef4444',
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.3 }}>
                  {promo.titulo}
                </div>
                <div style={{ color: '#6a6a80', fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>
                  {promo.descripcion}
                </div>
                <div style={{ color: '#3a3a50', fontSize: 10 }}>
                  Desde {fmtDate(promo.fecha_inicio)}
                </div>
              </div>
            );
          })}
          {promos.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#3a3a50', padding: 60 }}>
              No hay promociones todavía
            </div>
          )}
        </div>
      )}

      {showModal && (
        <NuevaPromoModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}