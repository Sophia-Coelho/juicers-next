import React from 'react';

const LogoMark = ({ size = 22 }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <span style={{ width: size, height: size, borderRadius: '50%', background: '#e6a817' }} />
    <span style={{ width: size, height: size, borderRadius: '50%', background: '#2fd6be', marginLeft: -(size * 0.45) }} />
  </div>
);

function Card({ accent, title, desc, icon, onClick, variant }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={`jc-select-card ${variant}`}
      style={{
        width: 308,
        background: '#ebebeb',
        border: '1px solid #d5d5d5',
        borderRadius: 18,
        padding: 30,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div style={{ width: 54, height: 54, borderRadius: 15, background: `${accent}21`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f0f0f', letterSpacing: '-.01em' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 13, color: '#777', lineHeight: 1.5 }}>{desc}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 650, color: accent }}>
        Entrar <span style={{ fontSize: 15 }}>→</span>
      </div>
    </div>
  );
}

/** ProfileSelection — tela inicial de escolha de perfil (sem login). */
export default function ProfileSelection({ onChoose }) {
  return (
    <div className="jc-fade-slow" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 46, padding: 40 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <LogoMark />
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 36, fontWeight: 700, letterSpacing: '-.025em', color: '#0b0b0b' }}>Juicers</span>
        </div>
        <p style={{ margin: 0, fontSize: 14.5, color: '#757575', letterSpacing: '.01em' }}>
          Monitoramento de saúde para atletas, com acompanhamento médico
        </p>
      </div>

      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Card
          variant="athlete"
          accent="#e6a817"
          title="Sou Atleta"
          desc="Acompanhe seus exames e marcadores de saúde em tempo real."
          onClick={() => onChoose('athlete')}
          icon={
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e6a817" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.6" />
              <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
            </svg>
          }
        />
        <Card
          variant="doctor"
          accent="#2fd6be"
          title="Sou Médico"
          desc="Gerencie seus pacientes e acompanhe os indicadores clínicos."
          onClick={() => onChoose('doctor')}
          icon={
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2fd6be" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l2.4 7 4-14 2.4 7H21" />
            </svg>
          }
        />
      </div>

      <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>Demonstração · nenhum dado real é coletado ou armazenado</p>
    </div>
  );
}
