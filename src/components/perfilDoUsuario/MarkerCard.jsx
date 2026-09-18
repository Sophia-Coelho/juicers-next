import React from 'react';
import SparklineChart from './SparklineChart.jsx';
import { STATUS } from '../../theme.js';

const STATUS_PILL = {
  ok: { label: 'OK', color: '#3fb950', bg: 'rgba(63,185,80,.12)', border: 'rgba(63,185,80,.25)' },
  atencao: { label: 'Atenção', color: '#e0a82e', bg: 'rgba(224,168,46,.12)', border: 'rgba(224,168,46,.28)' },
  risco: { label: 'Risco alto', color: '#f04747', bg: 'rgba(240,71,71,.12)', border: 'rgba(240,71,71,.3)' },
};

/**
 * MarkerCard — card de marcador com sparkline, valor, badge de status e variação %.
 * Clicável: chama onSelect(marker).
 */
export default function MarkerCard({ marker, onSelect }) {
  const m = marker || {};
  const vals = m.values && m.values.length ? m.values : [0, 0, 0, 0];
  const last = vals[vals.length - 1];
  const prev = vals[vals.length - 2];
  const change = prev != null && prev !== 0 ? ((last - prev) / Math.abs(prev)) * 100 : 0;
  const valueDisplay = m.display != null ? m.display : last;

  const st = m.status || 'ok';
  const pill = STATUS_PILL[st] || STATUS_PILL.ok;
  const changeColor = Math.abs(change) < 0.05 ? '#848484' : change >= 0 ? '#d98a8a' : '#8ab98f';
  const changeText = (change >= 0 ? '▲ ' : '▼ ') + Math.abs(change).toFixed(1) + '%';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect && onSelect(m)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect && onSelect(m);
      }}
      className="jc-marker-card"
      style={{
        background: '#e5e5e5',
        border: '1px solid #d5d5d5',
        borderRadius: 12,
        padding: 14,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#656565', lineHeight: 1.3, fontWeight: 500 }}>{m.name}</span>
        <span
          style={{
            flex: 'none',
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
            color: pill.color,
            background: pill.bg,
            border: `1px solid ${pill.border}`,
            borderRadius: 20,
            padding: '2px 8px',
          }}
        >
          {pill.label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ fontSize: 23, fontWeight: 650, color: '#0f0f0f', letterSpacing: '-.01em' }}>{valueDisplay}</span>
        <span style={{ fontSize: 11, color: '#888' }}>{m.unit}</span>
      </div>

      <SparklineChart values={vals} reference={m.ref} status={st} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#848484' }}>
        <span style={{ color: changeColor, fontWeight: 600 }}>{changeText}</span>
        <span>vs anterior</span>
      </div>
    </div>
  );
}
