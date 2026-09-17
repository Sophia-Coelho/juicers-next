import React, { useState } from 'react';
import { smoothPath, parseRef } from '../../utils/chart.js';

/**
 * MarkerModal — gráfico expandido de um marcador ao longo dos exames:
 * curva suavizada, eixos X (datas) e Y (referência mín/máx), faixa de
 * referência sombreada, linhas tracejadas de limite e tooltip no hover.
 */
export default function MarkerModal({ marker, examDates = [], onClose }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!marker) return null;

  const m = marker;
  const vals = m.values;
  const dates = examDates.slice(-vals.length);
  const W = 600;
  const H = 260;
  const L = 48;
  const R = 22;
  const T = 30;
  const B = 44;

  const { lo, hi } = parseRef(m.ref);
  let mn = Math.min(...vals);
  let mx = Math.max(...vals);
  [lo, hi].forEach((x) => {
    if (x != null) {
      mn = Math.min(mn, x);
      mx = Math.max(mx, x);
    }
  });
  const pad = (mx - mn || 1) * 0.2;
  const yMin = mn - pad;
  const yMax = mx + pad;
  const sx = (i) => L + (vals.length > 1 ? i / (vals.length - 1) : 0.5) * (W - L - R);
  const sy = (v) => T + (1 - (v - yMin) / ((yMax - yMin) || 1)) * (H - T - B);

  const statusColor = { ok: '#3fb950', atencao: '#e0a82e', risco: '#f04747' }[m.status] || '#777';
  const statusBand = { ok: 'rgba(63,185,80,.12)', atencao: 'rgba(224,168,46,.12)', risco: 'rgba(240,71,71,.12)' }[m.status] || 'rgba(120,120,120,.1)';

  const points = vals.map((v, i) => ({
    idx: i,
    x: +sx(i).toFixed(1),
    y: +sy(v).toFixed(1),
    val: m.display != null && i === vals.length - 1 ? m.display : v,
    valLabel: (m.display != null && i === vals.length - 1 ? m.display : v) + ' ' + m.unit,
    date: dates[i],
    labelY: +(sy(v) - 13).toFixed(1),
  }));
  const linePath = smoothPath(points.map((p) => [p.x, p.y]));

  let bandShow = false;
  let bandY = 0;
  let bandH = 0;
  if (lo != null && hi != null) {
    bandShow = true;
    bandY = sy(hi);
    bandH = sy(lo) - sy(hi);
  } else if (hi != null) {
    bandShow = true;
    bandY = sy(hi);
    bandH = sy(yMin) - sy(hi);
  } else if (lo != null) {
    bandShow = true;
    bandY = sy(yMax);
    bandH = sy(lo) - sy(yMax);
  }

  const refLines = [];
  if (hi != null) refLines.push({ y: +sy(hi).toFixed(1), textY: +(sy(hi) - 5).toFixed(1), value: '' + hi, tag: 'máx · ' + hi });
  if (lo != null) refLines.push({ y: +sy(lo).toFixed(1), textY: +(sy(lo) - 5).toFixed(1), value: '' + lo, tag: 'mín · ' + lo });

  const axisYBottom = H - B;
  const axisRight = W - R;
  const dateY = H - 16;

  // tooltip
  let hover = null;
  if (hoverIdx != null && points[hoverIdx]) {
    const p = points[hoverIdx];
    const boxW = 116;
    const boxH = 44;
    let bx = p.x - boxW / 2;
    bx = Math.max(L - 6, Math.min(W - R - boxW + 6, bx));
    let by = p.y - boxH - 14;
    if (by < T - 8) by = p.y + 16;
    hover = {
      px: p.x,
      py: p.y,
      bx: +bx.toFixed(1),
      by: +by.toFixed(1),
      boxW,
      boxH,
      cx: +(bx + boxW / 2).toFixed(1),
      valY: +(by + 18).toFixed(1),
      dateY: +(by + 34).toFixed(1),
      valLabel: p.valLabel,
      date: p.date,
    };
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.62)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 24,
        animation: 'jc-fade .15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="jc-modal-anim"
        style={{
          background: '#e9e9e9',
          border: '1px solid #d5d5d5',
          borderRadius: 18,
          width: 'min(700px,100%)',
          padding: '26px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          boxShadow: '0 30px 70px -30px rgba(0,0,0,.8)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '-.01em' }}>{m.name}</h2>
            <p style={{ margin: 0, fontSize: 12.5, color: '#777' }}>
              Evolução nos últimos {vals.length} exames · Referência:{' '}
              <span style={{ color: '#303030', fontWeight: 600 }}>
                {m.ref} {m.unit}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="jc-close"
            style={{
              flex: 'none',
              width: 34,
              height: 34,
              borderRadius: 9,
              background: '#e0e0e0',
              border: '1px solid #d5d5d5',
              color: '#555',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ background: '#f0f0f0', border: '1px solid #dcdcdc', borderRadius: 12, padding: '14px 10px 6px' }}>
          <svg viewBox="0 0 600 260" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
            {bandShow && <rect x={L} y={+bandY.toFixed(1)} width={W - L - R} height={+bandH.toFixed(1)} fill={statusBand} />}
            <line x1={L} y1={30} x2={L} y2={axisYBottom} stroke="#d9d9d9" strokeWidth="1" />
            <line x1={L} y1={axisYBottom} x2={axisRight} y2={axisYBottom} stroke="#d9d9d9" strokeWidth="1" />
            {refLines.map((r, i) => (
              <g key={i}>
                <line x1={L} y1={r.y} x2={axisRight} y2={r.y} stroke="#b5b5b5" strokeWidth="1" strokeDasharray="5 4" />
                <text x={L - 8} y={r.y} dy="3.5" textAnchor="end" fill="#656565" fontSize="11" fontWeight="600" fontFamily="Manrope">
                  {r.value}
                </text>
                <text x={axisRight} y={r.textY} textAnchor="end" fill="#888" fontSize="10" fontWeight="600" fontFamily="Manrope">
                  {r.tag}
                </text>
              </g>
            ))}
            <path d={linePath} fill="none" stroke={statusColor} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4.5" fill="#e9e9e9" stroke={statusColor} strokeWidth="2.4" />
                <text x={p.x} y={p.labelY} textAnchor="middle" fill="#0f0f0f" fontSize="13" fontWeight="700" fontFamily="Manrope">
                  {p.val}
                </text>
                <text x={p.x} y={dateY} textAnchor="middle" fill="#777" fontSize="10.5" fontFamily="Manrope">
                  {p.date}
                </text>
              </g>
            ))}
            {points.map((p, i) => (
              <circle
                key={'hit' + i}
                cx={p.x}
                cy={p.y}
                r="16"
                fill="transparent"
                pointerEvents="all"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            ))}
            {hover && (
              <g>
                <line x1={hover.px} y1={30} x2={hover.px} y2={axisYBottom} stroke="#c5c5c5" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={hover.px} cy={hover.py} r="6.5" fill="none" stroke={statusColor} strokeWidth="2" />
                <rect x={hover.bx} y={hover.by} width={hover.boxW} height={hover.boxH} rx="8" fill="#ffffff" fillOpacity="0.92" stroke="#c5c5c5" strokeWidth="1" />
                <text x={hover.cx} y={hover.valY} textAnchor="middle" fill="#000000" fontSize="14" fontWeight="700" fontFamily="Manrope">
                  {hover.valLabel}
                </text>
                <text x={hover.cx} y={hover.dateY} textAnchor="middle" fill="#555555" fontSize="11" fontFamily="Manrope">
                  {hover.date}
                </text>
              </g>
            )}
          </svg>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, color: '#777' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 22, height: 10, borderRadius: 3, background: statusBand, border: '1px solid #ccc' }} />
            Zona de referência
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 16, height: 3, borderRadius: 2, background: statusColor }} />
            Seu resultado
          </span>
          <span style={{ color: '#999', fontSize: 11 }}>Passe o mouse sobre os pontos</span>
        </div>
      </div>
    </div>
  );
}
