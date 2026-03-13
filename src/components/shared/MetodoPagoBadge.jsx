import React from 'react';

const ESTILOS = {
  efectivo:      { label: 'Efectivo',       bg: 'rgba(22,163,74,0.12)',  color: '#16a34a' },
  tarjeta:       { label: 'Tarjeta',        bg: 'rgba(37,99,235,0.12)',  color: '#2563eb' },
  transferencia: { label: 'Transferencia',  bg: 'rgba(124,58,237,0.12)', color: '#7c3aed' },
};

export default function MetodoPagoBadge({ metodo }) {
  const s = ESTILOS[metodo] || ESTILOS.efectivo;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 999,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600,
      whiteSpace: 'nowrap',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {s.label}
    </span>
  );
}