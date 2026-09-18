import { useEffect, useState } from 'react'
import { getMyExams, getMyPatientProfile } from '../services/api'
import Dashboard from '../components/perfilDoUsuario/Dashboard.jsx'
import MarkerModal from '../components/perfilDoUsuario/MarkerModal.jsx'
import '../style/perfil.css'

const PERFIL_VAZIO = {
    nome: 'Paciente',
    idade: '',
    sexo: '',
    tempoUso: '',
    dosagem: '',
    esteroides: [],
    cicloAtivo: '',
    ultimoExame: 'Não informado',
}

const MARKERS = [
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

function formatarDosagem(dosagem) {
    if (!dosagem) return ''
    return `${dosagem}mg/sem`
}

function formatarTempoUso(tempoUso) {
    if (!tempoUso) return ''
    return tempoUso
}

function formatarStatusCiclo(cicloAtivo) {
    if (cicloAtivo === 'sim') return 'Ciclo ativo'
    if (cicloAtivo === 'off') return 'Em off'
    if (cicloAtivo === 'nunca') return 'Nunca usou'
    return ''
}

function formatarDataExame(data) {
    if (!data) return 'Não informado'

    const date = new Date(data)

    if (Number.isNaN(date.getTime())) return data

    return date
        .toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        .replace('.', '')
}

function getMarkerValue(markers = {}, marker) {
    const keys = [marker.key, ...(marker.aliases || [])]

    for (const key of keys) {
        const value = markers[key]

        if (value !== undefined && value !== null && value !== '') {
            return value
        }
    }

    return null
}

function getMarkerStatus(marker, value) {
    if (!marker || value === null || value === undefined || value === '-') {
        return 'ok'
    }

    const numberValue = Number(value)

    if (Number.isNaN(numberValue)) return 'ok'

    if (marker.reverse) {
        if (numberValue <= marker.risk) return 'risco'
        if (numberValue <= marker.attention) return 'atencao'
        return 'ok'
    }

    if (numberValue >= marker.risk) return 'risco'
    if (numberValue >= marker.attention) return 'atencao'

    return 'ok'
}

function montarDashboardPorExames(exames = []) {
    if (!exames.length) {
        return {
            summary: [],
            alerts: [],
            categories: [],
            examDates: [],
        }
    }

    const sorted = [...exames].sort(
        (a, b) => new Date(a.examDate) - new Date(b.examDate)
    )

    const examDates = sorted.map(exam => formatarDataExame(exam.examDate))
    const categoriesMap = {}

    MARKERS.forEach(marker => {
        const values = sorted
            .map(exam => getMarkerValue(exam.markers, marker))
            .filter(value => value !== undefined && value !== null && value !== '')

        if (!values.length) return

        const last = values[values.length - 1]
        const status = getMarkerStatus(marker, last)

        if (!categoriesMap[marker.category]) {
            categoriesMap[marker.category] = []
        }

        categoriesMap[marker.category].push({
            id: marker.id,
            name: marker.name,
            unit: marker.unit,
            ref: marker.ref,
            values,
            status,
            display: last,
        })
    })

    const categories = Object.entries(categoriesMap).map(([name, markers]) => ({
        name,
        markers,
    }))

    const lastExam = sorted[sorted.length - 1]
    const summaryKeys = ['ldl', 'hdl', 'creatinine', 'hematocrit']

    const summary = summaryKeys
        .map(key => MARKERS.find(marker => marker.key === key))
        .filter(Boolean)
        .map(marker => {
            const value = getMarkerValue(lastExam.markers, marker)

            return {
                name: marker.name,
                value: value ?? '-',
                unit: marker.unit,
                status: getMarkerStatus(marker, value),
            }
        })
        .filter(item => item.value !== '-')

    const generatedAlerts = []

    categories.forEach(category => {
        category.markers.forEach(marker => {
            if (marker.status === 'risco' || marker.status === 'atencao') {
                generatedAlerts.push({
                    level: marker.status,
                    title: marker.status === 'risco'
                        ? `${marker.name} em risco alto`
                        : `${marker.name} em atenção`,
                    desc: `${marker.name}: ${marker.display} ${marker.unit} no último exame.`,
                })
            }
        })
    })

    const backendAlerts = (lastExam.alerts || []).map(alert => ({
        level: lastExam.riskLevel === 'high' ? 'risco' : 'atencao',
        title: alert,
        desc: `Alerta registrado no exame de ${formatarDataExame(lastExam.examDate)}.`,
    }))

    return {
        summary,
        alerts: generatedAlerts.length ? generatedAlerts : backendAlerts,
        categories,
        examDates,
    }
}

export default function PerfilAtleta() {
    const [perfilPaciente, setPerfilPaciente] = useState(null)
    const [exames, setExames] = useState([])
    const [carregando, setCarregando] = useState(true)
    const [marcador, setMarcador] = useState(null)

    useEffect(() => {
        async function carregarDadosDashboard() {
            try {
                const [perfilResponse, examesResponse] = await Promise.all([
                    getMyPatientProfile(),
                    getMyExams(),
                ])

                setPerfilPaciente(perfilResponse.patient)
                setExames(examesResponse.exams || [])
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error)
            } finally {
                setCarregando(false)
            }
        }

        carregarDadosDashboard()
    }, [])

    const dashboardData = montarDashboardPorExames(exames)

    const perfilDinamico = {
        ...PERFIL_VAZIO,
        nome: perfilPaciente?.userId?.name || PERFIL_VAZIO.nome,
        idade: perfilPaciente?.age || PERFIL_VAZIO.idade,
        sexo:
            perfilPaciente?.biologicalSex === 'male'
                ? 'masculino'
                : perfilPaciente?.biologicalSex === 'female'
                    ? 'feminino'
                    : PERFIL_VAZIO.sexo,
        tempoUso: formatarTempoUso(perfilPaciente?.cycleTime),
        dosagem: formatarDosagem(perfilPaciente?.weeklyDosage),
        esteroides: perfilPaciente?.substances?.length
            ? perfilPaciente.substances
            : [],
        cicloAtivo: perfilPaciente?.cycleStatus || '',
        ultimoExame: perfilPaciente?.lastExamDate
            ? formatarDataExame(perfilPaciente.lastExamDate)
            : exames[0]?.examDate
                ? formatarDataExame(exames[0].examDate)
                : 'Não informado',
    }

    const primeiroNome = perfilDinamico.nome.split(' ')[0]
    const statusCiclo = formatarStatusCiclo(perfilDinamico.cicloAtivo)

    if (carregando) {
        return (
            <div className="main">
                <div className="content">
                    <p className="page-sub">Carregando dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="main">
            <div className="content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Olá, {primeiroNome}</h1>

                        <p className="page-sub">
                            {perfilDinamico.idade && <>{perfilDinamico.idade} anos</>}
                            {statusCiclo && <> · {statusCiclo}</>}
                            {perfilDinamico.cicloAtivo !== 'nunca' && perfilDinamico.tempoUso && (
                                <> há {perfilDinamico.tempoUso}</>
                            )}
                            {perfilDinamico.cicloAtivo !== 'nunca' && perfilDinamico.dosagem && (
                                <> · {perfilDinamico.dosagem}</>
                            )}
                            <> · Último exame: {perfilDinamico.ultimoExame}</>
                        </p>
                    </div>
                </div>

                <Dashboard
                    accent="#e6a817"
                    hideHeader
                    summary={dashboardData.summary}
                    alerts={dashboardData.alerts}
                    categories={dashboardData.categories}
                    examDates={dashboardData.examDates}
                    onSelect={setMarcador}
                />

                {exames.length === 0 && (
                    <div
                        style={{
                            marginTop: 18,
                            background: '#ebebeb',
                            border: '1px solid #d5d5d5',
                            borderRadius: 12,
                            padding: 18,
                            color: '#777',
                            fontSize: 13,
                        }}
                    >
                        Nenhum exame importado ainda. Quando seu médico importar um exame, os gráficos aparecerão aqui.
                    </div>
                )}
            </div>

            {marcador && (
                <MarkerModal
                    marker={marcador}
                    examDates={dashboardData.examDates}
                    onClose={() => setMarcador(null)}
                />
            )}
        </div>
    )
}