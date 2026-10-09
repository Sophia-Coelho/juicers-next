/**
 * markers.js — fonte única do catálogo de marcadores e da montagem da série.
 *
 * Antes deste arquivo, a lista de MARKERS estava duplicada em três lugares
 * (hooks/useClinicalState.js, pages/PerfilAtleta.jsx, pages/PerfilAtletaMedico.jsx)
 * com pequenas diferenças entre as cópias. Agora todos importam daqui.
 */

export const CAT_ORDER = [
  'Cardiovascular',
  'Endócrino',
  'Renal',
  'Hematológico',
  'Micronutrientes',
]

export const MARKERS = [
  { category: 'Cardiovascular', key: 'hdl', aliases: ['colesterolHdl', 'colesterol_hdl', 'hdlColesterol'], id: 'hdl', name: 'HDL', unit: 'mg/dL', ref: '> 40', reverse: true, attention: 40, risk: 30 },
  { category: 'Cardiovascular', key: 'ldl', aliases: ['colesterolLdl', 'colesterol_ldl', 'ldlColesterol'], id: 'ldl', name: 'LDL', unit: 'mg/dL', ref: '< 100', attention: 130, risk: 190 },
  { category: 'Cardiovascular', key: 'nonHdl', aliases: ['naoHdl', 'nãoHdl', 'colesterolNaoHdl', 'colesterolNãoHdl'], id: 'nonHdl', name: 'Colesterol não-HDL', unit: 'mg/dL', ref: '< 130', attention: 130, risk: 160 },
  { category: 'Cardiovascular', key: 'vldl', aliases: ['colesterolVldl'], id: 'vldl', name: 'VLDL', unit: 'mg/dL', ref: '< 30', attention: 30, risk: 40 },
  { category: 'Cardiovascular', key: 'triglycerides', aliases: ['triglicerideos', 'triglicerídeos'], id: 'triglycerides', name: 'Triglicerídeos', unit: 'mg/dL', ref: '< 150', attention: 150, risk: 200 },

  { category: 'Endócrino', key: 'glucose', aliases: ['glicose', 'glicemia', 'glicemiaJejum'], id: 'glucose', name: 'Glicose', unit: 'mg/dL', ref: '70–99', attention: 100, risk: 126 },
  { category: 'Endócrino', key: 'hba1c', aliases: ['hemoglobinaGlicada', 'hbA1c', 'a1c'], id: 'hba1c', name: 'Hemoglobina Glicada', unit: '%', ref: '4.1–6.0', attention: 5.7, risk: 6.5 },

  { category: 'Renal', key: 'creatinine', aliases: ['creatinina'], id: 'creatinine', name: 'Creatinina', unit: 'mg/dL', ref: '0.6–1.3', attention: 1.3, risk: 1.6 },

  { category: 'Hematológico', key: 'hemoglobin', aliases: ['hemoglobina'], id: 'hemoglobin', name: 'Hemoglobina', unit: 'g/dL', ref: '12.8–17.8', attention: 17.8, risk: 18.5 },
  { category: 'Hematológico', key: 'hematocrit', aliases: ['hematocrito', 'hematócrito'], id: 'hematocrit', name: 'Hematócrito', unit: '%', ref: '37–52.4', attention: 52.4, risk: 55 },
  { category: 'Hematológico', key: 'erythrocytes', aliases: ['eritrocitos', 'eritrócitos', 'hemacias', 'hemácias'], id: 'erythrocytes', name: 'Eritrócitos', unit: 'milhões/mm³', ref: '4.10–6.11', attention: 6.11, risk: 6.5 },
  { category: 'Hematológico', key: 'leukocytes', aliases: ['leucocitos', 'leucócitos'], id: 'leukocytes', name: 'Leucócitos', unit: 'mil/mm³', ref: '4.12–11.11', attention: 11.11, risk: 13 },
  { category: 'Hematológico', key: 'platelets', aliases: ['plaquetas'], id: 'platelets', name: 'Plaquetas', unit: 'mil/mm³', ref: '162–425', attention: 425, risk: 500 },

  { category: 'Micronutrientes', key: 'vitaminD', aliases: ['vitaminaD', '25ohVitaminaD', 'vitamina_d'], id: 'vitaminD', name: 'Vitamina D', unit: 'ng/mL', ref: '20–60', reverse: true, attention: 20, risk: 10 },
  { category: 'Micronutrientes', key: 'vitaminB12', aliases: ['vitaminaB12', 'b12', 'vitamina_b12'], id: 'vitaminB12', name: 'Vitamina B12', unit: 'pg/mL', ref: '187–883', reverse: true, attention: 187, risk: 130 },
  { category: 'Micronutrientes', key: 'ferritin', aliases: ['ferritina'], id: 'ferritin', name: 'Ferritina', unit: 'ng/mL', ref: '21.81–274.66', attention: 275, risk: 400 },
  { category: 'Micronutrientes', key: 'iron', aliases: ['ferro'], id: 'iron', name: 'Ferro', unit: 'µg/dL', ref: '65–175', attention: 175, risk: 220 },
]

const SUMMARY_KEYS = ['ldl', 'hdl', 'creatinine', 'hematocrit']

/**
 * Converte 'YYYY-MM-DD' em Date LOCAL.
 *
 * new Date('2026-04-11') é interpretado como UTC meia-noite; no fuso do Brasil
 * isso vira 10/abr 21h e a data exibida fica um dia atrasada. Construindo a
 * data pelos componentes, o dia exibido é sempre o dia da coleta.
 */
export function parseExamDate(value) {
  if (!value) return null

  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const iso = String(value).slice(0, 10)
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }

  const fallback = new Date(value)

  return Number.isNaN(fallback.getTime()) ? null : fallback
}

export function formatExamDate(value) {
  const date = parseExamDate(value)

  if (!date) return typeof value === 'string' ? value : '—'

  return date
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '')
}

/**
 * Converte o valor de um marcador em número.
 *
 * Valores podem chegar como string do parser de PDF ou de digitação manual:
 * "58", "58,2" (vírgula decimal brasileira), " 1.31 ", "53,6 %". Devolver NaN
 * nesses casos fazia o marcador inteiro ser descartado e o dashboard ficar
 * vazio sem explicação.
 */
export function toNumber(raw) {
  if (raw === null || raw === undefined || raw === '') return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null

  const texto = String(raw).trim().replace(/\s/g, '')

  // Mantém só dígitos, separadores e sinal — descarta unidade colada ("53,6%")
  const limpo = texto.replace(/[^\d.,-]/g, '')

  if (!limpo) return null

  let normalizado = limpo

  if (limpo.includes(',') && limpo.includes('.')) {
    // "1.234,5" -> milhar com ponto e decimal com vírgula
    normalizado = limpo.replace(/\./g, '').replace(',', '.')
  } else if (limpo.includes(',')) {
    normalizado = limpo.replace(',', '.')
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(limpo)) {
    // "1.234" -> ponto como separador de milhar
    normalizado = limpo.replace(/\./g, '')
  }
  // Qualquer outro caso com ponto é decimal: "0.86" continua 0.86.

  const n = Number(normalizado)

  return Number.isFinite(n) ? n : null
}

export function getMarkerValue(markers = {}, marker) {
  const keys = [marker.key, ...(marker.aliases || [])]

  for (const key of keys) {
    const value = markers?.[key]

    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  return null
}

export function getMarkerStatus(marker, value) {
  if (!marker) return 'ok'

  const numberValue = toNumber(value)

  if (numberValue === null) return 'ok'

  if (marker.reverse) {
    if (numberValue <= marker.risk) return 'risco'
    if (numberValue <= marker.attention) return 'atencao'
    return 'ok'
  }

  if (numberValue >= marker.risk) return 'risco'
  if (numberValue >= marker.attention) return 'atencao'

  return 'ok'
}

/** Nível de risco do exame inteiro, derivado dos marcadores. */
export function getExamRiskLevel(markers = {}) {
  const estados = MARKERS
    .map(marker => getMarkerStatus(marker, getMarkerValue(markers, marker)))

  if (estados.includes('risco')) return 'high'
  if (estados.includes('atencao')) return 'attention'

  return 'normal'
}

/**
 * Variação do último ponto em relação ao anterior.
 * Devolve null quando só existe uma medição — é o que evita o "▲ 0,0%"
 * que hoje aparece em todos os cards.
 */
export function getMarkerChange(points = [], marker) {
  if (points.length < 2) return null

  const atual = points[points.length - 1].value
  const anterior = points[points.length - 2].value

  if (anterior === 0) return null

  const abs = atual - anterior
  const pct = (abs / Math.abs(anterior)) * 100
  const estavel = Math.abs(pct) < 1
  const melhorou = marker?.reverse ? abs > 0 : abs < 0

  return {
    abs,
    pct,
    trend: estavel ? 'estavel' : melhorou ? 'melhorou' : 'piorou',
  }
}

/**
 * Monta os dados do dashboard a partir dos exames crus da API.
 *
 * Cada marcador ganha `points` — pares { t, value, dateLabel } com o timestamp
 * real da coleta. Antes só existia `values`, um array filtrado que perdia a
 * associação com a data: se um marcador faltasse num exame do meio, o gráfico
 * desenhava os valores contra as datas erradas.
 *
 * `values` continua existindo para o SparklineChart, que não precisa de data.
 */
export function buildDashboardData(exams = []) {
  if (!exams.length) {
    return { summary: [], alerts: [], categories: [], examDates: [], exams: [], unknownKeys: [] }
  }

  const sorted = [...exams].sort(
    (a, b) => (parseExamDate(a.examDate)?.getTime() ?? 0) - (parseExamDate(b.examDate)?.getTime() ?? 0)
  )

  const examDates = sorted.map(exam => formatExamDate(exam.examDate))
  const categoriesMap = {}

  // Chaves que apareceram nos exames mas que o catálogo não reconhece.
  // Sem isso, um exame com nomes de campo diferentes some do dashboard
  // sem nenhuma explicação na tela.
  const conhecidas = new Set(MARKERS.flatMap(m => [m.key, ...(m.aliases || [])]))
  const unknownKeys = [...new Set(
    sorted.flatMap(exam => Object.keys(exam.markers || {}))
  )].filter(k => !conhecidas.has(k))

  MARKERS.forEach(marker => {
    const points = sorted
      .map(exam => {
        const value = toNumber(getMarkerValue(exam.markers, marker))

        if (value === null) return null

        const date = parseExamDate(exam.examDate)

        return {
          t: date ? date.getTime() : 0,
          value,
          dateLabel: formatExamDate(exam.examDate),
          examId: exam._id,
        }
      })
      .filter(Boolean)

    if (!points.length) return

    const last = points[points.length - 1].value
    const status = getMarkerStatus(marker, last)

    if (!categoriesMap[marker.category]) {
      categoriesMap[marker.category] = []
    }

    categoriesMap[marker.category].push({
      id: marker.id,
      key: marker.key,
      cat: marker.category,
      name: marker.name,
      unit: marker.unit,
      ref: marker.ref,
      reverse: !!marker.reverse,
      attention: marker.attention,
      risk: marker.risk,
      points,
      values: points.map(p => p.value),
      display: last,
      status,
      change: getMarkerChange(points, marker),
    })
  })

  const categories = CAT_ORDER
    .map(name => ({ name, markers: categoriesMap[name] || [] }))
    .filter(category => category.markers.length > 0)

  const todosMarcadores = categories.flatMap(category => category.markers)

  const summary = SUMMARY_KEYS
    .map(key => todosMarcadores.find(marker => marker.key === key))
    .filter(Boolean)
    .map(marker => ({
      name: marker.name,
      value: marker.display,
      unit: marker.unit,
      status: marker.status,
    }))

  const lastExam = sorted[sorted.length - 1]

  const generatedAlerts = todosMarcadores
    .filter(marker => marker.status === 'risco' || marker.status === 'atencao')
    .map(marker => ({
      level: marker.status,
      title: marker.status === 'risco'
        ? `${marker.name} em risco alto`
        : `${marker.name} em atenção`,
      desc: `${marker.name}: ${marker.display} ${marker.unit} no exame de ${formatExamDate(lastExam.examDate)}.`,
    }))

  const backendAlerts = (lastExam.alerts || []).map(alert => ({
    level: lastExam.riskLevel === 'high' ? 'risco' : 'atencao',
    title: alert,
    desc: `Alerta registrado no exame de ${formatExamDate(lastExam.examDate)}.`,
  }))

  return {
    summary,
    alerts: generatedAlerts.length ? generatedAlerts : backendAlerts,
    categories,
    examDates,
    exams: sorted,
    unknownKeys,
  }
}
