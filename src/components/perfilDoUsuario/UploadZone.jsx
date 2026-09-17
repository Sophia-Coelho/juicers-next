import React, { useState } from 'react'

export default function UploadZone({
  accent = '#e6a817',
  label = 'Importar exame (PDF)',
  onUpload,
}) {
  const [drag, setDrag] = useState(false)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [success, setSuccess] = useState('')

  const handleFile = async (file) => {
    if (!file) return

    if (file.type !== 'application/pdf') {
      setErro('Selecione um arquivo PDF.')
      return
    }

    try {
      setLoading(true)
      setErro('')
      setSuccess('')
      setFileName(file.name)

      if (onUpload) {
        await onUpload(file)
      }

      setSuccess('PDF importado com sucesso')
    } catch (error) {
      setErro(error.message || 'Erro ao importar PDF.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!drag) setDrag(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setDrag(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)

        const file = e.dataTransfer.files[0]
        handleFile(file)
      }}
      style={{
        border: `2px dashed ${drag ? accent : '#ccc'}`,
        background: drag ? 'rgba(0, 0, 0, .025)' : '#ebebeb',
        borderRadius: 14,
        padding: '30px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 9,
        textAlign: 'center',
        transition: 'border-color .15s ease, background .15s ease',
      }}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke={accent}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: 2 }}
      >
        <path d="M12 16V4" />
        <path d="M8 8l4-4 4 4" />
        <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
      </svg>

      <p style={{ margin: 0, fontSize: 14, fontWeight: 650, color: '#171717' }}>
        {label}
      </p>

      <p style={{ margin: 0, fontSize: 12.5, color: '#818181' }}>
        Arraste o arquivo PDF aqui, ou
      </p>

      <label
        style={{
          marginTop: 4,
          display: 'inline-flex',
          alignItems: 'center',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 12.5,
          fontWeight: 650,
          color: accent,
          border: `1px solid ${accent}`,
          background: 'transparent',
          borderRadius: 8,
          padding: '7px 16px',
          opacity: loading ? 0.65 : 1,
        }}
      >
        {loading ? 'Importando...' : 'Selecionar arquivo'}

        <input
          type="file"
          accept="application/pdf"
          disabled={loading}
          onChange={(e) => handleFile(e.target.files[0])}
          style={{ display: 'none' }}
        />
      </label>

      {fileName && (
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 12,
            color: '#303030',
          }}
        >
          <span>{fileName}</span>
        </div>
      )}

      {success && (
        <div style={{ fontSize: 12, color: '#3fb950', marginTop: 4 }}>
          {success}
        </div>
      )}

      {erro && (
        <div style={{ fontSize: 12, color: '#f04747', marginTop: 4 }}>
          {erro}
        </div>
      )}
    </div>
  )
}