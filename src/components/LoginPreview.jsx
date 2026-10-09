/**
 * LoginPreview — ilustração estática do painel de evolução, usada só na
 * tela de login para vender o produto. Valores fixos (não vem de API).
 */

function IconBars() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M3 13V8M8 13V3M13 13V9.5" />
    </svg>
  )
}
function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6.5a4 4 0 0 1 8 0c0 3 1 4 1 4H3s1-1 1-4Z" />
      <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" />
    </svg>
  )
}
function IconDoc() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 1.5h5l3 3v10H4z" />
      <path d="M9 1.5v3h3" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.3 13.5 3.3v4c0 3.4-2.3 6.1-5.5 7.4-3.2-1.3-5.5-4-5.5-7.4v-4Z" />
      <path d="M5.7 8.1 7.3 9.7l3-3.4" />
    </svg>
  )
}
function IconAlert() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2 15 14H1Z" />
      <path d="M8 6.3V9.3" />
      <circle cx="8" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconGear() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.3" />
      <path d="M8 2.3v1.4M8 12.3v1.4M13.7 8h-1.4M3.7 8H2.3M12 4l-1 1M5 11l-1 1M12 12l-1-1M5 5 4 4" />
    </svg>
  )
}

function Sparkline({ points, color }) {
  return (
    <svg viewBox="0 0 60 22" className="lp-spark" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const MINI_STATS = [
  { label: 'Hematócrito', value: '55,5 %', pts: '0,16 10,15 20,10 30,12 40,6 50,4 60,2' },
  { label: 'Pressão', value: '138/88', pts: '0,8 10,10 20,9 30,13 40,11 50,15 60,17' },
  { label: 'TGP / ALT', value: '48 U/L', pts: '0,18 10,14 20,15 30,10 40,11 50,6 60,4' },
]

export default function LoginPreview() {
  return (
    <div className="lp-wrap">
      <div className="lp-badge">
        <span className="lp-badge-icon"><IconBars /></span>
        <span>
          <strong>17</strong> indicadores
          <br />acompanhados no seu perfil
        </span>
      </div>

      <div className="lp-card">
        <div className="lp-side">
          <span className="lp-side-icon lp-side-icon--on"><IconBars /></span>
          <span className="lp-side-icon" />
          <span className="lp-side-icon" />
          <span className="lp-side-icon"><IconGear /></span>
        </div>

        <div className="lp-main">
          <div className="lp-top">
            <div>
              <span className="lp-eyebrow">visão geral</span>
              <strong className="lp-name">Olá, André</strong>
            </div>
            <div className="lp-periods">
              <span>3m</span>
              <span className="is-on">6m</span>
              <span>1a</span>
            </div>
          </div>

          <div className="lp-chart-card">
            <span className="lp-chart-title">Índice de acompanhamento</span>
            <svg viewBox="0 0 220 70" className="lp-chart" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lp-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2fd6be" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#2fd6be" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,52 L25,50 L50,48 L75,34 L100,32 L125,20 L150,18 L175,16 L220,14 L220,70 L0,70 Z" fill="url(#lp-grad)" />
              <path d="M0,52 L25,50 L50,48 L75,34 L100,32 L125,20 L150,18 L175,16 L220,14" fill="none" stroke="#2fd6be" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="lp-grid">
            {MINI_STATS.map((m) => (
              <div className="lp-mini" key={m.label}>
                <div className="lp-mini-top">
                  <span className="lp-mini-label">{m.label}</span>
                  <span className="lp-mini-badge">atenção</span>
                </div>
                <strong className="lp-mini-value">{m.value}</strong>
                <Sparkline points={m.pts} color="#e0a82e" />
              </div>
            ))}
          </div>
        </div>

        <div className="lp-chip-testo">
          <div className="lp-ring">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e5e5" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke="#2fd6be" strokeWidth="3"
                strokeDasharray="97.4" strokeDashoffset="24" strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
            </svg>
          </div>
          <div className="lp-testo-info">
            <div className="lp-testo-head">
              Testosterona <span className="lp-pill-ok">ok</span>
            </div>
            <div className="lp-testo-value"><strong>612</strong> ng/dL</div>
            <div className="lp-testo-ref">ref 264-916</div>
          </div>
        </div>
      </div>

      <div className="lp-alert">
        <span className="lp-alert-icon"><IconAlert /></span>
        <div>
          <strong>Alerta discreto</strong>
          <p>Pressão acima da faixa há 2 medições. Vale repetir em 30 dias e conversar com um profissional.</p>
        </div>
      </div>
    </div>
  )
}

export function LoginFeatures() {
  const items = [
    { icon: <IconBars />, title: 'Acompanhe sua evolução', text: 'Visualize seus exames ao longo do tempo.' },
    { icon: <IconBell />, title: 'Identifique alterações', text: 'Receba alertas quando um indicador exigir atenção.' },
    { icon: <IconDoc />, title: 'Centralize seus exames', text: 'Tenha seu histórico organizado em um único lugar.' },
  ]
  return (
    <div className="lp-features">
      {items.map((it) => (
        <div className="lp-feature" key={it.title}>
          <span className="lp-feature-icon">{it.icon}</span>
          <div>
            <strong>{it.title}</strong>
            <p>{it.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function LoginPrivacyFooter() {
  return (
    <div className="lp-privacy">
      <div className="lp-privacy-row">
        <span className="lp-privacy-icon"><IconShield /></span>
        <div>
          <strong>Seus dados são privados.</strong>
          <p>Você decide quem pode acessar suas informações.</p>
        </div>
      </div>
      <div className="lp-privacy-links">Privacidade &nbsp;•&nbsp; Segurança &nbsp;•&nbsp; LGPD</div>
    </div>
  )
}
