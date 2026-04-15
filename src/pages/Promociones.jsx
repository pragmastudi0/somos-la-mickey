import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Plus, Trash2, Pause, Play, Tag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAdminPageShellStyle, adminHeadingStyle, adminHeaderRowStyle, adminPrimaryCtaStyle } from '@/lib/adminPageShell';

const BADGE_COLORS = {
  HOT:      { bg: 'rgba(232,0,29,0.12)',    color: '#E8001D' },
  NUEVO:    { bg: 'rgba(22,163,74,0.12)',   color: '#16a34a' },
  ESPECIAL: { bg: 'rgba(37,99,235,0.12)',   color: '#2563eb' },
  LIMITADO: { bg: 'rgba(249,209,0,0.12)',   color: '#c8a000' },
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
    await api.entities.Promocion.create({
      titulo, descripcion, badge,
      activa: true,
      fecha_inicio: new Date().toISOString().split('T')[0],
    });
    setSaving(false);
    onSuccess();
  };

  const inputStyle = {
    width: '100%', background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: 8, padding: '10px 13px',
    color: '#FFFFFF', fontSize: 14, outline: 'none',
    fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      padding: 'max(16px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px))',
      boxSizing: 'border-box',
    }} onClick={onClose}>
      <div style={{
        background: '#161616', border: '1px solid #1F1F1F',
        borderRadius: 20, width: '100%', maxWidth: 420,
        maxHeight: 'min(90dvh, 900px)',
        overflow: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        color: '#FFFFFF', fontFamily: "'DM Sans', sans-serif",
        boxSizing: 'border-box',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1F1F1F' }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 17, color: '#FFFFFF' }}>
            Nueva promoción
          </span>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', color: '#888888', fontSize: 12, marginBottom: 6 }}>Título *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} style={inputStyle} placeholder="Ej: 2x1 en accesorios" />
          </div>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', color: '#888888', fontSize: 12, marginBottom: 6 }}>Descripción *</label>
            <textarea
              value={descripcion} onChange={e => setDescripcion(e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Describe la promo..."
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#888888', fontSize: 12, marginBottom: 8 }}>Badge</label>
            <div style={{ display: 'flex', gap: 7 }}>
              {BADGES.map(b => {
                const s = BADGE_COLORS[b];
                return (
                  <button key={b} onClick={() => setBadge(b)} style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                    border: badge === b ? `1.5px solid ${s.color}` : '1px solid #2a2a2a',
                    background: badge === b ? s.bg : 'transparent',
                    color: badge === b ? s.color : '#555555',
                    fontSize: 11, fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {b}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            <button onClick={onClose} style={{
              flex: 1, background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: 99, padding: '11px', color: '#888888',
              cursor: 'pointer', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
            }}>Cancelar</button>
            <button
              onClick={handleSave}
              disabled={!titulo || !descripcion || saving}
              style={{
                flex: 2, background: '#E8001D', color: '#FFFFFF',
                border: 'none', borderRadius: 99, padding: '11px',
                fontSize: 14, fontWeight: 700,
                cursor: !titulo || !descripcion || saving ? 'not-allowed' : 'pointer',
                opacity: !titulo || !descripcion || saving ? 0.4 : 1,
                fontFamily: "'Nunito', sans-serif",
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
  const isMobile = useIsMobile();
  const [promos, setPromos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const p = await api.entities.Promocion.list();
    setPromos(p.sort((a, b) => (b.activa ? 1 : 0) - (a.activa ? 1 : 0)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (promo) => {
    await api.entities.Promocion.update(promo.id, { activa: !promo.activa });
    load();
  };

  const eliminar = async (id) => {
    await api.entities.Promocion.delete(id);
    load();
  };

  const activas = promos.filter(p => p.activa);
  const pausadas = promos.filter(p => !p.activa);

  const promoGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
    gap: 12,
  };

  return (
    <div style={{ ...getAdminPageShellStyle(isMobile), maxWidth: 900 }}>
      <div style={adminHeaderRowStyle(isMobile)}>
        <div>
          <h1 style={adminHeadingStyle(isMobile)}>
            Promociones
          </h1>
          <p style={{ color: '#888888', fontSize: 13, margin: '4px 0 0' }}>
            {activas.length} activas · {pausadas.length} pausadas
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            background: '#E8001D', color: '#FFFFFF', border: 'none',
            borderRadius: 99, padding: '10px 18px', cursor: 'pointer',
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'Nunito', sans-serif",
            ...adminPrimaryCtaStyle(isMobile),
          }}
        >
          <Plus size={14} /> Nueva promoción
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#888888', textAlign: 'center', padding: 60 }}>Cargando...</div>
      ) : (
        <>
          {activas.length > 0 && (
            <>
              <div style={{ color: '#888888', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 12 }}>ACTIVAS</div>
              <div style={{ ...promoGridStyle, marginBottom: 28 }}>
                {activas.map(promo => {
                  const bStyle = BADGE_COLORS[promo.badge] || BADGE_COLORS.NUEVO;
                  return (
                    <div key={promo.id} style={{
                      background: '#161616', border: '1px solid #1F1F1F',
                      borderRadius: 14, padding: '18px',
                    }}>
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
                        <button onClick={() => toggle(promo)} title="Pausar" style={{
                          background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a',
                          borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: '#888888',
                          marginLeft: 'auto',
                        }}>
                          <Pause size={11} />
                        </button>
                      </div>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 6, lineHeight: 1.3, color: '#FFFFFF' }}>
                        {promo.titulo}
                      </div>
                      <div style={{ color: '#888888', fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>
                        {promo.descripcion}
                      </div>
                      <div style={{ color: '#888888', fontSize: 10 }}>Desde {fmtDate(promo.fecha_inicio)}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {pausadas.length > 0 && (
            <>
              <div style={{ color: '#888888', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 12 }}>PAUSADAS</div>
              <div style={promoGridStyle}>
                {pausadas.map(promo => {
                  const bStyle = BADGE_COLORS[promo.badge] || BADGE_COLORS.NUEVO;
                  return (
                    <div key={promo.id} style={{
                      background: '#161616', border: '1px solid #1F1F1F',
                      borderRadius: 14, padding: '18px', opacity: 0.5,
                    }}>
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
                          <button onClick={() => toggle(promo)} title="Activar" style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a',
                            borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: '#888888',
                          }}>
                            <Play size={11} />
                          </button>
                          <button onClick={() => eliminar(promo.id)} style={{
                            background: 'rgba(232,0,29,0.05)', border: '1px solid rgba(232,0,29,0.15)',
                            borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: '#E8001D',
                          }}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 6, color: '#FFFFFF' }}>
                        {promo.titulo}
                      </div>
                      <div style={{ color: '#888888', fontSize: 12, lineHeight: 1.5 }}>{promo.descripcion}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {promos.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888888', padding: 60 }}>No hay promociones todavía</div>
          )}
        </>
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