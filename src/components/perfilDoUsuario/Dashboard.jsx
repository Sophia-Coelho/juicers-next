import React from 'react';
import AlertsGrid from './AlertsGrid.jsx';
import EvolutionPanel from './EvolutionPanel.jsx';

/**
 * Dashboard — painel de evolução (gráfico + seletor de marcadores) + grade
 * de alertas abaixo.
 *
 * A faixa de resumo (4 KPIs) e a grade de mini-cards por categoria que
 * existiam aqui foram removidas: o seletor lateral do EvolutionPanel já
 * mostra nome, valor e status de cada marcador, e os alertas, antes numa
 * coluna fixa ao lado, agora vêm em cards abaixo — com isso o gráfico, a
 * peça mais forte da tela, ocupa a largura e a altura inteiras.
 *
 * Props: hideHeader, heading, sub, alerts, categories, examDates, onSelect.
 */
export default function Dashboard({
  hideHeader = false,
  heading = '',
  sub = '',
  alerts = [],
  categories = [],
  examDates = [],
  unknownKeys = [],
  onSelect,
}) {
  // Existem exames, mas nenhum marcador foi reconhecido: avisa em vez de
  // renderizar uma tela vazia, que parece defeito.
  const semMarcadores = examDates.length > 0 && categories.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {!hideHeader && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f0f0f', letterSpacing: '-.02em' }}>{heading}</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#777', lineHeight: 1.4 }}>{sub}</p>
        </div>
      )}

      {/* Diagnóstico: exames existem mas nenhum marcador foi reconhecido */}
      {semMarcadores && (
        <div
          style={{
            background: 'rgba(224,168,46,.1)',
            border: '1px solid rgba(224,168,46,.35)',
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <strong style={{ fontSize: 13, color: '#8a6d1f' }}>
            {examDates.length} exame{examDates.length > 1 ? 's' : ''} importado{examDates.length > 1 ? 's' : ''}, mas nenhum marcador foi reconhecido
          </strong>
          <span style={{ fontSize: 12.5, color: '#777', lineHeight: 1.5 }}>
            Os exames chegaram sem valores numéricos ou com nomes de campo que o catálogo não conhece.
            {unknownKeys.length > 0 && (
              <>
                {' '}Campos encontrados que não batem com nenhum marcador:{' '}
                <code style={{ background: '#e0e0e0', padding: '1px 5px', borderRadius: 4, fontSize: 11.5 }}>
                  {unknownKeys.slice(0, 12).join(', ')}
                  {unknownKeys.length > 12 ? ` … (+${unknownKeys.length - 12})` : ''}
                </code>
              </>
            )}
          </span>
        </div>
      )}

      {/* Painel de evolução — gráfico + seletor de marcadores, largura inteira */}
      <EvolutionPanel categories={categories} onSelect={onSelect} />

      {/* Alertas em grade, abaixo do gráfico */}
      <AlertsGrid alerts={alerts} />
    </div>
  );
}
