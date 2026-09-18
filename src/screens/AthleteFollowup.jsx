import React from 'react'
import {
  PageHeader,
  SectionLabel,
  NoteCard,
} from '../components/perfilDoUsuario/Primitives.jsx'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function AthleteFollowup({
  doctor,
  loadingDoctor,
  requestedList,
  notesHistory,
}) {
  const empty = (text) => (
    <div
      style={{
        background: '#ebebeb',
        border: '1px solid #d5d5d5',
        borderRadius: 11,
        padding: 16,
        textAlign: 'center',
        fontSize: 12.5,
        color: '#888',
      }}
    >
      {text}
    </div>
  )

  const doctorInitials = doctor?.name ? getInitials(doctor.name) : '--'

  return (
    <div
      className="jc-fade"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        maxWidth: 820,
      }}
    >
      <PageHeader
        title="Acompanhamento Médico"
        sub="Anotações e solicitações do seu médico responsável"
      />

      <section
        style={{
          background: '#ebebeb',
          border: '1px solid #d5d5d5',
          borderRadius: 14,
          padding: '20px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        {loadingDoctor ? (
          <div style={{ fontSize: 13, color: '#777' }}>
            Carregando médico responsável...
          </div>
        ) : doctor ? (
          <>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: 'rgba(47,214,190,.14)',
                color: '#2fd6be',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 700,
                flex: 'none',
              }}
            >
              {doctorInitials}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#0f0f0f',
                }}
              >
                {doctor.name}
              </span>

              <span
                style={{
                  fontSize: 12,
                  color: '#777',
                }}
              >
                {doctor.specialty || 'Especialidade não informada'}
                {doctor.crm ? ` · CRM ${doctor.crm}` : ' · CRM não informado'}
              </span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: '#777' }}>
            Nenhum médico vinculado ainda.
          </div>
        )}
      </section>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <SectionLabel style={{ margin: 0 }}>
          Próximos exames solicitados
        </SectionLabel>

        {requestedList.length > 0
          ? requestedList.map((r, i) => (
              <div
                key={i}
                style={{
                  background: '#ebebeb',
                  border: '1px solid #d5d5d5',
                  borderRadius: 11,
                  padding: '13px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: '#2fd6be',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#dff9f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>

                <span
                  style={{
                    flex: 1,
                    fontSize: 13.5,
                    color: '#171717',
                  }}
                >
                  {r.label}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color: '#888',
                  }}
                >
                  Solicitado em {r.date}
                </span>
              </div>
            ))
          : empty('Nenhum exame solicitado no momento.')}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <SectionLabel style={{ margin: 0 }}>
          Anotações do seu médico
        </SectionLabel>

        {notesHistory.length > 0
          ? notesHistory.map((n, i) => <NoteCard key={i} note={n} />)
          : empty('Seu médico ainda não registrou anotações.')}
      </div>
    </div>
  )
}