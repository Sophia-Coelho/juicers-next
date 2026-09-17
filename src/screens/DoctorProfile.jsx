import React from 'react';
import { PageHeader, Field } from '../components/Primitives.jsx';

/** Dados do Médico — perfil profissional exibido aos pacientes. */
export default function DoctorProfile({ medico, onUpd, onSave }) {
  const med = medico;
  const fullName = `${med.nome || ''} ${med.sobrenome || ''}`.trim();
  const initials = ((med.nome || ' ')[0] + (med.sobrenome || ' ')[0]).toUpperCase();
  const sectionStyle = { background: '#ebebeb', border: '1px solid #d5d5d5', borderRadius: 14, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 };

  return (
    <div className="jc-fade" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 780, paddingBottom: 80 }}>
      <PageHeader title="Dados do Médico" sub="Informações profissionais exibidas aos seus pacientes" />

      <section style={{ background: '#ebebeb', border: '1px solid #d5d5d5', borderRadius: 14, padding: 24, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(47,214,190,.14)', color: '#2fd6be', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700, flex: 'none' }}>
          {initials}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0f0f0f' }}>{fullName}</span>
          <span style={{ fontSize: 13, color: '#2fd6be', fontWeight: 600 }}>{med.especialidade}</span>
          <span style={{ fontSize: 12, color: '#777' }}>{med.crm} · {med.instituicao}</span>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Perfil Profissional</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          <Field label="Nome" accent="teal" value={med.nome} onChange={(e) => onUpd('nome', e.target.value)} />
          <Field label="Sobrenome" accent="teal" value={med.sobrenome} onChange={(e) => onUpd('sobrenome', e.target.value)} />
          <Field label="Especialidade" accent="teal" value={med.especialidade} onChange={(e) => onUpd('especialidade', e.target.value)} />
          <Field label="CRM" accent="teal" value={med.crm} onChange={(e) => onUpd('crm', e.target.value)} />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Contato &amp; Instituição</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          <Field label="E-mail" accent="teal" value={med.email} onChange={(e) => onUpd('email', e.target.value)} />
          <Field label="Telefone" accent="teal" value={med.telefone} onChange={(e) => onUpd('telefone', e.target.value)} />
          <Field label="Instituição" accent="teal" value={med.instituicao} onChange={(e) => onUpd('instituicao', e.target.value)} style={{ gridColumn: '1 / -1' }} />
        </div>
      </section>

      <div style={{ position: 'sticky', bottom: 0, display: 'flex', justifyContent: 'flex-end', padding: '14px 0 4px', background: 'linear-gradient(to top,#f2f2f2 60%,transparent)' }}>
        <button
          onClick={onSave}
          className="jc-btn-teal"
          style={{ background: '#2fd6be', color: '#06201d', border: 'none', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', borderRadius: 10, padding: '12px 26px', cursor: 'pointer' }}
        >
          Salvar alterações
        </button>
      </div>
    </div>
  );
}
