import React from 'react'
import MarkerChart from './MarkerChart.jsx'

/**
 * MarkerModal — gráfico expandido de um marcador, em sobreposição.
 *
 * O desenho em si mora no MarkerChart, que também é usado inline no dashboard.
 * Assim o gráfico grande e o do modal nunca divergem.
 */
export default function MarkerModal({ marker, onClose }) {
  if (!marker) return null

  const nPontos = marker.points?.length ?? marker.values?.length ?? 0

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Evolução de ${marker.name}`}
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
        animation: 'jc-fade .15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="jc-modal-anim"
        style={{
          background: '#ebebeb',
          border: '1px solid #d5d5d5',
          borderRadius: 18,
          width: 'min(700px,100%)',
          padding: '26px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          boxShadow: '0 30px 70px -30px rgba(0,0,0,.5)',
          color: '#0f0f0f',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '-.01em', color: '#0f0f0f' }}>{marker.name}</h2>
            <p style={{ margin: 0, fontSize: 12.5, color: '#656565' }}>
              {nPontos > 1 ? `Evolução em ${nPontos} coletas` : 'Uma única coleta registrada'} · Referência:{' '}
              <span style={{ color: '#0f0f0f', fontWeight: 600 }}>
                {marker.ref} {marker.unit}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="jc-close"
            aria-label="Fechar"
            style={{
              flex: 'none',
              width: 34,
              height: 34,
              borderRadius: 9,
              background: '#e0e0e0',
              border: '1px solid #d5d5d5',
              color: '#555555',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ background: '#f4f4f4', border: '1px solid #dcdcdc', borderRadius: 12, padding: '14px 10px 6px', height: 340 }}>
          <MarkerChart marker={marker} height={320} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, color: '#888888', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <i style={{ width: 9, height: 9, borderRadius: '50%', background: '#3fb950', display: 'inline-block' }} />
            Dentro da faixa
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <i style={{ width: 9, height: 9, borderRadius: '50%', background: '#e0a82e', display: 'inline-block' }} />
            Atenção
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <i style={{ width: 9, height: 9, borderRadius: '50%', background: '#f04747', display: 'inline-block' }} />
            Risco
          </span>
          <span style={{ color: '#888888', fontSize: 11 }}>Passe o mouse sobre os pontos</span>
        </div>
      </div>
    </div>
  )
}
