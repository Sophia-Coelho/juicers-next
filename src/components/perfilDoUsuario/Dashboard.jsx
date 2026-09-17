import React, { useState } from 'react';
import MarkerCard from './MarkerCard.jsx';
import AlertSidebar from './AlertSidebar.jsx';
import { ACCENT, STATUS } from '../../theme.js';
import { parseDate } from '../../utils/chart.js';

/**
 * Dashboard — faixa de resumo (4 cards) + filtros (categoria/período cumulativo)
 * + grade de mini-cards de marcadores agrupada por categoria + sidebar de alertas.
 *
 * Props: accent, hideHeader, heading, sub, summary, alerts, categories, examDates, onSelect.
 */
export default function Dashboard({
  accent = ACCENT.athlete,
  hideHeader = false,
  heading = '',
  sub = '',
  summary = [],
  alerts = [],
  categories = [],
  examDates = [],
  onSelect,
}) {
  const [cat, setCat] = useState('Todos');
  const [periodMonths, setPeriodMonths] = useState(null);

  const activeBg = accent === ACCENT.doctor ? 'rgba(47,214,190,.13)' : 'rgba(230,168,23,.13)';

  // ---- período cumulativo (3/6/12 meses, Todos) ----
  const dates = (examDates || []).map(parseDate);
  const latest = dates.length ? dates[dates.length - 1] : null;
  const countWithin = (months) => {
    if (months == null || !latest) return dates.length || 4;
    const cutoff = new Date(latest.getFullYear(), latest.getMonth() - months, latest.getDate());
    return Math.max(1, dates.filter((d) => d >= cutoff).length);
  };
  const period = countWithin(periodMonths);
  const sliceVals = (arr) => (period >= arr.length ? arr : arr.slice(arr.length - period));

  const displayCategories = categories
    .filter((c) => cat === 'Todos' || c.name === cat)
    .map((c) => ({ name: c.name, markers: c.markers.map((m) => ({ ...m, values: sliceVals(m.values) })) }));

  const chipStyle = (on) => ({
    background: on ? activeBg : 'transparent',
    color: on ? accent : '#656565',
    border: `1px solid ${on ? accent : '#d5d5d5'}`,
  });

  const periodOpts = [
    { label: '3 meses', m: 3 },
    { label: '6 meses', m: 6 },
    { label: '1 ano', m: 12 },
    { label: 'Todos', m: null },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {!hideHeader && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f0f0f', letterSpacing: '-.02em' }}>{heading}</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#777', lineHeight: 1.4 }}>{sub}</p>
        </div>
      )}

      {/* Faixa de resumo */}
      <div className="jc-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {summary.map((s, i) => {
          const color = STATUS.color[s.status] || '#777';
          return (
            <div key={i} style={{ background: '#ebebeb', border: '1px solid #d5d5d5', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#656565', fontWeight: 500 }}>{s.name}</span>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flex: 'none' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#0f0f0f', letterSpacing: '-.02em' }}>{s.value}</span>
                <span style={{ fontSize: 12, color: '#888' }}>{s.unit}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color }}>{STATUS.summaryLabel[s.status] || ''}</span>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 14,
          justifyContent: 'space-between',
          borderTop: '1px solid #e0e0e0',
          borderBottom: '1px solid #e0e0e0',
          padding: '14px 0',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', marginRight: 2 }}>Exames</span>
          {['Todos', ...categories.map((c) => c.name)].map((name) => (
            <button
              key={name}
              className="jc-chip"
              onClick={() => setCat(name)}
              style={{ fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', borderRadius: 20, padding: '6px 13px', cursor: 'pointer', ...chipStyle(cat === name) }}
            >
              {name}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', marginRight: 2 }}>Período</span>
          {periodOpts.map((o) => (
            <button
              key={o.label}
              className="jc-chip"
              onClick={() => setPeriodMonths(o.m)}
              style={{ fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', borderRadius: 8, padding: '6px 13px', cursor: 'pointer', ...chipStyle(periodMonths === o.m) }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo: grade de marcadores + sidebar de alertas */}
      <div className="jc-content" style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 26 }}>
          {displayCategories.map((c) => (
            <div key={c.name} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <svg width="9" height="9" viewBox="0 0 9 9" style={{ flex: 'none' }}>
                  <circle cx="4.5" cy="4.5" r="4.5" fill={accent} />
                </svg>
                <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#424242' }}>{c.name}</h2>
                <div style={{ flex: 1, height: 1, background: '#ddd' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(188px,1fr))', gap: 14 }}>
                {c.markers.map((m) => (
                  <MarkerCard key={m.id} marker={m} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <AlertSidebar alerts={alerts} />
      </div>
    </div>
  );
}