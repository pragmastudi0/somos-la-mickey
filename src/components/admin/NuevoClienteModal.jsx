import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';

export default function NuevoClienteModal({ onClose, onSuccess }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [saving, setSaving] = useState(false);

  const handleGuardar = async () => {
    if (!nombre || !email) return;
    setSaving(true);
    await base44.entities.Cliente.create({
      nombre,
      email,
      telefono,
      fecha_alta: new Date().toISOString().split('T')[0],
      activo: true,
    });
    setSaving(false);
    onSuccess();
  };

  const inputStyle = {
    width: '100%', background: '#080810',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '10px 13px',
    color: '#f0f0f8', fontSize: 14,
    outline: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
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
          borderRadius: 18, width: '100%', maxWidth: 400,
          overflow: 'hidden', color: '#f0f0f8',
          fontFamily: "'DM Sans', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16 }}>
            Nuevo socio
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#55556a', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {[
            { label: 'Nombre completo *', value: nombre, setter: setNombre, placeholder: 'Ej: María González', type: 'text' },
            { label: 'Email *', value: email, setter: setEmail, placeholder: 'Ej: maria@gmail.com', type: 'email' },
            { label: 'Teléfono', value: telefono, setter: setTelefono, placeholder: 'Ej: 351-445-2211', type: 'text' },
          ].map((field, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#8a8a9a', fontSize: 12, marginBottom: 6 }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.setter(e.target.value)}
                placeholder={field.placeholder}
                style={inputStyle}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 9, marginTop: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 9, padding: '11px', color: '#8a8a9a',
                cursor: 'pointer', fontSize: 14,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={!nombre || !email || saving}
              style={{
                flex: 2, background: '#c8f04a', color: '#07070f',
                border: 'none', borderRadius: 9, padding: '11px',
                fontSize: 14, fontWeight: 600,
                cursor: !nombre || !email || saving ? 'not-allowed' : 'pointer',
                opacity: !nombre || !email || saving ? 0.4 : 1,
              }}
            >
              {saving ? 'Guardando...' : 'Crear socio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}