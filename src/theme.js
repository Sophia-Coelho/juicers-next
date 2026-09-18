/* Juicers — tokens de tema e cores de status. */

export const ACCENT = {
  athlete: '#e6a817', // âmbar dourado
  doctor: '#2fd6be', // verde-água
};

export const COLORS = {
  bg: '#f2f2f2',
  card: '#ebebeb',
  cardAlt: '#e5e5e5',
  field: '#f0f0f0',
  border: '#d5d5d5',
  borderSoft: '#e0e0e0',
  textPrimary: '#0f0f0f',
  textSecondary: '#777',
  textMuted: '#888',
};

// Status: 'ok' | 'atencao' | 'risco' | 'estavel'
export const STATUS = {
  color: { ok: '#3fb950', atencao: '#e0a82e', risco: '#f04747', estavel: '#3fb950' },
  bg: {
    ok: 'rgba(63,185,80,.12)',
    atencao: 'rgba(224,168,46,.12)',
    risco: 'rgba(240,71,71,.12)',
    estavel: 'rgba(63,185,80,.12)',
  },
  border: {
    ok: 'rgba(63,185,80,.28)',
    atencao: 'rgba(224,168,46,.3)',
    risco: 'rgba(240,71,71,.32)',
    estavel: 'rgba(63,185,80,.28)',
  },
  band: {
    ok: 'rgba(63,185,80,.15)',
    atencao: 'rgba(224,168,46,.15)',
    risco: 'rgba(240,71,71,.15)',
  },
  // rótulos para a lista de pacientes / badges gerais
  label: { ok: 'Estável', atencao: 'Atenção', risco: 'Risco alto', estavel: 'Estável' },
  // rótulos para a faixa de resumo do dashboard
  summaryLabel: { ok: 'Normal', atencao: 'Atenção', risco: 'Risco alto' },
};
