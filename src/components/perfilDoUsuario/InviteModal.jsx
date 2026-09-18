import React, { useState } from 'react'
import { createDoctorInvite } from '../../services/api'

export default function InviteModal({ onClose, onToast }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [link, setLink] = useState('')
  const [carregando, setCarregando] = useState(false)

  const send = async () => {
    const patientName = nome.trim()
    const patientEmail = email.trim()

    if (!patientName) {
      onToast && onToast('Informe o nome do paciente')
      return
    }

    if (!patientEmail) {
      onToast && onToast('Informe o e-mail do paciente')
      return
    }

    try {
      setCarregando(true)

      const data = await createDoctorInvite({
        patientName,
        patientEmail,
      })

      const token =
        data?.invite?.token ||
        data?.token ||
        ''

      const inviteLink =
        data?.invite?.inviteLink ||
        data?.inviteLink ||
        (token ? `${window.location.origin}/cadastro/${token}` : '')

      if (!inviteLink) {
        onToast && onToast('Convite criado, mas o link não veio na resposta.')
        return
      }

      setLink(inviteLink)
      onToast && onToast('Convite criado com sucesso')
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
        onClick={(e) => e.stopPropagation()}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              Adicionar paciente
            </h2>

            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: '#777' }}>
              Gere um convite para o paciente criar a conta.
            </p>
          </div>

          <button
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
            <label style={labelStyle}>Nome do paciente</label>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: João Mendes"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>E-mail</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="paciente@email.com"
              style={inputStyle}
            />
          </div>

          <button
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
            {carregando ? 'Criando convite...' : 'Enviar convite'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#d8d8d8' }} />

          <span
            style={{
              fontSize: 11,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            link gerado
          </span>

          <div style={{ flex: 1, height: 1, background: '#d8d8d8' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#f0f0f0',
              border: '1px solid #d5d5d5',
              borderRadius: 10,
              padding: '4px 4px 4px 13px',
            }}
          >
            <span
              title={link}
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 12.5,
                color: '#424242',
                fontFamily: "'Space Grotesk', monospace",
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {link || 'Nenhum link gerado ainda'}
            </span>

            <button
              onClick={copy}
              style={{
                background: 'rgba(47,214,190,.12)',
                border: '1px solid rgba(47,214,190,.3)',
                color: '#2fd6be',
                fontSize: 12,
                fontWeight: 650,
                borderRadius: 7,
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              Copiar
            </button>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 11.5,
              color: '#888',
              lineHeight: 1.45,
            }}
          >
            O paciente completa o cadastro pelo link e aparece automaticamente na sua lista.
          </p>
        </div>
      </div>
    </div>
  )
}