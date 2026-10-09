import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PatientDetail from '../screens/PatientDetail.jsx'
import MarkerModal from '../components/perfilDoUsuario/MarkerModal.jsx'
import { buildDashboardData } from '../data/markers.js'
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

// O catálogo de marcadores e a montagem da série agora vivem em
// src/data/markers.js — antes esta lista estava duplicada em três arquivos.

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
      setDashboardData(exams.length ? buildDashboardData(exams) : { ...data, summary: [], alerts: [], categories: [], examDates: [] })
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
    setDashboardData(exams.length ? buildDashboardData(exams) : { ...data, summary: [], alerts: [], categories: [], examDates: [] })
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
          onClose={() => setMarker(null)}
        />
      )}
    </>
  )
}