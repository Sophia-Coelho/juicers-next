import React from 'react';
import { PageHeader, Field } from '../components/Primitives.jsx';

const AMBER = '#e6a817';

function Radio({ label, checked, onClick }) {
  return (
    <label onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#303030' }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${checked ? AMBER : '#bbb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: checked ? AMBER : 'transparent' }} />
      </span>
      {label}
    </label>
  );
}

/** Dados da Conta (atleta): perfil, ciclo, compostos, condições, exames. */
export default function AthleteAccount({ account, data, onUpd, onToggleCompound, onToggleCondition, onSave }) {
  const acc = account;
  const sectionStyle = { background: '#ebebeb', border: '1px solid #d5d5d5', borderRadius: 14, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 };

  return (
    <div className="jc-fade" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 880, paddingBottom: 80 }}>
      <PageHeader title="Dados da Conta" sub="Mantenha seu perfil atualizado para alertas mais precisos" />

      {/* Perfil Básico */}
      <section style={sectionStyle}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Perfil Básico</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <Field label="Nome" value={acc.nome} onChange={(e) => onUpd('nome', e.target.value)} />
          <Field label="Sobrenome" value={acc.sobrenome} onChange={(e) => onUpd('sobrenome', e.target.value)} />
          <Field label="Idade" type="number" value={acc.idade} onChange={(e) => onUpd('idade', e.target.value)} />
          <Field label="Sexo Biológico" value={acc.sexo} onChange={(e) => onUpd('sexo', e.target.value)} />
          <Field label="Peso (kg)" type="number" value={acc.peso} onChange={(e) => onUpd('peso', e.target.value)} />
          <Field label="Altura (cm)" type="number" value={acc.altura} onChange={(e) => onUpd('altura', e.target.value)} />
        </div>
      </section>

      {/* Ciclo Atual */}
      <section style={sectionStyle}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Ciclo Atual</h2>
        <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
          {[
            { label: 'Sim, ciclo ativo', value: 'ativo' },
            { label: 'Não, em off', value: 'off' },
            { label: 'Nunca usei', value: 'nunca' },
          ].map((o) => (
            <Radio key={o.value} label={o.label} checked={acc.cicloStatus === o.value} onClick={() => onUpd('cicloStatus', o.value)} />
          ))}
        </div>
        {acc.cicloStatus === 'ativo' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, maxWidth: 420 }}>
            <Field label="Dosagem semanal (mg)" type="number" value={acc.dose} onChange={(e) => onUpd('dose', e.target.value)} />
            <Field label="Tempo de uso" value={acc.cicloTempo} onChange={(e) => onUpd('cicloTempo', e.target.value)} />
          </div>
        )}
      </section>

      {/* Compostos Utilizados */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Compostos Utilizados</h2>
          <p style={{ margin: 0, fontSize: 12, color: '#818181' }}>Selecione todos os compostos do seu ciclo atual</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {data.compoundsCatalog.map((c) => {
            const sel = acc.compounds.includes(c);
            return (
              <button
                key={c}
                onClick={() => onToggleCompound(c)}
                style={{
                  border: `1px solid ${sel ? AMBER : '#d5d5d5'}`,
                  background: sel ? 'rgba(230,168,23,.1)' : 'transparent',
                  color: sel ? AMBER : '#656565',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  borderRadius: 20,
                  padding: '8px 15px',
                  cursor: 'pointer',
                  transition: 'all .15s ease',
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </section>

      {/* Condições Pré-existentes */}
      <section style={{ ...sectionStyle, gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Condições Pré-existentes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.conditionsCatalog.map((c) => {
            const sel = acc.condicoes.includes(c);
            return (
              <label key={c} onClick={() => onToggleCondition(c)} style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', fontSize: 13.5, color: '#303030', padding: '5px 0' }}>
                <span style={{ width: 19, height: 19, borderRadius: 5, border: `1.5px solid ${sel ? AMBER : '#c5c5c5'}`, background: sel ? AMBER : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  {sel && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f2f2f2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </span>
                {c}
              </label>
            );
          })}
        </div>
      </section>

      {/* Exames Laboratoriais */}
      <section style={sectionStyle}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Exames Laboratoriais</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#656565', textTransform: 'uppercase', letterSpacing: '.04em' }}>Frequência de exames</span>
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
            {[
              { label: 'Mensal', value: 'mensal' },
              { label: 'Trimestral', value: 'trimestral' },
              { label: 'Semestral', value: 'semestral' },
            ].map((o) => (
              <Radio key={o.value} label={o.label} checked={acc.examFreq === o.value} onClick={() => onUpd('examFreq', o.value)} />
            ))}
          </div>
        </div>
        <Field label="Data do último exame" value={acc.lastExam} onChange={(e) => onUpd('lastExam', e.target.value)} style={{ maxWidth: 220 }} />
      </section>

      <div style={{ position: 'sticky', bottom: 0, display: 'flex', justifyContent: 'flex-end', padding: '14px 0 4px', background: 'linear-gradient(to top,#f2f2f2 60%,transparent)' }}>
        <button
          onClick={onSave}
          className="jc-btn-amber"
          style={{ background: '#e6a817', color: '#1a1206', border: 'none', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', borderRadius: 10, padding: '12px 26px', cursor: 'pointer' }}
        >
          Salvar alterações
        </button>
      </div>
    </div>
  );
}
