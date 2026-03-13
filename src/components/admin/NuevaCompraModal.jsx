import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Search, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const fmt = (n) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

const METODOS = [
  { value: 'efectivo',      label: 'Efectivo',      color: '#16a34a' },
  { value: 'tarjeta',       label: 'Tarjeta',       color: '#2563eb' },
  { value: 'transferencia', label: 'Transferencia', color: '#7c3aed' },
];

export default function NuevaCompraModal({ clientes, clientePreseleccionado, onClose, onSuccess }) {
  const [step, setStep] = useState(clientePreseleccionado ? 2 : 1);
  const [clienteSel, setClienteSel] = useState(clientePreseleccionado || null);
  const [search, setSearch] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [config, setConfig] = useState({ porcentaje_efectivo: 10, porcentaje_tarjeta: 5, umbral_compras: 15 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Configuracion.list().then(cfgs => {
      if (cfgs && cfgs.length > 0) setConfig(cfgs[0]);
    });
  }, []);

  const getPct = (cli, met) => {
    if (!cli || !met) return 0;
    if (met === 'efectivo') {
      return cli.porcentaje_efectivo_custom != null ? cli.porcentaje_efectivo_custom : (config.porcentaje_efectivo || 10);
    } else {
      return cli.porcentaje_tarjeta_custom != null ? cli.porcentaje_tarjeta_custom : (config.porcentaje_tarjeta || 5);
    }
  };

  const montoNum = parseFloat(monto) || 0;
  const pct = getPct(clienteSel, metodo);
  const reintegroPreview = Math.round(montoNum * pct / 100);
  const isCustomPct = clienteSel && metodo && (
    (metodo === 'efectivo' && clienteSel.porcentaje_efectivo_custom != null) ||
    (metodo !== 'efectivo' && clienteSel.porcentaje_tarjeta_custom != null)
  );

  const filteredClientes = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleGuardar = async () => {
    if (!clienteSel || !monto || !metodo) return;
    setSaving(true);

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

    const umbral = config.umbral_compras || 15;
    const reintCalc = Math.round(montoNum * pct / 100);

    await base44.entities.Compra.create({
      cliente_id: clienteSel.id,
      monto: montoNum,
      metodo_pago: metodo,
      reintegro_generado: reintCalc,
      porcentaje_aplicado: pct,
      fecha: fecha,
      ciclo_id: cicloActivo.id,
      ciclo_numero: cicloActivo.numero,
    });

    const newCount = (cicloActivo.compras_count || 0) + 1;
    const newAcum = (cicloActivo.acum_reintegro || 0) + reintCalc;
    await base44.entities.Ciclo.update(cicloActivo.id, {
      compras_count: newCount,
      acum_reintegro: newAcum,
      puede_retirar: newCount >= umbral,
    });

    setSaving(false);
    onSuccess();
  };

  const inputBase = {
    background: '#0a0a0a', border: '1px solid #2a2a2a',
    borderRadius: 8, color: '#FFFFFF', outline: 'none',
    fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', width: '100%',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#161616', border: '1px solid #1F1F1F',
          borderRadius: 20, width: '100%', maxWidth: 460,
          overflow: 'hidden', color: '#FFFFFF',
          fontFamily: "'DM Sans', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #1F1F1F',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 17 }}>
              Nueva compra
            </div>
            <div style={{ color: '#888888', fontSize: 12, marginTop: 2 }}>Paso {step} de 3</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Step bar */}
        <div style={{ padding: '14px 24px 0', display: 'flex', gap: 5 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              height: 3, flex: 1, borderRadius: 999,
              background: s <= step ? '#E8001D' : '#2a2a2a',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        {/* STEP 1 — Seleccionar cliente */}
        {step === 1 && (
          <div style={{ padding: '16px 24px 24px' }}>
            <p style={{ color: '#888888', fontSize: 13, margin: '0 0 14px' }}>Seleccioná el socio</p>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555555' }} />
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
                    background: '#1F1F1F',
                    border: '1px solid #2a2a2a',
                    color: '#FFFFFF', cursor: 'pointer', textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: 'rgba(232,0,29,0.12)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: '#E8001D', fontSize: 14,
                    fontFamily: "'Nunito', sans-serif",
                  }}>
                    {c.nombre?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: '#888888', marginTop: 1 }}>{c.email}</div>
                  </div>
                  <ChevronRight size={13} style={{ color: '#555555' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Datos de la compra */}
        {step === 2 && (
          <div style={{ padding: '16px 24px 24px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
              padding: '10px 13px',
              background: 'rgba(232,0,29,0.06)',
              border: '1px solid rgba(232,0,29,0.15)', borderRadius: 10,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                background: 'rgba(232,0,29,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: '#E8001D', fontSize: 13,
                fontFamily: "'Nunito', sans-serif",
              }}>
                {clienteSel?.nombre?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{clienteSel?.nombre}</span>
              {!clientePreseleccionado && (
                <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', color: '#888888', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                  Cambiar
                </button>
              )}
            </div>

            {/* Monto */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#888888', fontSize: 12, marginBottom: 7 }}>Monto de la compra</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: '#888888', fontSize: 18, fontFamily: "'Nunito', sans-serif",
                }}>$</span>
                <input
                  type="number" value={monto} onChange={e => setMonto(e.target.value)}
                  placeholder="0"
                  style={{
                    ...inputBase,
                    padding: '12px 14px 12px 30px',
                    fontSize: 22, fontFamily: "'Nunito', sans-serif", fontWeight: 800,
                  }}
                />
              </div>
            </div>

            {/* Método de pago */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#888888', fontSize: 12, marginBottom: 8 }}>Método de pago</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {METODOS.map(m => {
                  const thisPct = getPct(clienteSel, m.value);
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMetodo(m.value)}
                      style={{
                        flex: 1, padding: '10px 6px', borderRadius: 9, cursor: 'pointer',
                        border: metodo === m.value ? `1.5px solid ${m.color}` : '1px solid #2a2a2a',
                        background: metodo === m.value ? `${m.color}18` : 'transparent',
                        color: metodo === m.value ? m.color : '#888888',
                        fontFamily: "'DM Sans', sans-serif", transition: 'all 0.12s',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{m.label}</div>
                      <div style={{ fontSize: 11, marginTop: 2, opacity: 0.8 }}>{thisPct}%</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fecha */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#888888', fontSize: 12, marginBottom: 7 }}>Fecha de la compra</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                style={{
                  ...inputBase,
                  padding: '10px 13px',
                  fontSize: 14,
                  colorScheme: 'dark',
                }}
              />
            </div>

            {/* Preview reintegro */}
            {montoNum > 0 && metodo && (
              <div style={{
                padding: '14px 16px', borderRadius: 10, marginBottom: 16,
                background: 'rgba(249,209,0,0.05)',
                border: '1px solid rgba(249,209,0,0.2)',
              }}>
                <div style={{ color: '#888888', fontSize: 11, marginBottom: 3 }}>Reintegro a generar</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 30, fontWeight: 900, color: '#F9D100', letterSpacing: '-0.02em' }}>
                  {fmt(reintegroPreview)}
                </div>
                <div style={{ color: '#888888', fontSize: 11, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {pct}% de {fmt(montoNum)}
                  {isCustomPct && (
                    <span style={{
                      background: 'rgba(232,0,29,0.12)', color: '#E8001D',
                      fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
                    }}>PERSONALIZADO</span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              disabled={!monto || !metodo}
              style={{
                width: '100%', background: '#E8001D', color: '#FFFFFF',
                border: 'none', borderRadius: 99, padding: '12px',
                fontSize: 14, fontWeight: 700, cursor: !monto || !metodo ? 'not-allowed' : 'pointer',
                opacity: !monto || !metodo ? 0.35 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              Continuar <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* STEP 3 — Confirmación */}
        {step === 3 && (
          <div style={{ padding: '16px 24px 24px' }}>
            <p style={{ color: '#888888', fontSize: 13, margin: '0 0 18px' }}>Revisá el resumen antes de confirmar</p>
            <div style={{
              background: '#0a0a0a', border: '1px solid #1F1F1F',
              borderRadius: 12, overflow: 'hidden', marginBottom: 20,
            }}>
              {[
                { label: 'Socio', value: clienteSel?.nombre },
                { label: 'Monto', value: fmt(montoNum) },
                { label: 'Método', value: METODOS.find(m => m.value === metodo)?.label },
                { label: 'Fecha', value: fecha },
                { label: '% aplicado', value: `${pct}%${isCustomPct ? ' (personalizado)' : ''}` },
                { label: 'Reintegro generado', value: fmt(reintegroPreview), accent: true },
              ].map((row, i, arr) => (
                <div key={i} style={{
                  padding: '12px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid #1F1F1F' : 'none',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ color: '#888888', fontSize: 13 }}>{row.label}</span>
                  <span style={{
                    fontSize: 14, fontWeight: 600,
                    color: row.accent ? '#F9D100' : '#FFFFFF',
                    fontFamily: row.accent ? "'Nunito', sans-serif" : 'inherit',
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
                  border: '1px solid #2a2a2a',
                  borderRadius: 99, padding: '11px', color: '#888888',
                  cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <ChevronLeft size={14} /> Volver
              </button>
              <button
                onClick={handleGuardar}
                disabled={saving}
                style={{
                  flex: 2, background: '#E8001D', color: '#FFFFFF',
                  border: 'none', borderRadius: 99, padding: '11px',
                  fontSize: 14, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: "'Nunito', sans-serif",
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