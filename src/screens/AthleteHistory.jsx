import React from 'react';
import UploadZone from '../components/UploadZone.jsx';
import { PageHeader, SectionLabel, ExamRow, decorateExam } from '../components/Primitives.jsx';
import { STATUS } from '../theme.js';

/** Histórico de Exames (atleta): resumo + upload + lista de exames importados. */
export default function AthleteHistory({ examHistory, alertsCount, onUpload, onDetails }) {
  const exams = examHistory.map((e) => decorateExam(e, STATUS));
  const last = exams.length ? exams[0].date : '—';

  const summaryCard = (label, value, color) => (
    <div style={{ background: '#ebebeb', border: '1px solid #d5d5d5', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: '#656565', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', color: color || '#0f0f0f' }}>{value}</span>
    </div>
  );

  return (
    <div className="jc-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 980 }}>
      <PageHeader title="Histórico de Exames" sub="Importe e acompanhe seus exames laboratoriais ao longo do tempo" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {summaryCard('Total de exames', exams.length)}
        <div style={{ background: '#ebebeb', border: '1px solid #d5d5d5', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#656565', fontWeight: 500 }}>Último exame</span>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.01em', marginTop: 4 }}>{last}</span>
        </div>
        {summaryCard('Alertas ativos', alertsCount, '#f04747')}
      </div>

      <UploadZone accent="#e6a817" label="Importar novo exame (PDF)" onUpload={onUpload} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionLabel>Exames importados</SectionLabel>
        {exams.map((e, i) => (
          <ExamRow key={i} exam={e} accent="amber" onDetails={onDetails} />
        ))}
      </div>
    </div>
  );
}
