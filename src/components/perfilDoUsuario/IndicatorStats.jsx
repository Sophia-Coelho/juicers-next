import React, { useMemo } from 'react'
import { parseRef } from '../../utils/chart.js'

/**
 * IndicatorStats — leitura estatística do marcador selecionado no
 * EvolutionPanel. Preenche o espaço ao lado do gráfico com números que o
 * gráfico sozinho não deixa claro: tendência ao longo de TODA a série (não
 * só o último par), variação desde o primeiro exame, média, amplitude, e
 * quão confiável é esse histórico (poucas coletas = leitura preliminar).
 *
 * É genérico — roda em cima de qualquer marker (points/status/ref/attention/
 * risk/reverse), não é hard-coded para nenhum indicador específico.
 */

const STATUS_COLOR = { ok: '#3fb950', atencao: '#e0a82e', risco: '#f04747' }
const STATUS_BG = { ok: 'rgba(63,185,80,.12)', atencao: 'rgba(224,168,46,.14)', risco: 'rgba(240,71,71,.13)' }

function fmt(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const n = Number(value)
  return String(Number(n.toFixed(2))).replace('.', ',')
}

function fmtSigned(value, unidade) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const sinal = value > 0 ? '+' : value < 0 ? '−' : '±'
  return `${sinal}${fmt(Math.abs(value))} ${unidade}`
}

function IconBars() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M3 13V8M8 13V3M13 13V9.5" />
    </svg>
  )
}
function IconTrend({ dir }) {
  const d = dir === 'alta' ? 'M2 12L7 7L9.5 9.5L14 4' : dir === 'baixa' ? 'M2 4L7 9L9.5 6.5L14 12' : 'M2 8H14'
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}
function IconArrowUp() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13V3M3.5 7.5L8 3L12.5 7.5" />
    </svg>
  )
}
function IconDoc() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2h5l3 3v9H4z" />
      <path d="M9 2v3h3" />
    </svg>
  )
}
function IconSwap() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6h11M10 3l3 3-3 3M14 10H3M6 7l-3 3 3 3" />
    </svg>
  )
}
function IconAlert() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2L15 14H1Z" />
      <path d="M8 6.5V9.5" />
      <circle cx="8" cy="11.7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconBulb() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5a4.5 4.5 0 0 0-2.5 8.2c.5.4.8 1 .8 1.6v.2h3.4v-.2c0-.6.3-1.2.8-1.6A4.5 4.5 0 0 0 8 1.5Z" />
      <path d="M6.3 14h3.4M6.8 15h2.4" />
    </svg>
  )
}

function tendenciaInfo(vals) {
  if (vals.length < 2) return { dir: 'flat', label: 'sem histórico suficiente' }
  const diffs = []
  for (let i = 1; i < vals.length; i++) diffs.push(vals[i] - vals[i - 1])
  const subindo = diffs.every((d) => d > 0)
  const descendo = diffs.every((d) => d < 0)
  if (subindo) return { dir: 'alta', label: 'elevação contínua' }
  if (descendo) return { dir: 'baixa', label: 'queda contínua' }
  return { dir: 'flat', label: 'oscilante' }
}

function evidenciaInfo(n) {
  if (n <= 1) return { label: 'Sem histórico', tone: 'risco' }
  if (n <= 3) return { label: 'Histórico curto', tone: 'atencao' }
  if (n <= 5) return { label: 'Histórico moderado', tone: 'atencao' }
  return { label: 'Histórico consistente', tone: 'ok' }
}

/** Limites visuais da barra de referência: sempre os dois lados definidos,
 *  mesmo quando o catálogo só documenta um (ex.: HDL só tem "> 40"). */
function limitesVisuais(refLo, refHi, vals, atual) {
  let lo = refLo
  let hi = refHi
  if (lo == null && hi != null) lo = 0
  if (hi == null && lo != null) hi = Math.max(lo * 1.4, atual ?? lo, ...vals, lo + 1)
  if (lo == null && hi == null) {
    lo = Math.min(...vals, atual ?? vals[0] ?? 0)
    hi = Math.max(...vals, atual ?? vals[0] ?? 1)
  }
  return { lo, hi }
}

export default function IndicatorStats({ marker }) {
  const stats = useMemo(() => {
    if (!marker) return null
    const points = marker.points || []
    const vals = points.map((p) => p.value)
    const n = vals.length
    const atual = marker.display ?? vals[n - 1] ?? null
    const unidadeDelta = marker.unit === '%' ? 'p.p.' : marker.unit

    const tendencia = tendenciaInfo(vals)
    const desdePrimeiro = n >= 2 ? vals[n - 1] - vals[0] : null
    const media = n ? vals.reduce((a, b) => a + b, 0) / n : null
    const amplitude = n ? Math.max(...vals) - Math.min(...vals) : null
    const evidencia = evidenciaInfo(n)

    const { lo: refLo, hi: refHi } = parseRef(marker.ref)
    const { lo: visLo, hi: visHi } = limitesVisuais(refLo, refHi, vals, atual)

    let posicao = 'dentro'
    if (refHi != null && atual != null && atual > refHi) posicao = 'acima'
    else if (refLo != null && atual != null && atual < refLo) posicao = 'abaixo'

    const posicaoLabel = {
      acima: 'Acima da referência',
      abaixo: 'Abaixo da referência',
      dentro: 'Dentro da referência',
    }[posicao]

    const span = visHi - visLo || 1
    const visMin = visLo - span * 0.22
    const visMax = visHi + span * 0.22
    const pct = atual == null ? 50 : Math.min(98, Math.max(2, ((atual - visMin) / (visMax - visMin)) * 100))
    const loPct = Math.min(98, Math.max(2, ((visLo - visMin) / (visMax - visMin)) * 100))
    const hiPct = Math.min(98, Math.max(2, ((visHi - visMin) / (visMax - visMin)) * 100))

    // Melhora/piora é relativo ao marcador (reverse inverte o sinal).
    const corDelta = (delta) => {
      if (delta === null || Math.abs(delta) < 1e-9) return '#656565'
      const melhorou = marker.reverse ? delta > 0 : delta < 0
      return melhorou ? '#1f8a3c' : '#c23a3a'
    }

    const verbo = { alta: 'aumentou', baixa: 'diminuiu', flat: tendencia.label === 'oscilante' ? 'oscilou' : 'permaneceu estável' }[tendencia.dir]
    const posicaoFrase = {
      acima: 'ultrapassou a faixa de referência',
      abaixo: 'ficou abaixo da faixa de referência',
      dentro: 'permanece dentro da faixa de referência',
    }[posicao]
    const recomendacao = (marker.status === 'risco' || marker.status === 'atencao')
      ? 'Considere acompanhar a evolução e conversar com um profissional de saúde.'
      : 'Continue acompanhando normalmente nos próximos exames.'
    // Siglas (HDL, LDL, VLDL...) não entram em minúsculo — só o primeiro
    // caractere de nomes "normais" (Hematócrito -> hematócrito).
    const nomeMinusculo = marker.name
      ? (marker.name === marker.name.toUpperCase()
          ? marker.name
          : marker.name.charAt(0).toLowerCase() + marker.name.slice(1))
      : ''
    const insight = n >= 2
      ? `O ${nomeMinusculo} ${verbo} nos ${n} exames registrados e o valor mais recente ${posicaoFrase}. ${recomendacao}`
      : `Só há uma coleta de ${nomeMinusculo} até agora — a partir do segundo exame dá pra falar em tendência. ${recomendacao}`

    return {
      atual, unidadeDelta, tendencia, desdePrimeiro, media, amplitude, evidencia, n,
      refLo, refHi, posicao, posicaoLabel, pct, loPct, hiPct, corDelta, insight,
    }
  }, [marker])

  if (!marker || !stats) return null

  const pillTone = stats.posicao === 'dentro' ? 'ok' : (marker.status || 'atencao')

  return (
    <aside className="ep-stats">
      <header className="ep-stats-head">
        <span className="ep-stats-icon"><IconBars /></span>
        <div>
          <h3 className="ep-stats-title">Leitura estatística do indicador</h3>
          <p className="ep-stats-sub">Análise baseada nos seus exames registrados</p>
        </div>
      </header>

      <div className="ep-stats-top">
        <div className="ep-stats-top-row">
          <span className="ep-stats-label">Valor atual</span>
          <span className="ep-stats-pill" style={{ color: STATUS_COLOR[pillTone], background: STATUS_BG[pillTone] }}>
            <IconAlert /> {stats.posicaoLabel}
          </span>
        </div>
        <div className="ep-stats-value" style={{ color: STATUS_COLOR[pillTone] }}>
          {fmt(stats.atual)} <em>{marker.unit}</em>
        </div>

        <div className="ep-stats-bar-wrap">
          <div
            className="ep-stats-bar"
            style={{
              background: marker.reverse
                ? 'linear-gradient(to right, #f04747, #e0a82e, #3fb950)'
                : 'linear-gradient(to right, #3fb950, #e0a82e, #f04747)',
            }}
          >
            <span className="ep-stats-bar-dot" style={{ left: `${stats.pct}%` }} />
          </div>
          <div className="ep-stats-bar-labels">
            <span>{stats.refLo != null ? fmt(stats.refLo) : ''}</span>
            <span className="ep-stats-bar-caption">Faixa de referência</span>
            <span>{stats.refHi != null ? fmt(stats.refHi) : ''}</span>
          </div>
        </div>
      </div>

      <ul className="ep-stats-list">
        <li>
          <span className="ep-stats-row-icon"><IconTrend dir={stats.tendencia.dir} /></span>
          <span className="ep-stats-row-label">Tendência: <strong>{stats.tendencia.label}</strong></span>
        </li>
        <li>
          <span className="ep-stats-row-icon"><IconBars /></span>
          <span className="ep-stats-row-label">Variação recente (último exame):</span>
          <span className="ep-stats-row-value" style={{ color: stats.corDelta(marker.change?.abs ?? null) }}>
            {marker.change ? fmtSigned(marker.change.abs, stats.unidadeDelta) : '—'}
          </span>
        </li>
        <li>
          <span className="ep-stats-row-icon"><IconArrowUp /></span>
          <span className="ep-stats-row-label">Desde o primeiro exame:</span>
          <span className="ep-stats-row-value" style={{ color: stats.corDelta(stats.desdePrimeiro) }}>
            {fmtSigned(stats.desdePrimeiro, stats.unidadeDelta)}
          </span>
        </li>
        <li>
          <span className="ep-stats-row-icon" style={{ fontWeight: 700, fontSize: 13 }}>Σ</span>
          <span className="ep-stats-row-label">Média do período:</span>
          <span className="ep-stats-row-value">{fmt(stats.media)} {marker.unit}</span>
        </li>
        <li>
          <span className="ep-stats-row-icon"><IconDoc /></span>
          <span className="ep-stats-row-label">Histórico disponível:</span>
          <span className="ep-stats-row-value">{stats.n} exame{stats.n !== 1 ? 's' : ''}</span>
        </li>
        <li>
          <span className="ep-stats-row-icon"><IconSwap /></span>
          <span className="ep-stats-row-label">Amplitude observada:</span>
          <span className="ep-stats-row-value">{fmt(stats.amplitude)} {stats.unidadeDelta}</span>
        </li>
        <li>
          <span className="ep-stats-row-icon"><IconBars /></span>
          <span className="ep-stats-row-label">Nível de evidência:</span>
          <span className="ep-stats-pill ep-stats-pill--sm" style={{ color: STATUS_COLOR[stats.evidencia.tone], background: STATUS_BG[stats.evidencia.tone] }}>
            <IconAlert /> {stats.evidencia.label}
          </span>
        </li>
      </ul>

      <div className="ep-stats-insight">
        <span className="ep-stats-insight-icon"><IconBulb /></span>
        <div>
          <strong>Insight Juicers</strong>
          <p>{stats.insight}</p>
        </div>
      </div>
    </aside>
  )
}
