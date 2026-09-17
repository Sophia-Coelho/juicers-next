import { Link } from "react-router-dom";
import { useTranslation } from "../../context/LanguageContext";
import "../../style/SecaoInicio.css";

const T = {
  pt: {
    eyebrow: "Acompanhamento • Redução de danos",
    h1Lead: "Acompanhe sua saúde com a mesma ",
    h1Accent: "disciplina que você treina.",
    lead: "Registre seus exames, veja seus indicadores evoluírem no tempo e entenda como seu corpo responde, sem julgamento.",
    bodyPre: "A Juicers reúne seus exames em um só lugar, mostra a ",
    bodyStrong: "tendência",
    bodyPost: " de cada indicador e te ajuda a saber a hora certa de procurar um profissional.",
    ctaPrimary: "Começar a acompanhar",
    ctaGhost: "Ver como funciona",
    reassure: "Anônimo e privado. Seus dados de saúde ficam com você.",
    hdlName: "HDL (colesterol bom)",
    dashEyebrow: "visão geral",
    dashGreeting: "Olá, André",
    dashTabs: ["30d", "6m", "1a"],
    dashChartTitle: "Índice de acompanhamento",
    dashHdlChip: "na faixa",
    dashPressureName: "Pressão",
    dashPressureStatus: "atenção",
    dashTgpName: "TGP / ALT",
    dashTgpStatus: "atenção",
    dashTestoName: "Testosterona",
    dashTestoStatus: "ok",
    dashTestoRef: "ref 264-916",
    dashAlertTitle: "Alerta discreto",
    dashAlertBody: "Pressão acima da faixa há 2 medições. Vale repetir em 30 dias e conversar com um profissional.",
  },
  en: {
    eyebrow: "Tracking • Harm reduction",
    h1Lead: "Track your health with the same ",
    h1Accent: "discipline you train with.",
    lead: "Log your exams, watch your indicators evolve over time and understand how your body responds, without judgment.",
    bodyPre: "Juicers brings your exams together in one place, shows the ",
    bodyStrong: "trend",
    bodyPost: " of each indicator and helps you know the right time to see a professional.",
    ctaPrimary: "Start tracking",
    ctaGhost: "See how it works",
    reassure: "Anonymous and private. Your health data stays with you.",
    hdlName: "HDL (good cholesterol)",
    dashEyebrow: "overview",
    dashGreeting: "Hi, André",
    dashTabs: ["30d", "6m", "1y"],
    dashChartTitle: "Tracking index",
    dashHdlChip: "in range",
    dashPressureName: "Pressure",
    dashPressureStatus: "attention",
    dashTgpName: "ALT / SGPT",
    dashTgpStatus: "attention",
    dashTestoName: "Testosterone",
    dashTestoStatus: "ok",
    dashTestoRef: "ref 264-916",
    dashAlertTitle: "Discreet alert",
    dashAlertBody: "Pressure above range for 2 readings. Worth repeating in 30 days and talking to a professional.",
  },
};

export default function SecaoInicio() {
  const t = useTranslation(T, "SecaoInicio.T");

  return (
    <header className="hero section" id="inicio">
    <div className="wrap hero-grid">
        <div>
        <span className="eyebrow">{t.eyebrow}</span>
        <h1>
            {t.h1Lead}
            <span className="accent">{t.h1Accent}</span>
        </h1>
        <p className="lead">
            {t.lead}
        </p>
        <p className="body-t">
            {t.bodyPre}<b>{t.bodyStrong}</b>{t.bodyPost}
            </p>
        <div className="hero-ctas">
            <Link className="btn-j btn-primary-j" to="/login">{t.ctaPrimary}</Link>
            <a className="btn-j btn-ghost-j" href="#entenda">{t.ctaGhost}</a>
        </div>
        <div className="reassure">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {t.reassure}
        </div>
        </div>

        <div className="stage">
        <div className="app reveal">
            <div className="side">
            <span className="s-logo" />
            <span className="s-ico on"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg></span>
            <span className="s-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5l8 4 8-4v14" /><path d="M4 12l8 4 8-4" /></svg></span>
            <span className="s-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l2-7 4 14 2-7h6" /></svg></span>
            <span className="s-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></span>
            </div>
            <div className="app-main">
            <div className="topline">
                <div className="who">{t.dashEyebrow}<b>{t.dashGreeting}</b></div>
                <div className="seg">
                {t.dashTabs.map((tab, i) => (
                    <span key={tab} className={i === 1 ? "on" : ""}>{tab}</span>
                ))}
                </div>
            </div>
            <div className="panel-main">
                <div className="pm-head">
                <div className="t">{t.dashChartTitle}</div>
                <div className="v">82<small>↑ +6</small></div>
                </div>
                <svg className="chart" viewBox="0 0 480 96" preserveAspectRatio="none" aria-hidden="true">
                <defs><linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2FD6BE" stopOpacity=".28" /><stop offset="1" stopColor="#2FD6BE" stopOpacity="0" /></linearGradient></defs>
                <path className="draw" pathLength="1" d="M0,76 C60,70 90,72 130,60 C180,46 210,58 260,44 C320,28 360,40 410,26 C440,18 460,20 480,16" fill="none" stroke="#2FD6BE" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0,76 C60,70 90,72 130,60 C180,46 210,58 260,44 C320,28 360,40 410,26 C440,18 460,20 480,16 L480,96 L0,96 Z" fill="url(#heroGrad)" />
                <circle cx="480" cy="16" r="4" fill="#2FD6BE" />
                </svg>
            </div>
            <div className="tiles">
                <div className="tile">
                <div className="tl-top"><span className="tl-name">{t.hdlName.split(" ")[0]}</span><span className="chip ok"><span className="d" />{t.dashHdlChip}</span></div>
                <div className="tl-val">52<span className="tl-unit"> mg/dL</span></div>
                <svg className="spark" viewBox="0 0 120 26" preserveAspectRatio="none"><polyline points="0,20 24,18 48,19 72,13 96,10 120,7" fill="none" stroke="#2FD6BE" strokeWidth="2" /></svg>
                </div>
                <div className="tile">
                <div className="tl-top"><span className="tl-name">{t.dashPressureName}</span><span className="chip warn"><span className="d" />{t.dashPressureStatus}</span></div>
                <div className="tl-val">138<span className="tl-unit">/88</span></div>
                <svg className="spark" viewBox="0 0 120 26" preserveAspectRatio="none"><polyline points="0,14 24,12 48,15 72,11 96,9 120,8" fill="none" stroke="#F5B041" strokeWidth="2" /></svg>
                </div>
                <div className="tile">
                <div className="tl-top"><span className="tl-name">{t.dashTgpName}</span><span className="chip warn"><span className="d" />{t.dashTgpStatus}</span></div>
                <div className="tl-val">48<span className="tl-unit"> U/L</span></div>
                <svg className="spark" viewBox="0 0 120 26" preserveAspectRatio="none"><polyline points="0,18 24,16 48,17 72,14 96,12 120,11" fill="none" stroke="#F5B041" strokeWidth="2" /></svg>
                </div>
            </div>
            </div>
        </div>

        <div className="float float-gauge">
            <div className="fg-top"><span className="fg-name">{t.dashTestoName}</span><span className="chip ok"><span className="d" />{t.dashTestoStatus}</span></div>
            <div className="gauge-wrap">
            <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="22" fill="none" stroke="#cad1dc" strokeWidth="5" />
                <circle cx="26" cy="26" r="22" fill="none" stroke="#2FD6BE" strokeWidth="5" strokeLinecap="round" strokeDasharray="138" strokeDashoffset="48" transform="rotate(-90 26 26)" />
            </svg>
            <div className="gauge-val"><b>612</b><span>ng/dL · {t.dashTestoRef}</span></div>
            </div>
        </div>

        <div className="float float-alert">
            <div className="fa-top">
            <span className="fa-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg></span>
            <span className="fa-t">{t.dashAlertTitle}</span>
            </div>
            <p>{t.dashAlertBody}</p>
        </div>
        </div>
    </div>
    </header>
);
}
