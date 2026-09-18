import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PatientDetail from '../screens/PatientDetail.jsx'
import MarkerModal from '../components/perfilDoUsuario/MarkerModal.jsx'
import { useClinical } from '../context/ClinicalContext.jsx'
import {
  getDoctorPatientById,
  getDoctorPatientExams,
  uploadDoctorPatientExamPdf,
  getDoctorPatientFollowup,
  createDoctorPatientNote,
  updateDoctorPatientNote,
  deleteDoctorPatientNote,
  toggleDoctorPatientRequestedExam,
  deleteDoctorPatientExam,
} from '../services/api'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

function formatPatient(patient, exams = []) {
  const name = patient.userId?.name || 'Paciente sem nome'
  const lastExam = exams.length
    ? [...exams].sort((a, b) => new Date(b.examDate) - new Date(a.examDate))[0]
    : null

  return {
    id: patient._id,
    name,
    initials: getInitials(name),
    age: patient.age || '-',
    compounds: patient.substances?.length
      ? patient.substances
      : ['Sem compostos informados'],
    lastExam: lastExam?.examDate || patient.lastExamDate || 'Sem exame',
    status: lastExam ? 'estavel' : 'ok',
    alerts: 0,
    raw: patient,
  }
}

function formatDateBR(dateString) {
  if (!dateString) return 'Sem data'

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) return dateString

  return date
    .toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .replace('.', '')
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
  if (!marker || value == null || value === '-') return 'ok'

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

function buildDashboardFromExams(exams, fallbackData) {
  if (!exams.length) {
    return {
      ...fallbackData,
      summary: [],
      alerts: [],
      categories: [],
      examDates: [],
    }
  }

  const sorted = [...exams].sort(
    (a, b) => new Date(a.examDate) - new Date(b.examDate)
  )

  const examDates = sorted.map(exam => formatDateBR(exam.examDate))
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
          desc: `${marker.name}: ${marker.display} ${marker.unit} no exame de ${formatDateBR(lastExam.examDate)}.`,
        })
      }
    })
  })

  const backendAlerts = (lastExam.alerts || []).map(alert => ({
    level: lastExam.riskLevel === 'high' ? 'risco' : 'atencao',
    title: alert,
    desc: `Alerta registrado no exame de ${formatDateBR(lastExam.examDate)}.`,
  }))

  return {
    ...fallbackData,
    summary,
    alerts: generatedAlerts.length ? generatedAlerts : backendAlerts,
    categories,
    examDates,
  }
}

function formatImportedExams(exams = []) {
  return [...exams]
    .sort((a, b) => new Date(b.examDate) - new Date(a.examDate))
    .map(exam => ({
      id: exam._id,
      name: exam.originalFileName || 'Exame importado',
      date: formatDateBR(exam.examDate),
      rawDate: exam.examDate,
      source: exam.source,
      riskLevel: exam.riskLevel,
      alerts: exam.alerts || [],
      markers: exam.markers || {},
    }))
}

function formatFollowup(followupResponse) {
  return {
    notes: followupResponse.notes || [],
    requestedExams: followupResponse.requestedExams || [],
  }
}

export default function PerfilAtletaMedico() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, today } = useClinical()

  const [marker, setMarker] = useState(null)
  const [patient, setPatient] = useState(null)
  const [dashboardData, setDashboardData] = useState(data)
  const [importedExams, setImportedExams] = useState([])
  const [followup, setFollowup] = useState({
    notes: [],
    requestedExams: [],
  })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregarPaciente() {
    try {
      setCarregando(true)
      setErro('')

      const patientResponse = await getDoctorPatientById(id)
      const examsResponse = await getDoctorPatientExams(id)
      const followupResponse = await getDoctorPatientFollowup(id)

      const exams = examsResponse.exams || []

      setPatient(formatPatient(patientResponse.patient, exams))
      setDashboardData(buildDashboardFromExams(exams, data))
      setImportedExams(formatImportedExams(exams))
      setFollowup(formatFollowup(followupResponse))
    } catch (error) {
      setErro(error.message || 'Erro ao carregar paciente.')
      setPatient(null)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarPaciente()
  }, [id, data])

  async function recarregarFollowup() {
    const followupResponse = await getDoctorPatientFollowup(id)
    setFollowup(formatFollowup(followupResponse))
  }

  async function recarregarExames() {
    const patientResponse = await getDoctorPatientById(id)
    const examsResponse = await getDoctorPatientExams(id)
    const exams = examsResponse.exams || []

    setPatient(formatPatient(patientResponse.patient, exams))
    setDashboardData(buildDashboardFromExams(exams, data))
    setImportedExams(formatImportedExams(exams))
  }

  if (carregando) {
    return (
      <div style={{ color: '#555', padding: 24, fontFamily: "'Manrope', sans-serif" }}>
        Carregando dashboard do paciente...
      </div>
    )
  }

  if (erro || !patient) {
    return (
      <div style={{ color: '#777', padding: 24, fontFamily: "'Manrope', sans-serif" }}>
        {erro || 'Paciente não encontrado.'}{' '}
        <button
          onClick={() => navigate('/medico')}
          style={{
            color: '#2fd6be',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Voltar para a lista
        </button>
      </div>
    )
  }

  return (
    <>
      <PatientDetail
        patient={patient}
        data={dashboardData}
        followup={followup}
        importedExams={importedExams}
        today={today}
        onBack={() => navigate('/medico')}
        onSelectMarker={setMarker}
        onAddNote={async (text) => {
          await createDoctorPatientNote(id, text)
          await recarregarFollowup()
        }}
        onUpdateNote={async (noteId, text) => {
          await updateDoctorPatientNote(noteId, text)
          await recarregarFollowup()
        }}
        onDeleteNote={async (noteId) => {
          await deleteDoctorPatientNote(noteId)
          await recarregarFollowup()
        }}
        onToggleExam={async (label) => {
          await toggleDoctorPatientRequestedExam(id, label)
          await recarregarFollowup()
        }}
        onUpload={async (file) => {
          await uploadDoctorPatientExamPdf(id, file)
          await recarregarExames()
        }}
        onDeleteExam={async (examId) => {
          await deleteDoctorPatientExam(id, examId)
          await recarregarExames()
        }}
      />

      {marker && (
        <MarkerModal
          marker={marker}
          examDates={dashboardData.examDates}
          onClose={() => setMarker(null)}
        />
      )}
    </>
  )
}