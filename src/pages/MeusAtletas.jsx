import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PatientsList from '../screens/PatientsList.jsx'
import InviteModal from '../components/perfilDoUsuario/InviteModal.jsx'
import Toast from '../components/perfilDoUsuario/Toast.jsx'
import { getDoctorPatients, getDoctorPatientExams, removeDoctorPatient } from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'
import '../style/meusAtletas.css'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

function formatDate(dateString) {
  if (!dateString) return 'Sem exame'

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return dateString
}

// Compostos podem vir como string[] (formato antigo) ou como
// {name, weeklyDosage}[] (formato atual, com dosagem por item).
function formatCompounds(substances = []) {
  if (!substances.length) return ['Sem compostos informados']

  return substances.map(s => {
    if (typeof s === 'string') return s

    const nome = s.name || s.nome || 'Composto'
    const dosagem = s.weeklyDosage ?? s.dosagem

    return dosagem ? `${nome} · ${dosagem}mg/sem` : nome
  })
}

const MARKER_RULES = {
  hdl: {
    reverse: true,
    attention: 40,
    risk: 30,
  },
  ldl: {
    attention: 130,
    risk: 190,
  },
  nonHdl: {
    attention: 130,
    risk: 160,
  },
  vldl: {
    attention: 30,
    risk: 40,
  },
  triglycerides: {
    attention: 150,
    risk: 200,
  },
  glucose: {
    attention: 100,
    risk: 126,
  },
  hba1c: {
    attention: 5.7,
    risk: 6.5,
  },
  creatinine: {
    attention: 1.3,
    risk: 1.6,
  },
  hemoglobin: {
    attention: 17.8,
    risk: 18.5,
  },
  hematocrit: {
    attention: 52.4,
    risk: 55,
  },
  erythrocytes: {
    attention: 6.11,
    risk: 6.5,
  },
  leukocytes: {
    attention: 11.11,
    risk: 13,
  },
  platelets: {
    attention: 425,
    risk: 500,
  },
  vitaminD: {
    reverse: true,
    attention: 20,
    risk: 10,
  },
  vitaminB12: {
    reverse: true,
    attention: 187,
    risk: 130,
  },
  ferritin: {
    attention: 275,
    risk: 400,
  },
  iron: {
    attention: 175,
    risk: 220,
  },
}

function getMarkerStatus(key, value) {
  const rule = MARKER_RULES[key]

  if (!rule || value === undefined || value === null) {
    return 'ok'
  }

  const numberValue = Number(value)

  if (Number.isNaN(numberValue)) {
    return 'ok'
  }

  if (rule.reverse) {
    if (numberValue <= rule.risk) return 'risco'
    if (numberValue <= rule.attention) return 'atencao'
    return 'ok'
  }

  if (numberValue >= rule.risk) return 'risco'
  if (numberValue >= rule.attention) return 'atencao'

  return 'ok'
}

function countAlertsFromExams(exams = []) {
  let highAlerts = 0
  let attentionAlerts = 0

  exams.forEach((exam) => {
    const markers = exam.markers || {}

    Object.entries(markers).forEach(([key, value]) => {
      const status = getMarkerStatus(key, value)

      if (status === 'risco') {
        highAlerts += 1
      }

      if (status === 'atencao') {
        attentionAlerts += 1
      }
    })
  })

  return {
    highAlerts,
    attentionAlerts,
    totalAlerts: highAlerts + attentionAlerts,
  }
}

function getPatientStatusFromExams(exams = []) {
  if (!exams.length) {
    return {
      status: 'ok',
      alerts: 0,
      highAlerts: 0,
      attentionAlerts: 0,
      lastExamDate: null,
    }
  }

  const sorted = [...exams].sort(
    (a, b) => new Date(b.examDate) - new Date(a.examDate)
  )

  const lastExam = sorted[0]
  const alertInfo = countAlertsFromExams(sorted)

  if (alertInfo.highAlerts > 0) {
    return {
      status: 'risco',
      alerts: alertInfo.totalAlerts,
      highAlerts: alertInfo.highAlerts,
      attentionAlerts: alertInfo.attentionAlerts,
      lastExamDate: lastExam.examDate,
    }
  }

  if (alertInfo.attentionAlerts > 0) {
    return {
      status: 'atencao',
      alerts: alertInfo.totalAlerts,
      highAlerts: alertInfo.highAlerts,
      attentionAlerts: alertInfo.attentionAlerts,
      lastExamDate: lastExam.examDate,
    }
  }

  return {
    status: 'ok',
    alerts: 0,
    highAlerts: 0,
    attentionAlerts: 0,
    lastExamDate: lastExam.examDate,
  }
}

function formatPatient(patient, exams = []) {
  const name = patient.userId?.name || 'Paciente sem nome'
  const examInfo = getPatientStatusFromExams(exams)

  return {
    id: patient._id,
    name,
    initials: getInitials(name),
    age: patient.age || '-',
    compounds: formatCompounds(patient.substances),
    lastExam: formatDate(examInfo.lastExamDate || patient.lastExamDate),
    status: examInfo.status,
    alerts: examInfo.alerts,
    highAlerts: examInfo.highAlerts,
    attentionAlerts: examInfo.attentionAlerts,
    raw: patient,
    exams,
  }
}

function sortPatientsByRisk(patients = []) {
  const priority = {
    risco: 1,
    atencao: 2,
    ok: 3,
    estavel: 3,
  }

  return [...patients].sort((a, b) => {
    const priorityA = priority[a.status] || 99
    const priorityB = priority[b.status] || 99

    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    return a.name.localeCompare(b.name)
  })
}

export default function MeusAtletas() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [invite, setInvite] = useState(false)
  const [toast, setToast] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  const [removeError, setRemoveError] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => setToast(null), 2400)
  }

  async function carregarPacientes() {
    try {
      setCarregando(true)

      const data = await getDoctorPatients()

      const pacientesFormatados = await Promise.all(
        data.patients.map(async (patient) => {
          try {
            const examsResponse = await getDoctorPatientExams(patient._id)
            return formatPatient(patient, examsResponse.exams || [])
          } catch {
            return formatPatient(patient, [])
          }
        })
      )

      setPatients(sortPatientsByRisk(pacientesFormatados))
    } catch (error) {
      showToast(error.message || 'Erro ao carregar pacientes.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarPacientes()
  }, [])

  async function removerAtleta(patient) {
    if (removingId) return
    const confirmed = window.confirm(
      `Excluir ${patient.name} da sua lista de atletas?\n\nVocê encerrará o vínculo e deixará de acessar os dados desse atleta. A conta e os exames dele serão preservados.`
    )
    if (!confirmed) return

    setRemovingId(patient.id)
    setRemoveError('')
    try {
      await removeDoctorPatient(patient.id)
      setPatients(current => current.filter(item => item.id !== patient.id))
      showToast('Atleta removido da sua lista.')
    } catch (error) {
      setRemoveError(error.message || 'Não foi possível remover o atleta. Tente novamente.')
    } finally {
      setRemovingId(null)
    }
  }

  if (carregando) {
    return (
      <div className="ma-loading">
        Carregando pacientes...
      </div>
    )
  }

  return (
    <>
      {removeError && <p role="alert" className="ma-remove-error">{removeError}</p>}
      <PatientsList
        greeting={`Olá, ${usuario?.name || 'Doutor(a)'}`}
        patients={patients}
        search={search}
        onSearch={(e) => setSearch(e.target.value)}
        onOpenPatient={(p) => navigate(`/medico/atleta/${p.id}`)}
        onInvite={() => setInvite(true)}
        onRemovePatient={removerAtleta}
        removingId={removingId}
      />

      {invite && (
        <InviteModal
          onClose={() => setInvite(false)}
          onSend={({ email }) => {
            setInvite(false)
            showToast('Convite criado para ' + email)
            carregarPacientes()
          }}
          onToast={showToast}
        />
      )}

      <Toast message={toast} />
    </>
  )
}
