import React, { useState, useMemo } from 'react'
import MarkerChart from './MarkerChart.jsx'
import IndicatorStats from './IndicatorStats.jsx'
import { getMarkerChange } from '../../data/markers.js'
import './EvolutionPanel.css'

/**
 * EvolutionPanel — o gráfico de evolução visível direto no dashboard.
 *
 * Cartão escuro, com seletor de marcador agrupado por categoria e período
 * próprio (3/6/12 meses · Todos) — independente do filtro de período da
 * grade de mini-cards abaixo, que continua recortando só os cards.
 */

const STATUS_COLOR = { ok: '#3fb950', atencao: '#e0a82e', risco: '#f04747' }

const TREND_LABEL = {
  melhorou: 'melhorou desde o exame anterior',
  piorou: 'piorou desde o exame anterior',
  estavel: 'estável desde o exame anterior',
}

const PERIODOS = [
  { id: '3m', label: '3 meses', meses: 3 },
  { id: '6m', label: '6 meses', meses: 6 },
  { id: '1a', label: '1 ano', meses: 12 },
  { id: 'todos', label: 'Todos', meses: null },
]

function fmt(value) {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return String(Number(n.toFixed(2))).replace('.', ',')
}

/**
 * Corta os pontos de um marcador pelo período, contado a partir da ÚLTIMA
 * coleta DELE — não de hoje. Com dados de demonstração (ou um paciente que
 * parou de fazer exames), contar a partir de Date.now() faz "3 meses"
 * devolver um ponto só e o gráfico morre na apresentação.
 */
function cortarPeriodo(marker, meses) {
  if (meses == null || !marker.points?.length) return marker

  const ultimoT = marker.points[marker.points.length - 1].t
  const corte = new Date(ultimoT)
  corte.setMonth(corte.getMonth() - meses)

  const points = marker.points.filter((p) => p.t >= corte.getTime())
  if (!points.length) return { ...marker, points: [], values: [] }

  const last = points[points.length - 1].value

  return {
    ...marker,
    points,
    values: points.map((p) => p.value),
    display: last,
    change: getMarkerChange(points, marker),
  }
}

export default function EvolutionPanel({ categories = [], defaultMarkerId = 'hematocrit', onSelect }) {
  const todosBrutos = useMemo(
    () => categories.flatMap((c) => c.markers.map((m) => ({ ...m, cat: m.cat || c.name }))),
    [categories]
  )

  const [periodoId, setPeriodoId] = useState('todos')
  const periodo = PERIODOS.find((p) => p.id === periodoId)

  const todos = useMemo(
    () => todosBrutos.map((m) => cortarPeriodo(m, periodo?.meses ?? null)),
    [todosBrutos, periodo]
  )

  const comHistorico = todos.filter((m) => (m.points?.length ?? 0) > 1)
  const inicial = todos.find((m) => m.id === defaultMarkerId) || comHistorico[0] || todos[0]

  const [selectedId, setSelectedId] = useState(inicial?.id)

  const marker = todos.find((m) => m.id === selectedId) || inicial

  if (!todos.length || !marker) return null

  const nExames = Math.max(0, ...todosBrutos.map((m) => m.points?.length ?? 0))
  const nPontos = marker.points?.length ?? 0
  const change = marker.change
  const heroColor = marker.status ? (STATUS_COLOR[marker.status] || '#ffffff') : '#ffffff'

  return (
    <section className="ep-card">
      <header className="ep-head">
        <div>
          <h2 className="ep-title">Evolução dos indicadores</h2>
          <p className="ep-sub">
            {nExames} exame{nExames !== 1 ? 's' : ''} registrado{nExames !== 1 ? 's' : ''} · acompanhe como cada marcador se move no tempo
          </p>
        </div>

        <div className="ep-periods" role="group" aria-label="Período">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`ep-pill ${periodoId === p.id ? 'is-on' : ''}`}
              aria-pressed={periodoId === p.id}
              onClick={() => setPeriodoId(p.id)}
            >
              {p.label}
            </button>
          ))}

          {onSelect && (
            <button
              type="button"
              className="ep-expand"
              aria-label={`Ampliar gráfico de ${marker.name}`}
              title="Ampliar gráfico"
              onClick={() => onSelect(marker)}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" />
              </svg>
            </button>
          )}
        </div>
      </header>

      <div className="ep-body">
        <nav className="ep-nav" aria-label="Marcadores">
          {categories.map((cat) => (
            <div key={cat.name} className="ep-group">
              <h3 className="ep-group-title">{cat.name}</h3>
              {cat.markers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={m.id === marker.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`ep-item ${m.id === marker.id ? 'is-on' : ''}`}
                >
                  <span className="ep-item-top">
                    <i className="ep-item-dot" style={{ background: STATUS_COLOR[m.status] || '#656565' }} />
                    <span className="ep-item-name">{m.name}</span>
                  </span>
                  <span className="ep-item-value">
                    {fmt(m.display)} <em>{m.unit}</em>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="ep-chart-col">
          <div className="ep-hero">
            <div>
              <span className="ep-hero-label">{marker.name}</span>
              <div className="ep-hero-value" style={{ color: heroColor }}>
                {fmt(marker.display)}
                <em>{marker.unit}</em>
              </div>
            </div>

            <div className="ep-variacao">
              {/* Sem exame anterior não existe comparação — e é melhor dizer
                  isso do que mostrar "▲ 0,0%", que parece dado real. */}
              {change ? (
                <>
                  <span className="ep-delta" style={{ color: STATUS_COLOR[change.trend === 'estavel' ? 'ok' : (change.trend === 'melhorou' ? 'ok' : 'risco')] }}>
                    {change.trend === 'estavel' ? '—' : change.abs > 0 ? '▲' : '▼'}{' '}
                    {fmt(Math.abs(change.abs))} {marker.unit === '%' ? 'p.p.' : marker.unit}
                  </span>
                  <span className="ep-delta-txt">{TREND_LABEL[change.trend]}</span>
                </>
              ) : (
                <span className="ep-primeira">Primeira medição — sem comparativo</span>
              )}
              <span className="ep-ref">Referência {marker.ref} {marker.unit}</span>
            </div>
          </div>

          <div className="ep-chart-wrap">
            <MarkerChart marker={marker} height={460} />
          </div>

          {nPontos === 0 && (
            <p className="ep-aviso">
              Nenhum exame deste período registrou {marker.name}. Experimente o período "Todos".
            </p>
          )}
          {nPontos === 1 && (
            <p className="ep-aviso">
              Só existe uma coleta de {marker.name}. A curva de evolução aparece a partir do segundo exame importado.
            </p>
          )}

          <ul className="ep-legend">
            <li><i className="ep-dot ep-dot--ok" />Dentro da faixa</li>
            <li><i className="ep-dot ep-dot--atencao" />Atenção</li>
            <li><i className="ep-dot ep-dot--risco" />Risco</li>
          </ul>
        </div>

        <IndicatorStats marker={marker} />
      </div>
    </section>
  )
}
