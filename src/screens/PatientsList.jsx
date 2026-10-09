import React from 'react'
import { PageHeader } from '../components/perfilDoUsuario/Primitives.jsx'
import { STATUS } from '../theme.js'
import '../style/patientList.css'

export default function PatientsList({
  greeting,
  patients,
  search,
  onSearch,
  onOpenPatient,
  onInvite,
  onRemovePatient,
  removingId,
}) {
  const q = search.trim().toLowerCase()

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(q)
  )

  const total = patients.length

  const risco = patients.reduce(
    (sum, patient) => sum + (patient.highAlerts || 0),
    0
  )

  const atencao = patients.reduce(
    (sum, patient) => sum + (patient.attentionAlerts || 0),
    0
  )

  const statCard = (label, value, color) => (
    <div className="jc-stat-card">
      <span className="jc-stat-label">{label}</span>
      <span className="jc-stat-value" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  )

  return (
    <div className="jc-fade jc-page">
      <div className="jc-header-row">
        <PageHeader
          title={greeting}
          sub="Gerencie seus pacientes e acompanhe os indicadores de saúde"
        />

        <button onClick={onInvite} className="jc-btn-teal">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dff9f6"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Adicionar paciente
        </button>
      </div>

      <div className="jc-stats">
        {statCard('Total de pacientes', total)}
        {statCard('Alertas de risco alto', risco, '#f04747')}
        {statCard('Alertas em atenção', atencao, '#e0a82e')}
      </div>

      <div className="jc-search-bar">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#888"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.2-4.2" />
        </svg>

        <input
          value={search}
          onChange={onSearch}
          placeholder="Buscar paciente por nome..."
          className="jc-search-input"
        />
      </div>

      <div className="jc-patient-list">
        {filtered.length === 0 && (
          <div className="jc-patient-empty">
            Nenhum paciente encontrado.
          </div>
        )}

        {filtered.map((p) => {
          const safeStatus = p.status || 'ok'
          const alertColor =
            p.alerts === 0
              ? '#a5a5a5'
              : safeStatus === 'risco'
                ? '#f04747'
                : '#e0a82e'

          return (
            <div key={p.id} className="jc-patient-row">
              <div className="jc-patient-avatar">{p.initials}</div>

              <div className="jc-patient-info">
                <div className="jc-patient-name-row">
                  <span className="jc-patient-name">{p.name}</span>
                  <span className="jc-patient-age">{p.age} anos</span>
                </div>

                <span className="jc-patient-compounds">
                  {p.compounds.join('  ·  ')}
                </span>
              </div>

              <div className="jc-patient-exam">
                <span className="jc-patient-exam-label">Último exame</span>
                <span className="jc-patient-exam-value">{p.lastExam}</span>
              </div>

              <span
                className="jc-status-badge"
                style={{
                  color: STATUS.color[safeStatus],
                  background: STATUS.bg[safeStatus],
                  borderColor: STATUS.border[safeStatus],
                }}
              >
                {STATUS.label[safeStatus]}
              </span>

              <div className="jc-patient-alert">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={alertColor}
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>

                <span className="jc-patient-alert-count" style={{ color: alertColor }}>
                  {p.alerts}
                </span>
              </div>

              <div className="jc-patient-actions">
                <button
                  type="button"
                  onClick={() => onOpenPatient(p)}
                  className="jc-btn-soft-teal"
                  disabled={removingId === p.id}
                >
                  Ver dashboard
                </button>
                {onRemovePatient && <button
                  type="button"
                  onClick={() => onRemovePatient(p)}
                  className="jc-btn-remove-patient"
                  disabled={Boolean(removingId)}
                  aria-label={`Excluir ${p.name} da lista de atletas`}
                >
                  {removingId === p.id ? 'Removendo...' : 'Excluir da lista'}
                </button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
