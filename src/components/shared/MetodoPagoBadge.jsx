import React from 'react';

const ESTILOS = {
  efectivo:      { label: 'Efectivo',       bg: 'rgba(74,222,128,0.1)',  color: '#4ade80' },
  tarjeta:       { label: 'Tarjeta',        bg: 'rgba(96,165,250,0.1)',  color: '#60a5fa' },
  transferencia: { label: 'Transferencia',  bg: 'rgba(167,139,250,0.1)', color: '#a78bfa' },
};

export default function MetodoPagoBadge({ metodo }) {
  const s = ESTILOS[metodo] || ESTILOS.efectivo;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 999,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}