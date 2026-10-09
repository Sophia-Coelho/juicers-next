import React, { useState, useRef, useLayoutEffect } from 'react'
import { smoothPath } from '../../utils/chart.js'
import { getMarkerStatus } from '../../data/markers.js'

/**
 * MarkerChart — gráfico de evolução de um marcador ao longo dos exames.
 *
 * Cartão off-white, na paleta do resto do dashboard: a linha carrega a
 * identidade da marca (sempre o mesmo teal), os pontos carregam o estado
 * clínico de CADA coleta (não só o status do último exame), e o fundo do
 * plot é dividido em zonas reais — dentro da faixa / atenção / risco — a
 * partir de marker.attention e marker.risk, em vez de só min/máx do texto
 * de referência. É o mesmo limiar que acende o badge do card; aqui ele vira
 * uma linha tracejada com rótulo.
 *
 * O eixo X é por TEMPO real (marker.points[].t), não por índice — exames
 * separados por 3 meses e por 8 meses não aparecem igualmente espaçados.
 */

const INK = {
  textPrimary: '#0f0f0f',
  textSecondary: '#656565',
  textMuted: '#888888',
  grid: '#e2e2e2',
  axis: '#c7c7c7',
}
const BRAND = '#2fd6be'
const STATUS_COLOR = { ok: '#3fb950', atencao: '#e0a82e', risco: '#f04747' }
const STATUS_BAND = { ok: 'rgba(47,214,190,.10)', atencao: 'rgba(224,168,46,.13)', risco: 'rgba(240,71,71,.12)' }
const SURFACE_RING = '#f4f4f4'

/**
 * Mede o container real (largura E altura) via ResizeObserver, em vez de só
 * escalar um viewBox de largura fixa por CSS. Sem isso, o gráfico nunca
 * ocupa a altura que o cartão abre pra ele — fica "flutuando" pequeno no
 * meio de uma área grande, só porque a largura disponível era modesta.
 */
function useTamanhoReal(ref, fallback) {
  const [tamanho, setTamanho] = useState(fallback)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const medir = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) setTamanho({ w: width, h: height })
    }
    medir()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return tamanho
}

function fmt(value) {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return String(Number(n.toFixed(2))).replace('.', ',')
}

function shortDate(t) {
  const d = new Date(t)
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${meses[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
}

/** Retângulo de uma zona entre dois valores de domínio, recortado no plot visível. */
function zoneRect(fromVal, toVal, sy, top, bottom) {
  const yA = sy(fromVal)
  const yB = sy(toVal)
  const zTop = Math.max(top, Math.min(yA, yB))
  const zBottom = Math.min(bottom, Math.max(yA, yB))
  const h = zBottom - zTop
  return h > 0 ? { y: zTop, h } : null
}

export default function MarkerChart({ marker, height = 260, compact = false }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const wrapRef = useRef(null)
  const { w: W, h: H } = useTamanhoReal(wrapRef, { w: 600, h: height })

  if (!marker) {
    return <div ref={wrapRef} style={{ width: '100%', height: '100%' }} />
  }

  // points é o formato novo; values é o antigo. Aceita os dois para não
  // quebrar nenhuma chamada existente.
  const points = marker.points && marker.points.length
    ? marker.points
    : (marker.values || []).map((value, i) => ({ t: i, value, dateLabel: '' }))

  if (!points.length) {
    return <div ref={wrapRef} style={{ width: '100%', height: '100%' }} />
  }

  const L = compact ? 42 : 48
  const R = 22
  const T = compact ? 22 : 30
  const B = 44

  const vals = points.map(p => p.value)
  const { attention, risk, reverse } = marker

  let mn = Math.min(...vals)
  let mx = Math.max(...vals)
  ;[attention, risk].forEach(x => {
    if (typeof x === 'number') {
      mn = Math.min(mn, x)
      mx = Math.max(mx, x)
    }
  })

  const pad = (mx - mn || 1) * 0.2
  const yMin = mn - pad
  const yMax = mx + pad

  // --- escala X por tempo real ---
  const tMin = points[0].t
  const tMax = points[points.length - 1].t
  const span = tMax - tMin

  const sx = (t) => (span > 0 ? L + ((t - tMin) / span) * (W - L - R) : L + (W - L - R) / 2)
  const sy = (v) => T + (1 - (v - yMin) / ((yMax - yMin) || 1)) * (H - T - B)

  const axisYBottom = H - B
  const axisRight = W - R

  const plotted = points.map((p, i) => ({
    idx: i,
    x: +sx(p.t).toFixed(1),
    y: +sy(p.value).toFixed(1),
    value: p.value,
    estado: getMarkerStatus(marker, p.value),
    valLabel: `${fmt(p.value)} ${marker.unit}`,
    date: p.dateLabel,
    shortDate: p.t > 1e9 ? shortDate(p.t) : p.dateLabel,
  }))

  const linePath = smoothPath(plotted.map(p => [p.x, p.y]))
  const areaPath = plotted.length > 1
    ? `${linePath} L${plotted[plotted.length - 1].x.toFixed(1)},${axisYBottom} L${plotted[0].x.toFixed(1)},${axisYBottom} Z`
    : ''

  // --- zonas clínicas: dentro da faixa / atenção / risco ---
  const hasThresholds = typeof attention === 'number' && typeof risk === 'number'
  const zones = hasThresholds
    ? (reverse
        ? [
            { estado: 'ok', r: zoneRect(attention, yMax, sy, T, axisYBottom) },
            { estado: 'atencao', r: zoneRect(risk, attention, sy, T, axisYBottom) },
            { estado: 'risco', r: zoneRect(yMin, risk, sy, T, axisYBottom) },
          ]
        : [
            { estado: 'ok', r: zoneRect(yMin, attention, sy, T, axisYBottom) },
            { estado: 'atencao', r: zoneRect(attention, risk, sy, T, axisYBottom) },
            { estado: 'risco', r: zoneRect(risk, yMax, sy, T, axisYBottom) },
          ]
      ).filter(z => z.r)
    : []

  const thresholdLines = hasThresholds
    ? [
        { key: 'atencao', value: attention, color: STATUS_COLOR.atencao, label: `atenção · ${fmt(attention)}` },
        { key: 'risco', value: risk, color: STATUS_COLOR.risco, label: `risco · ${fmt(risk)}` },
      ].filter(l => l.value >= yMin && l.value <= yMax)
    : []

  // Em telas estreitas (medidas de verdade agora, não mais um viewBox fixo
  // escalado) cada data por extenso não cabe mais em 1/3 da largura — passa
  // pra formato curto e, se ainda faltar espaço, mostra só a primeira e a
  // última data.
  const estreito = W > 0 && W < 480
  const curto = compact || estreito

  // Em séries longas, rotula só algumas datas para não sobrepor.
  const maxLabels = estreito ? 2 : compact ? 4 : 6
  const step = Math.max(1, Math.ceil(plotted.length / maxLabels))
  const mostraData = (i) => {
    if (estreito) return i === 0 || i === plotted.length - 1
    return i === 0 || i === plotted.length - 1 || i % step === 0
  }

  let hover = null
  if (hoverIdx != null && plotted[hoverIdx]) {
    const p = plotted[hoverIdx]
    const boxW = 150
    const boxH = 56
    let bx = p.x - boxW / 2
    bx = Math.max(L - 6, Math.min(W - R - boxW + 6, bx))
    let by = p.y - boxH - 16
    if (by < T - 8) by = p.y + 16
    hover = {
      px: p.x,
      py: p.y,
      bx: +bx.toFixed(1),
      by: +by.toFixed(1),
      boxW,
      boxH,
      cx: +(bx + boxW / 2).toFixed(1),
      dateY: +(by + 17).toFixed(1),
      valY: +(by + 36).toFixed(1),
      refY: +(by + 49).toFixed(1),
      valLabel: p.valLabel,
      date: p.date || p.shortDate,
      color: STATUS_COLOR[p.estado] || BRAND,
    }
  }

  const umPonto = plotted.length === 1

  const descricao = `Evolução de ${marker.name}: ` +
    plotted.map(p => `${p.date || p.shortDate}, ${fmt(p.value)} ${marker.unit}`).join('; ')

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
      role="img"
      aria-label={descricao}
    >
      <defs>
        <linearGradient id="mc-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity="0.28" />
          <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
        </linearGradient>
      </defs>

      {zones.map((z, i) => (
        <rect key={i} x={L} y={+z.r.y.toFixed(1)} width={axisRight - L} height={+z.r.h.toFixed(1)} fill={STATUS_BAND[z.estado]} />
      ))}

      <line x1={L} y1={T} x2={L} y2={axisYBottom} stroke={INK.axis} strokeWidth="1" />
      <line x1={L} y1={axisYBottom} x2={axisRight} y2={axisYBottom} stroke={INK.axis} strokeWidth="1" />

      {thresholdLines.map((t) => {
        const y = +sy(t.value).toFixed(1)
        return (
          <g key={t.key}>
            <line x1={L} y1={y} x2={axisRight} y2={y} stroke={t.color} strokeOpacity="0.55" strokeWidth="1" strokeDasharray="5 4" />
            <text x={axisRight} y={y - 5} textAnchor="end" fill={t.color} fontSize="10" fontWeight="600" fontFamily="Manrope">
              {t.label}
            </text>
          </g>
        )
      })}

      {plotted.length > 1 && <path d={areaPath} fill="url(#mc-area-grad)" />}
      {plotted.length > 1 && (
        <path d={linePath} fill="none" stroke={BRAND} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {plotted.map((p, i) => (
        <g key={i}>
          {!compact && (
            <text x={p.x} y={p.y - 13} textAnchor="middle" fill={INK.textPrimary} fontSize="12.5" fontWeight="700" fontFamily="Manrope">
              {fmt(p.value)}
            </text>
          )}
          {mostraData(i) && (
            <text
              x={p.x}
              y={H - 16}
              textAnchor={i === 0 ? 'start' : i === plotted.length - 1 ? 'end' : 'middle'}
              fill={INK.textMuted}
              fontSize="10.5"
              fontFamily="Manrope"
            >
              {curto ? p.shortDate : p.date || p.shortDate}
            </text>
          )}
          <circle cx={p.x} cy={p.y} r={hoverIdx === i ? 7 : 5} fill={STATUS_COLOR[p.estado] || BRAND} stroke={SURFACE_RING} strokeWidth="2" />
        </g>
      ))}

      {plotted.map((p, i) => (
        <circle
          key={`hit${i}`}
          cx={p.x}
          cy={p.y}
          r="18"
          fill="transparent"
          pointerEvents="all"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHoverIdx(i)}
          onMouseLeave={() => setHoverIdx(null)}
          onFocus={() => setHoverIdx(i)}
          onBlur={() => setHoverIdx(null)}
          tabIndex={umPonto ? -1 : 0}
        />
      ))}

      {hover && (
        <g>
          <line x1={hover.px} y1={T} x2={hover.px} y2={axisYBottom} stroke="rgba(0,0,0,.2)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={hover.px} cy={hover.py} r="8" fill="none" stroke={hover.color} strokeWidth="2" />
          <rect x={hover.bx} y={hover.by} width={hover.boxW} height={hover.boxH} rx="9" fill="#242422" stroke="rgba(255,255,255,.12)" strokeWidth="1" />
          <text x={hover.cx} y={hover.dateY} textAnchor="middle" fill="#c3c2b7" fontSize="10.5" fontFamily="Manrope">
            {hover.date}
          </text>
          <text x={hover.cx} y={hover.valY} textAnchor="middle" fill={hover.color} fontSize="15" fontWeight="700" fontFamily="Manrope">
            {hover.valLabel}
          </text>
          <text x={hover.cx} y={hover.refY} textAnchor="middle" fill="#898781" fontSize="10" fontFamily="Manrope">
            Referência {marker.ref}
          </text>
        </g>
      )}
    </svg>
    </div>
  )
}
