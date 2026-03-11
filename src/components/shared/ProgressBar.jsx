import React from 'react';

export default function ProgressBar({ value = 0, max = 15, height = 7 }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.07)',
      borderRadius: 999, height,
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: pct >= 100
          ? '#c8f04a'
          : 'linear-gradient(90deg, rgba(200,240,74,0.35) 0%, #c8f04a 100%)',
        borderRadius: 999,
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
}