import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateClienteMutation } from '@/hooks/useAppEntities';

export default function NuevoClienteModal({ onClose, onSuccess }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const createClienteMutation = useCreateClienteMutation();
  const saving = createClienteMutation.isPending;
  const hoy = new Date().toISOString().split('T')[0];

  const handleGuardar = async () => {
    const nombreNormalizado = nombre.trim();
    const emailNormalizado = email.trim().toLowerCase();
    const telefonoNormalizado = telefono.trim();
    const fechaNacimientoNormalizada = fechaNacimiento.trim();
    if (!nombreNormalizado || !emailNormalizado) return;
    const payload = {
      nombre: nombreNormalizado,
      email: emailNormalizado,
      telefono: telefonoNormalizado || undefined,
      fecha_alta: new Date().toISOString().split('T')[0],
      activo: true,
    };
    if (fechaNacimientoNormalizada) payload.fecha_nacimiento = fechaNacimientoNormalizada;
    await createClienteMutation.mutateAsync(payload);
    onSuccess();
  };

  const inputStyle = {
    width: '100%', background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: 8, padding: '10px 13px',
    color: '#FFFFFF', fontSize: 14,
    outline: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        padding: 'max(16px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px))',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#161616', border: '1px solid #1F1F1F',
          borderRadius: 20, width: '100%', maxWidth: 400,
          maxHeight: 'min(90dvh, 900px)',
          overflow: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          color: '#FFFFFF',
          fontFamily: "'DM Sans', sans-serif",
          boxSizing: 'border-box',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #1F1F1F',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 17, color: '#FFFFFF' }}>
            Nuevo socio
          </span>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#888888', cursor: 'pointer',
              minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: -8,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
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
              <label style={{ display: 'block', color: '#888888', fontSize: 12, marginBottom: 6 }}>
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

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#888888', fontSize: 12, marginBottom: 6 }}>
              Fecha de nacimiento (opcional)
            </label>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={e => setFechaNacimiento(e.target.value)}
              max={hoy}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: 9, marginTop: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, background: 'transparent',
                border: '1px solid #2a2a2a',
                borderRadius: 99, padding: '11px', color: '#888888',
                cursor: 'pointer', fontSize: 14,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={!nombre.trim() || !email.trim() || saving}
              style={{
                flex: 2, background: '#E8001D', color: '#FFFFFF',
                border: 'none', borderRadius: 99, padding: '11px',
                fontSize: 14, fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                cursor: !nombre.trim() || !email.trim() || saving ? 'not-allowed' : 'pointer',
                opacity: !nombre.trim() || !email.trim() || saving ? 0.4 : 1,
              }}
            >
              {saving ? 'Guardando...' : 'Crear socio'}
            </button>
          </div>
          {createClienteMutation.error?.message && (
            <div style={{ marginTop: 10, color: '#E8001D', fontSize: 12 }}>
              {createClienteMutation.error.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}