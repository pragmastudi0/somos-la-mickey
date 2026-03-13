import React from 'react';

export default function ProgressBar({ value = 0, max = 15, height = 6, light = false }) {
  const pct = Math.min(100, Math.round((Math.max(0, value) / Math.max(1, max)) * 100));
  return (
    <div style={{
      background: light ? '#E8E8E8' : '#1F1F1F',
      borderRadius: 999,
      height: height,
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        borderRadius: 999,
        background: 'linear-gradient(90deg, #E8001D 0%, #F9D100 100%)',
        transition: 'width 0.4s ease',
        minWidth: pct > 0 ? 4 : 0,
      }} />
    </div>
  );
}