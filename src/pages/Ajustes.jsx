import React, { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAdminPageShellStyle, adminHeadingStyle } from '@/lib/adminPageShell';
import {
  useClientesQuery,
  useConfiguracionQuery,
  useCreateConfiguracionMutation,
  useUpdateClienteMutation,
  useUpdateConfiguracionMutation,
} from '@/hooks/useAppEntities';

const fmt = (n) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

/** Valores por defecto hasta que exista fila en BD o se hidrate el estado local (evita config === null en el primer render). */
const CONFIG_DEFAULT = {
  porcentaje_efectivo: 10,
  porcentaje_tarjeta: 5,
  umbral_compras: 15,
  nombre_negocio: 'Somos la Mickey',
};

function SeccionCard({ titulo, nota = '', children, compact = false }) {
  return (
    <div style={{
      background: '#161616', border: '1px solid #1F1F1F',
      borderRadius: 14, padding: compact ? '16px 18px' : '22px 24px', marginBottom: 18,
    }}>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 16, color: '#FFFFFF', marginBottom: 4 }}>
        {titulo}
      </div>
      {nota && (
        <div style={{ color: '#888888', fontSize: 12, marginBottom: 18, lineHeight: 1.5 }}>{nota}</div>
      )}
      {children}
    </div>
  );
}

function NumInput({ label, value, onChange, unit = '%' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', color: '#888888', fontSize: 12, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: 100, background: '#0a0a0a', border: '1px solid #2a2a2a',
            borderRadius: 8, padding: '9px 13px', color: '#FFFFFF',
            fontSize: 15, fontFamily: "'Nunito', sans-serif", fontWeight: 800,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <span style={{ color: '#888888', fontSize: 13 }}>{unit}</span>
      </div>
    </div>
  );
}

export default function Ajustes() {
  const isMobile = useIsMobile();
  const [config, setConfig] = useState(null);
  const [configId, setConfigId] = useState(null);
  const [saving, setSaving] = useState(null);
  const [editandoExcepcion, setEditandoExcepcion] = useState(null);
  const [nuevaExcepcion, setNuevaExcepcion] = useState(null);
  const clientesQuery = useClientesQuery();
  const configuracionQuery = useConfiguracionQuery();
  const createConfiguracionMutation = useCreateConfiguracionMutation();
  const updateConfiguracionMutation = useUpdateConfiguracionMutation();
  const updateClienteMutation = useUpdateClienteMutation();
  const clientes = clientesQuery.data || [];
  const loading = clientesQuery.isLoading || configuracionQuery.isLoading;
  const cfgRow = configuracionQuery.data?.[0];
  const mergedConfig = config ?? cfgRow ?? CONFIG_DEFAULT;

  useEffect(() => {
    const cfg = configuracionQuery.data?.[0];
    if (cfg) {
      setConfig({ ...cfg });
      setConfigId(cfg.id);
    }
  }, [configuracionQuery.data]);

  const load = async () => {
    await Promise.all([clientesQuery.refetch(), configuracionQuery.refetch()]);
  };

  useEffect(() => {
    if (loading || configId || createConfiguracionMutation.isPending) return;
    if ((configuracionQuery.data || []).length > 0) return;
    void createConfiguracionMutation.mutateAsync({
      porcentaje_efectivo: CONFIG_DEFAULT.porcentaje_efectivo,
      porcentaje_tarjeta: CONFIG_DEFAULT.porcentaje_tarjeta,
      umbral_compras: CONFIG_DEFAULT.umbral_compras,
      nombre_negocio: CONFIG_DEFAULT.nombre_negocio,
    }).then(() => {
      void load();
    });
  }, [loading, configId, configuracionQuery.data, createConfiguracionMutation]);

  const patchConfig = (partial) => {
    setConfig((prev) => {
      const base = { ...CONFIG_DEFAULT, ...(cfgRow || {}), ...(prev || {}) };
      return typeof partial === 'function' ? partial(base) : { ...base, ...partial };
    });
  };

  const handleSave = async (seccion) => {
    const id = configId ?? cfgRow?.id;
    if (!id) return;
    setSaving(seccion);
    await updateConfiguracionMutation.mutateAsync({ id, payload: mergedConfig });
    setSaving(null);
  };

  const handleGuardarExcepcion = async (cliente, pctEfectivo, pctTarjeta) => {
    await updateClienteMutation.mutateAsync({ id: cliente.id, payload: {
      porcentaje_efectivo_custom: pctEfectivo !== '' ? parseFloat(pctEfectivo) : null,
      porcentaje_tarjeta_custom: pctTarjeta !== '' ? parseFloat(pctTarjeta) : null,
    } });
    setEditandoExcepcion(null);
    setNuevaExcepcion(null);
    load();
  };

  const handleQuitarExcepcion = async (cliente) => {
    await updateClienteMutation.mutateAsync({ id: cliente.id, payload: {
      porcentaje_efectivo_custom: null,
      porcentaje_tarjeta_custom: null,
    } });
    load();
  };

  if (loading) return <div style={{ color: '#444444', textAlign: 'center', padding: 80 }}>Cargando...</div>;

  const canPersistConfig = Boolean(configId ?? cfgRow?.id);

  const clientesConCustom = clientes.filter(c => c.porcentaje_efectivo_custom != null || c.porcentaje_tarjeta_custom != null);
  const clientesSinCustom = clientes.filter(c => c.activo && c.porcentaje_efectivo_custom == null && c.porcentaje_tarjeta_custom == null);

  const inputStyle = {
    background: '#0a0a0a', border: '1px solid #2a2a2a',
    borderRadius: 8, padding: '9px 13px', color: '#FFFFFF',
    fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    outline: 'none', boxSizing: 'border-box', width: '100%',
  };

  return (
    <div style={{ ...getAdminPageShellStyle(isMobile), maxWidth: 780 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={adminHeadingStyle(isMobile)}>
          Ajustes
        </h1>
        <p style={{ color: '#888888', fontSize: 13, margin: '4px 0 0' }}>
          Configuración del programa de socios
        </p>
      </div>

      {/* Porcentajes globales */}
      <SeccionCard
        compact={isMobile}
        titulo="Porcentajes globales de reintegro"
        nota="Estos porcentajes se aplican a todos los socios salvo que tengan un porcentaje personalizado."
      >
        <NumInput
          label="Reintegro por pago en efectivo (%)"
          value={mergedConfig.porcentaje_efectivo ?? 10}
          onChange={v => patchConfig({ porcentaje_efectivo: parseFloat(v) || 0 })}
        />
        <NumInput
          label="Reintegro por tarjeta o transferencia (%)"
          value={mergedConfig.porcentaje_tarjeta ?? 5}
          onChange={v => patchConfig({ porcentaje_tarjeta: parseFloat(v) || 0 })}
        />
        <button
          onClick={() => handleSave('porcentajes')}
          disabled={!canPersistConfig || saving === 'porcentajes'}
          style={{
            background: '#E8001D', color: '#FFFFFF', border: 'none',
            borderRadius: 99, padding: '10px 20px', cursor: !canPersistConfig || saving === 'porcentajes' ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'Nunito', sans-serif",
            opacity: !canPersistConfig || saving === 'porcentajes' ? 0.6 : 1,
          }}
        >
          <Save size={13} /> {saving === 'porcentajes' ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </SeccionCard>

      {/* Umbral */}
      <SeccionCard
        compact={isMobile}
        titulo="Umbral de compras para habilitar retiro"
        nota="Los socios podrán pedir su reintegro a partir de esta cantidad de compras en el ciclo."
      >
        <NumInput
          label="Cantidad de compras necesarias"
          value={mergedConfig.umbral_compras ?? 15}
          onChange={v => patchConfig({ umbral_compras: parseInt(v, 10) || 0 })}
          unit="compras"
        />
        <button
          onClick={() => handleSave('umbral')}
          disabled={!canPersistConfig || saving === 'umbral'}
          style={{
            background: '#E8001D', color: '#FFFFFF', border: 'none',
            borderRadius: 99, padding: '10px 20px', cursor: !canPersistConfig || saving === 'umbral' ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'Nunito', sans-serif",
            opacity: !canPersistConfig || saving === 'umbral' ? 0.6 : 1,
          }}
        >
          <Save size={13} /> {saving === 'umbral' ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </SeccionCard>

      {/* Porcentajes personalizados */}
      <SeccionCard compact={isMobile} titulo="Porcentajes personalizados por socio">
        {clientesConCustom.length > 0 && (
          <div style={{ marginBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: isMobile ? 520 : undefined }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F1F1F' }}>
                  {['Socio', '% Efectivo', '% Tarjeta/Transfer.', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', color: '#555555', fontWeight: 500, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientesConCustom.map(cl => (
                  <tr key={cl.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {editandoExcepcion?.id === cl.id ? (
                      <ExcepcionEditRow
                        cliente={cl}
                        onSave={handleGuardarExcepcion}
                        onCancel={() => setEditandoExcepcion(null)}
                      />
                    ) : (
                      <>
                        <td style={{ padding: '11px 12px', fontWeight: 500, color: '#FFFFFF' }}>{cl.nombre}</td>
                        <td style={{ padding: '11px 12px' }}>
                          <span style={{ background: 'rgba(232,0,29,0.1)', color: '#E8001D', padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                            {cl.porcentaje_efectivo_custom != null ? `${cl.porcentaje_efectivo_custom}%` : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          <span style={{ background: 'rgba(249,209,0,0.1)', color: '#c8a000', padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                            {cl.porcentaje_tarjeta_custom != null ? `${cl.porcentaje_tarjeta_custom}%` : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setEditandoExcepcion(cl)} style={{
                              background: 'rgba(255,255,255,0.05)', border: '1px solid #2a2a2a',
                              borderRadius: 7, padding: '4px 8px', cursor: 'pointer', color: '#888888', fontSize: 11,
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                              <Edit2 size={10} /> Editar
                            </button>
                            <button onClick={() => handleQuitarExcepcion(cl)} style={{
                              background: 'rgba(232,0,29,0.06)', border: '1px solid rgba(232,0,29,0.15)',
                              borderRadius: 7, padding: '4px 8px', cursor: 'pointer', color: '#E8001D', fontSize: 11,
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                              <Trash2 size={10} /> Quitar
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {nuevaExcepcion ? (
          <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ color: '#888888', fontSize: 12, marginBottom: 10 }}>Agregar excepción</div>
            <NuevaExcepcionForm
              clientes={clientesSinCustom}
              onSave={handleGuardarExcepcion}
              onCancel={() => setNuevaExcepcion(null)}
            />
          </div>
        ) : (
          <button
            onClick={() => setNuevaExcepcion(true)}
            style={{
              background: 'transparent', color: '#E8001D',
              border: '2px solid #E8001D',
              borderRadius: 99, padding: '9px 16px', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            <Plus size={13} /> Agregar excepción
          </button>
        )}
      </SeccionCard>

      {/* Datos del negocio */}
      <SeccionCard compact={isMobile} titulo="Datos del negocio">
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', color: '#888888', fontSize: 12, marginBottom: 6 }}>Nombre del negocio</label>
          <input
            value={mergedConfig.nombre_negocio || ''}
            onChange={e => patchConfig({ nombre_negocio: e.target.value })}
            style={{ ...inputStyle, maxWidth: 320 }}
            placeholder="Somos la Mickey"
          />
        </div>
        <button
          onClick={() => handleSave('negocio')}
          disabled={!canPersistConfig || saving === 'negocio'}
          style={{
            background: '#E8001D', color: '#FFFFFF', border: 'none',
            borderRadius: 99, padding: '10px 20px', cursor: !canPersistConfig || saving === 'negocio' ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'Nunito', sans-serif",
            opacity: !canPersistConfig || saving === 'negocio' ? 0.6 : 1,
          }}
        >
          <Save size={13} /> {saving === 'negocio' ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </SeccionCard>
    </div>
  );
}

function ExcepcionEditRow({ cliente, onSave, onCancel }) {
  const [ef, setEf] = useState(cliente.porcentaje_efectivo_custom ?? '');
  const [ta, setTa] = useState(cliente.porcentaje_tarjeta_custom ?? '');
  const tdStyle = { padding: '11px 12px' };
  const inputS = {
    background: '#0a0a0a', border: '1px solid #2a2a2a',
    borderRadius: 6, padding: '6px 10px', color: '#FFFFFF',
    fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', width: 70,
  };
  return (
    <>
      <td style={tdStyle}>{cliente.nombre}</td>
      <td style={tdStyle}><input type="number" value={ef} onChange={e => setEf(e.target.value)} style={inputS} placeholder="10" /></td>
      <td style={tdStyle}><input type="number" value={ta} onChange={e => setTa(e.target.value)} style={inputS} placeholder="5" /></td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onSave(cliente, ef, ta)} style={{
            background: '#E8001D', border: 'none', borderRadius: 7, padding: '5px 8px',
            cursor: 'pointer', color: '#FFF', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11,
            fontWeight: 700,
          }}><Check size={10} /> OK</button>
          <button onClick={onCancel} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid #2a2a2a',
            borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: '#888888',
          }}><X size={10} /></button>
        </div>
      </td>
    </>
  );
}

function NuevaExcepcionForm({ clientes, onSave, onCancel }) {
  const [clienteSel, setClienteSel] = useState('');
  const [ef, setEf] = useState('');
  const [ta, setTa] = useState('');

  const sel = clientes.find(c => c.id === clienteSel);

  const inputS = {
    background: '#161616', border: '1px solid #2a2a2a',
    borderRadius: 8, padding: '8px 12px', color: '#FFFFFF',
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div>
        <div style={{ color: '#888888', fontSize: 11, marginBottom: 4 }}>Socio</div>
        <select value={clienteSel} onChange={e => setClienteSel(e.target.value)} style={{ ...inputS, minWidth: 180 }}>
          <option value="">Seleccionar socio...</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      <div>
        <div style={{ color: '#888888', fontSize: 11, marginBottom: 4 }}>% Efectivo</div>
        <input type="number" value={ef} onChange={e => setEf(e.target.value)} style={{ ...inputS, width: 80 }} placeholder="10" />
      </div>
      <div>
        <div style={{ color: '#888888', fontSize: 11, marginBottom: 4 }}>% Tarjeta</div>
        <input type="number" value={ta} onChange={e => setTa(e.target.value)} style={{ ...inputS, width: 80 }} placeholder="5" />
      </div>
      <div style={{ display: 'flex', gap: 7 }}>
        <button
          disabled={!sel}
          onClick={() => onSave(sel, ef, ta)}
          style={{
            background: sel ? '#E8001D' : '#2a2a2a', color: sel ? '#FFF' : '#555555',
            border: 'none', borderRadius: 99, padding: '9px 16px',
            cursor: sel ? 'pointer' : 'not-allowed',
            fontWeight: 700, fontSize: 13, fontFamily: "'Nunito', sans-serif",
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <Check size={13} /> Guardar
        </button>
        <button onClick={onCancel} style={{
          background: 'transparent', border: '1px solid #2a2a2a',
          borderRadius: 99, padding: '9px 14px', cursor: 'pointer',
          color: '#888888', fontSize: 13,
        }}>Cancelar</button>
      </div>
    </div>
  );
}