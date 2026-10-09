import React, { useState } from 'react'
import { createDoctorInvite } from '../../services/api'

const isGmailAddress = value => /^[^\s@]+@gmail\.com$/i.test(value.trim())

export default function InviteModal({ onClose, onToast }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [link, setLink] = useState('')
  const [emailEnviado, setEmailEnviado] = useState(null)
  const [carregando, setCarregando] = useState(false)

  const send = async () => {
    const patientName = nome.trim()
    const patientEmail = email.trim().toLowerCase()

    if (!patientName) {
      onToast && onToast('Informe o nome do paciente')
      return
    }

    if (!isGmailAddress(patientEmail)) {
      onToast && onToast('Informe um endereço válido terminado em @gmail.com')
      return
    }

    try {
      setCarregando(true)
      setEmailEnviado(null)

      const data = await createDoctorInvite({ patientName, patientEmail })
      const token = data?.invite?.token || data?.token || ''
      const inviteLink =
        data?.invite?.inviteLink ||
        data?.inviteLink ||
        (token ? `${window.location.origin}/cadastro/${token}` : '')

      if (!inviteLink) {
        onToast && onToast('O convite foi criado, mas o link não veio na resposta.')
        return
      }

      setLink(inviteLink)
      setEmailEnviado(Boolean(data.emailSent))
      onToast && onToast(
        data.emailSent
          ? `Convite enviado para ${patientEmail}`
          : 'Link criado, mas o e-mail não foi enviado. Copie o link para compartilhar.'
      )
    } catch (error) {
      onToast && onToast(error.message || 'Erro ao criar convite')
    } finally {
      setCarregando(false)
    }
  }

  const copy = async () => {
    if (!link) {
      onToast && onToast('Crie o convite antes de copiar o link')
      return
    }

    try {
      await navigator.clipboard.writeText(link)
      onToast && onToast('Link de cadastro copiado')
    } catch {
      onToast && onToast('Não foi possível copiar o link')
    }
  }

  const inputStyle = {
    background: '#f0f0f0',
    border: '1px solid #d5d5d5',
    borderRadius: 9,
    padding: '11px 13px',
    color: '#0f0f0f',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  }

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: '#656565',
    textTransform: 'uppercase',
    letterSpacing: '.04em',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.62)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#e9e9e9',
          border: '1px solid #d5d5d5',
          borderRadius: 18,
          width: 'min(460px,100%)',
          padding: '26px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          boxShadow: '0 30px 70px -30px rgba(0,0,0,.8)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Adicionar paciente</h2>
            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: '#777' }}>
              Gere um link e envie o convite para o Gmail do paciente.
            </p>
          </div>

          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: '#e0e0e0',
              border: '1px solid #d5d5d5',
              color: '#555',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="invite-patient-name" style={labelStyle}>Nome do paciente</label>
            <input
              id="invite-patient-name"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex.: João Mendes"
              autoComplete="name"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="invite-patient-email" style={labelStyle}>E-mail Gmail</label>
            <input
              id="invite-patient-email"
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                setEmailEnviado(null)
              }}
              placeholder="paciente@gmail.com"
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <button
            type="button"
            onClick={send}
            disabled={carregando}
            style={{
              background: '#2fd6be',
              color: '#06201d',
              border: 'none',
              fontSize: 13.5,
              fontWeight: 700,
              borderRadius: 10,
              padding: 12,
              cursor: carregando ? 'not-allowed' : 'pointer',
              opacity: carregando ? 0.7 : 1,
            }}
          >
            {carregando ? 'Enviando convite...' : 'Enviar convite'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#d8d8d8' }} />
          <span style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            link gerado
          </span>
          <div style={{ flex: 1, height: 1, background: '#d8d8d8' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, background: '#f0f0f0',
            border: '1px solid #d5d5d5', borderRadius: 10, padding: '4px 4px 4px 13px',
          }}>
            <span
              title={link}
              style={{
                flex: 1, minWidth: 0, fontSize: 12.5, color: '#424242',
                fontFamily: "'Space Grotesk', monospace", overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {link || 'Nenhum link gerado ainda'}
            </span>
            <button
              type="button"
              onClick={copy}
              style={{
                background: 'rgba(47,214,190,.12)', border: '1px solid rgba(47,214,190,.3)',
                color: '#2fd6be', fontSize: 12, fontWeight: 650, borderRadius: 7,
                padding: '8px 12px', cursor: 'pointer',
              }}
            >
              Copiar
            </button>
          </div>

          <p aria-live="polite" style={{ margin: 0, fontSize: 11.5, color: '#666', lineHeight: 1.45 }}>
            {emailEnviado === true
              ? `E-mail enviado para ${email.trim().toLowerCase()}. Você também pode compartilhar o link.`
              : emailEnviado === false
                ? 'O link foi criado, mas o e-mail não foi enviado. Compartilhe o link manualmente.'
                : 'Depois de gerar, o status do envio por e-mail e o link aparecerão aqui.'}
          </p>
        </div>
      </div>
    </div>
  )
}