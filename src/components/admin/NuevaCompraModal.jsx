import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Search, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const calcularReintegro = (monto, metodo) => {
  if (!monto || !metodo) return 0;
  return monto * (metodo === 'efectivo' ? 0.10 : 0.05);
};

const fmt = (n) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

const METODOS = [
  { value: 'efectivo',      label: 'Efectivo',       pct: '10%', color: '#4ade80' },
  { value: 'tarjeta',       label: 'Tarjeta',        pct: '5%',  color: '#60a5fa' },
  { value: 'transferencia', label: 'Transferencia',  pct: '5%',  color: '#a78bfa' },
];

export default function NuevaCompraModal({ clientes, clientePreseleccionado, onClose, onSuccess }) {
  const [step, setStep] = useState(clientePreseleccionado ? 2 : 1);
  const [clienteSel, setClienteSel] = useState(clientePreseleccionado || null);
  const [search, setSearch] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('');
  const [saving, setSaving] = useState(false);

  const montoNum = parseFloat(monto) || 0;
  const reintegroPreview = calcularReintegro(montoNum, metodo);

  const filteredClientes = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleGuardar = async () => {
    if (!clienteSel || !monto || !metodo) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const reintCalc = calcularReintegro(montoNum, metodo);

    const allCiclos = await base44.entities.Ciclo.list();
    const ciclosCliente = allCiclos.filter(c => c.cliente_id === clienteSel.id);
    let cicloActivo = ciclosCliente.find(c => !c.retirado);

    if (!cicloActivo) {
      const maxNum = ciclosCliente.reduce((m, c) => Math.max(m, c.numero || 0), 0);
      cicloActivo = await base44.entities.Ciclo.create({
        cliente_id: clienteSel.id,
        numero: maxNum + 1,
        acum_reintegro: 0,
        compras_count: 0,
        puede_retirar: false,
        retirado: false,
      });
    }

    await base44.entities.Compra.create({
      cliente_id: clienteSel.id,
      monto: montoNum,
      metodo_pago: metodo,
      reintegro_generado: reintCalc,
      fecha: today,
      ciclo_id: cicloActivo.id,
      ciclo_numero: cicloActivo.numero,
    });

    const newCount = (cicloActivo.compras_count || 0) + 1;
    const newAcum = (cicloActivo.acum_reintegro || 0) + reintCalc;
    await base44.entities.Ciclo.update(cicloActivo.id, {
      compras_count: newCount,
      acum_reintegro: newAcum,
      puede_retirar: newCount >= 15,
    });

    setSaving(false);
    onSuccess();
  };

  const inputBase = {
    background: '#080810', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, color: '#f0f0f8', outline: 'none',
    fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', width: '100%',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0f0f1c', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18, width: '100%', maxWidth: 460,
          overflow: 'hidden', color: '#f0f0f8',
          fontFamily: "'DM Sans', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16 }}>
              Nueva compra
            </div>
            <div style={{ color: '#55556a', fontSize: 12, marginTop: 2 }}>Paso {step} de 3</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#55556a', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Step bar */}
        <div style={{ padding: '14px 24px 0', display: 'flex', gap: 5 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              height: 3, flex: 1, borderRadius: 999,
              background: s <= step ? '#c8f04a' : 'rgba(255,255,255,0.08)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ padding: '16px 24px 24px' }}>
            <p style={{ color: '#8a8a9a', fontSize: 13, margin: '0 0 14px' }}>Seleccioná el socio</p>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#55556a' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                style={{ ...inputBase, padding: '9px 12px 9px 34px', fontSize: 13 }}
              />
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {filteredClientes.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setClienteSel(c); setStep(2); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '11px 13px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#f0f0f8', cursor: 'pointer', textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: 'rgba(200,240,74,0.1)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: '#c8f04a', fontSize: 14,
                  }}>
                    {c.nombre?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: '#55556a', marginTop: 1 }}>{c.email}</div>
                  </div>
                  <ChevronRight size={13} style={{ color: '#55556a' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ padding: '16px 24px 24px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
              padding: '10px 13px',
              background: 'rgba(200,240,74,0.05)',
              border: '1px solid rgba(200,240,74,0.12)', borderRadius: 10,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                background: 'rgba(200,240,74,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: '#c8f04a', fontSize: 13,
              }}>
                {clienteSel?.nombre?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{clienteSel?.nombre}</span>
              {!clientePreseleccionado && (
                <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', color: '#55556a', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                  Cambiar
                </button>
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', color: '#8a8a9a', fontSize: 12, marginBottom: 7 }}>Monto de la compra</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: '#8a8a9a', fontSize: 16, fontFamily: 'Syne, sans-serif',
                }}>$</span>
                <input
                  type="number" value={monto} onChange={e => setMonto(e.target.value)}
                  placeholder="0"
                  style={{
                    ...inputBase,
                    padding: '12px 14px 12px 28px',
                    fontSize: 22, fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', color: '#8a8a9a', fontSize: 12, marginBottom: 8 }}>Método de pago</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {METODOS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMetodo(m.value)}
                    style={{
                      flex: 1, padding: '10px 6px', borderRadius: 9, cursor: 'pointer',
                      border: metodo === m.value ? `1.5px solid ${m.color}` : '1px solid rgba(255,255,255,0.08)',
                      background: metodo === m.value ? `${m.color}12` : 'transparent',
                      color: metodo === m.value ? m.color : '#6a6a80',
                      fontFamily: "'DM Sans', sans-serif", transition: 'all 0.12s',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: 11, marginTop: 2, opacity: 0.75 }}>{m.pct}</div>
                  </button>
                ))}
              </div>
            </div>

            {montoNum > 0 && metodo && (
              <div style={{
                padding: '14px 16px', borderRadius: 10, marginBottom: 18,
                background: 'rgba(200,240,74,0.05)',
                border: '1px solid rgba(200,240,74,0.14)',
              }}>
                <div style={{ color: '#8a8a9a', fontSize: 11, marginBottom: 3 }}>Reintegro a generar</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800, color: '#c8f04a', letterSpacing: '-0.02em' }}>
                  {fmt(reintegroPreview)}
                </div>
                <div style={{ color: '#55556a', fontSize: 11, marginTop: 2 }}>
                  {metodo === 'efectivo' ? '10%' : '5%'} de {fmt(montoNum)}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              disabled={!monto || !metodo}
              style={{
                width: '100%', background: '#c8f04a', color: '#07070f',
                border: 'none', borderRadius: 9, padding: '12px',
                fontSize: 14, fontWeight: 600, cursor: !monto || !metodo ? 'not-allowed' : 'pointer',
                opacity: !monto || !metodo ? 0.35 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              Continuar <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ padding: '16px 24px 24px' }}>
            <p style={{ color: '#8a8a9a', fontSize: 13, margin: '0 0 18px' }}>Revisá el resumen antes de confirmar</p>
            <div style={{
              background: '#080810', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, overflow: 'hidden', marginBottom: 20,
            }}>
              {[
                { label: 'Socio', value: clienteSel?.nombre },
                { label: 'Monto', value: fmt(montoNum) },
                { label: 'Método', value: METODOS.find(m => m.value === metodo)?.label },
                { label: 'Reintegro generado', value: fmt(reintegroPreview), accent: true },
              ].map((row, i) => (
                <div key={i} style={{
                  padding: '13px 16px',
                  borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ color: '#8a8a9a', fontSize: 13 }}>{row.label}</span>
                  <span style={{
                    fontSize: 14, fontWeight: 600,
                    color: row.accent ? '#c8f04a' : '#f0f0f8',
                    fontFamily: row.accent ? 'Syne, sans-serif' : 'inherit',
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1, background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 9, padding: '11px', color: '#8a8a9a',
                  cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}
              >
                <ChevronLeft size={14} /> Volver
              </button>
              <button
                onClick={handleGuardar}
                disabled={saving}
                style={{
                  flex: 2, background: '#c8f04a', color: '#07070f',
                  border: 'none', borderRadius: 9, padding: '11px',
                  fontSize: 14, fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {saving ? 'Guardando...' : <><Check size={15} /> Confirmar compra</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}