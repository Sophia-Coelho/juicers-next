function normalizeText(text = "") {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .toUpperCase();
}

function toNumber(value) {
  if (value == null) return null;

  const raw = String(value).trim().replace(/\s/g, "");
  const cleaned = raw.replace(/[^\d.,-]/g, "");

  if (!cleaned) return null;

  let normalized = cleaned;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    // "1.234,5" -> ponto é milhar, vírgula é decimal
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    // "1.234" / "1.234.567" -> ponto é separador de milhar
    normalized = cleaned.replace(/\./g, "");
  }
  // Qualquer outro caso com ponto é decimal: "0.86" precisa continuar 0.86.
  // A versão anterior fazia replace(/\./g, "") sempre, o que virava 86 —
  // e 1.31 virava 131 — em qualquer laudo com ponto decimal.

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function findDate(text) {
  const match = text.match(/COLETADO EM:\s*(\d{2}\/\d{2}\/\d{4})/i);

  if (!match) {
    return new Date().toISOString().slice(0, 10);
  }

  const [day, month, year] = match[1].split("/");
  return `${year}-${month}-${day}`;
}

function cleanMarkers(markers) {
  return Object.fromEntries(
    Object.entries(markers).filter(([, value]) => value !== null && value !== undefined)
  );
}

function getBlocks(text) {
  return text
    .split("ESPACO ENTRE OS MEMOS")
    .map(block => block.trim())
    .filter(Boolean);
}

function getFirstResult(block, unitPattern) {
  const regex = new RegExp(
    `COLETADO EM:[\\s\\S]{0,180}?([0-9]+(?:[\\.,][0-9]+)?)\\s*${unitPattern}`,
    "i"
  );

  const match = block.match(regex);
  return match ? toNumber(match[1]) : null;
}

function findBlockValue(text, matcher, unitPattern) {
  const blocks = getBlocks(text);

  for (const block of blocks) {
    if (!matcher(block)) continue;

    const value = getFirstResult(block, unitPattern);
    if (value !== null) return value;
  }

  return null;
}

function extractHemogram(text) {
  const hemoglobin = text.match(
    /([0-9]+(?:[,.][0-9]+)?)\s*G\/DL\s+HEMOGLOBINA/i
  );

  const hematocrit =
    text.match(/HEMATOCRITO\s+([0-9]+(?:[,.][0-9]+)?)\s*%/i) ||
    text.match(/([0-9]+(?:[,.][0-9]+)?)\s*%\s+37[,.]0\s*-\s*52[,.]4\s*%/i);

  const erythrocytes = text.match(
    /ERITROGRAMA[\s\S]{0,120}?([0-9]+(?:[,.][0-9]+)?)\s*MILHOES\/MM/i
  );

  const leukocytes = text.match(
    /LEUCOGRAMA[\s\S]{0,120}?([0-9]+(?:[,.][0-9]+)?)\s*MIL\/MM/i
  );

  const platelets = text.match(
    /([0-9]+(?:[,.][0-9]+)?)\s*MIL\/MM[³3]\s+162\s*-\s*425/i
  );

  return {
    hemoglobin: hemoglobin ? toNumber(hemoglobin[1]) : null,
    hematocrit: hematocrit ? toNumber(hematocrit[1]) : null,
    erythrocytes: erythrocytes ? toNumber(erythrocytes[1]) : null,
    leukocytes: leukocytes ? toNumber(leukocytes[1]) : null,
    platelets: platelets ? toNumber(platelets[1]) : null,
  };
}

function getRiskAndAlerts(markers) {
  const alerts = [];
  let riskLevel = "normal";

  const attention = (message) => {
    if (riskLevel === "normal") riskLevel = "attention";
    alerts.push(message);
  };

  const high = (message) => {
    riskLevel = "high";
    alerts.push(message);
  };

  if (markers.hdl < 30) high("HDL muito baixo");
  else if (markers.hdl < 40) attention("HDL abaixo do ideal");

  if (markers.ldl >= 190) high("LDL muito elevado");
  else if (markers.ldl >= 130) attention("LDL acima do ideal");

  if (markers.nonHdl >= 160) high("Colesterol não-HDL elevado");
  else if (markers.nonHdl >= 130) attention("Colesterol não-HDL acima do ideal");

  if (markers.triglycerides >= 200) high("Triglicerídeos elevados");
  else if (markers.triglycerides >= 150) attention("Triglicerídeos acima do ideal");

  if (markers.creatinine >= 1.6) high("Creatinina elevada");
  else if (markers.creatinine > 1.3) attention("Creatinina acima do ideal");

  if (markers.glucose >= 126) high("Glicose em faixa de risco");
  else if (markers.glucose >= 100) attention("Glicose acima do ideal");

  if (markers.hba1c >= 6.5) high("Hemoglobina glicada em faixa de risco");
  else if (markers.hba1c >= 5.7) attention("Hemoglobina glicada acima do ideal");

  if (markers.hematocrit >= 55) high("Hematócrito elevado");
  else if (markers.hematocrit > 52.4) attention("Hematócrito acima do ideal");

  if (markers.hemoglobin >= 18.5) high("Hemoglobina elevada");
  else if (markers.hemoglobin > 17.8) attention("Hemoglobina acima do ideal");

  return { riskLevel, alerts };
}

/* ------------------------------------------------------------------------
 * Extração genérica por nome do marcador.
 *
 * Os matchers acima identificam cada exame pelo TEXTO DA FAIXA DE REFERÊNCIA
 * de um laboratório específico ("HOMENS : 0,72 A 1,25 MG/DL", "CALCULO DE
 * MARTIN/HOPKINS", "ESPACO ENTRE OS MEMOS"). Isso funciona muito bem para
 * aquele laudo e falha inteiro em qualquer outro — todos os marcadores voltam
 * nulos e o exame é recusado.
 *
 * Esta passagem genérica roda DEPOIS e só preenche o que ficou faltando:
 * procura o nome do marcador no início de uma linha e lê o primeiro número.
 *
 * Três regras evitam os erros clássicos de laudo:
 *   1. nomes mais longos primeiro — "HEMOGLOBINA GLICADA" antes de
 *      "HEMOGLOBINA", senão o valor da glicada vira o da hemoglobina;
 *   2. cada linha é consumida uma única vez;
 *   3. o valor passa por uma faixa de plausibilidade — hematócrito 5,6 é
 *      descartado em vez de salvo.
 * ---------------------------------------------------------------------- */

const GENERIC_MARKERS = [
  ["hba1c", ["HEMOGLOBINA GLICADA", "HEMOGLOBINA GLICOSILADA", "HBA1C", "HB A1C"], [3, 18]],
  ["nonHdl", ["COLESTEROL NAO-HDL", "COLESTEROL NAO HDL", "NAO-HDL", "NAO HDL"], [20, 500]],
  ["vitaminB12", ["VITAMINA B12", "CIANOCOBALAMINA", "VITAMINA B 12"], [50, 3000]],
  ["vitaminD", ["25-HIDROXIVITAMINA D", "25 HIDROXIVITAMINA D", "VITAMINA D"], [3, 200]],
  ["triglycerides", ["TRIGLICERIDEOS", "TRIGLICERIDES"], [20, 1500]],
  ["erythrocytes", ["ERITROCITOS", "HEMACIAS"], [2, 9]],
  ["hematocrit", ["HEMATOCRITO"], [15, 70]],
  ["hemoglobin", ["HEMOGLOBINA"], [5, 25]],
  ["leukocytes", ["LEUCOCITOS"], [1, 60]],
  ["creatinine", ["CREATININA"], [0.2, 15]],
  ["platelets", ["PLAQUETAS"], [20, 1200]],
  ["ferritin", ["FERRITINA"], [1, 3000]],
  ["glucose", ["GLICEMIA DE JEJUM", "GLICEMIA", "GLICOSE"], [30, 600]],
  ["hdl", ["COLESTEROL HDL", "HDL"], [10, 150]],
  ["ldl", ["COLESTEROL LDL", "LDL"], [20, 400]],
  ["vldl", ["COLESTEROL VLDL", "VLDL"], [2, 120]],
  ["iron", ["FERRO SERICO", "FERRO"], [10, 500]],
];

function firstNumberAfter(rest) {
  // Ignora pontuação/pontilhado entre o rótulo e o valor.
  const match = rest.replace(/^[\s.:·|=-]+/, "").match(/^(\d{1,3}(?:\.\d{3})*|\d+)(?:[.,](\d+))?/);

  if (!match) return null;

  const inteiro = match[1].replace(/\./g, "");
  return toNumber(match[2] ? `${inteiro}.${match[2]}` : inteiro);
}

export function extractByMarkerName(text) {
  const lines = text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const alvos = GENERIC_MARKERS
    .flatMap(([key, nomes, faixa]) => nomes.map(nome => ({ key, nome, faixa })))
    .sort((a, b) => b.nome.length - a.nome.length);

  const encontrados = {};
  const usadas = new Set();

  for (const alvo of alvos) {
    if (encontrados[alvo.key] !== undefined) continue;

    for (let i = 0; i < lines.length; i++) {
      if (usadas.has(i) || !lines[i].startsWith(alvo.nome)) continue;

      // O caractere seguinte não pode ser letra: evita "FERRO" casar "FERRITINA"
      const seguinte = lines[i][alvo.nome.length];
      if (seguinte && /[A-Z]/.test(seguinte)) continue;

      const valor = firstNumberAfter(lines[i].slice(alvo.nome.length));
      if (valor === null) continue;

      const [min, max] = alvo.faixa;
      if (valor < min || valor > max) continue;

      encontrados[alvo.key] = valor;
      usadas.add(i);
      break;
    }
  }

  return encontrados;
}

function findAnyDate(text) {
  const padroes = [
    /COLETADO EM:\s*(\d{2})\/(\d{2})\/(\d{4})/i,
    /DATA DA COLETA\s*:?\s*(\d{2})\/(\d{2})\/(\d{4})/i,
    /DATA DE COLETA\s*:?\s*(\d{2})\/(\d{2})\/(\d{4})/i,
    /COLETA\s*:?\s*(\d{2})\/(\d{2})\/(\d{4})/i,
  ];

  for (const padrao of padroes) {
    const match = text.match(padrao);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  }

  // Última tentativa: a data mais antiga em formato dd/mm/aaaa no documento
  const todas = [...text.matchAll(/\b(\d{2})\/(\d{2})\/(\d{4})\b/g)]
    .map(m => `${m[3]}-${m[2]}-${m[1]}`)
    .filter(iso => {
      const d = new Date(iso);
      return !Number.isNaN(d.getTime()) && d.getFullYear() > 2000;
    })
    .sort();

  return todas[0] || new Date().toISOString().slice(0, 10);
}

export function parseExamPdfText(rawText = "") {
  const text = normalizeText(rawText);
  const hemogramMarkers = extractHemogram(text);

  const markers = cleanMarkers({
    creatinine: findBlockValue(
      text,
      block =>
        block.includes("HOMENS : 0,72 A 1,25 MG/DL") ||
        block.includes("HOMENS : 0.72 A 1.25 MG/DL"),
      "(?:MG/DL)"
    ),

    iron: findBlockValue(
      text,
      block =>
        block.includes("HOMENS: 65 A 175 UG/DL") ||
        block.includes("MULHERES: 50 A 170 UG/DL"),
      "(?:UG/DL|µG/DL)"
    ),

    ferritin: findBlockValue(
      text,
      block =>
        block.includes("HOMENS: 21,81 - 274,66 NG/ML") ||
        block.includes("HOMENS: 21.81 - 274.66 NG/ML"),
      "(?:NG/ML)"
    ),

    glucose: findBlockValue(
      text,
      block => block.includes("ENZIMATICO - HEXOQUINASE"),
      "(?:MG/DL)"
    ),

    hdl: findBlockValue(
      text,
      block =>
        block.includes("MAIOR DE 20 ANOS, COM OU SEM JEJUM: >") &&
        block.includes("40 MG/DL"),
      "(?:MG/DL)"
    ),

    nonHdl: findBlockValue(
      text,
      block =>
        block.includes("OTIMO: INFERIOR A 130 MG/DL") &&
        block.includes("MUITO ALTO: MAIOR OU IGUAL A 190 MG/DL"),
      "(?:MG/DL)"
    ),

    vldl: findBlockValue(
      text,
      block => block.includes("FORMULA DE MARTIN"),
      "(?:MG/DL)"
    ),

    ldl: findBlockValue(
      text,
      block => block.includes("CALCULO DE MARTIN/HOPKINS"),
      "(?:MG/DL)"
    ),

    triglycerides: findBlockValue(
      text,
      block => block.includes("DESEJAVEL: ABAIXO DE 150 MG/DL"),
      "(?:MG/DL)"
    ),

    vitaminB12: findBlockValue(
      text,
      block => block.includes("187-883 PG/ML"),
      "(?:PG/ML)"
    ),

    vitaminD: findBlockValue(
      text,
      block =>
        block.includes("IDEAL: 30 A 60 NG/ML") ||
        block.includes("RISCO DE INTOXICACAO"),
      "(?:NG/ML)"
    ),

    hba1c: findBlockValue(
      text,
      block => block.includes("GLICOSE MEDIA ESTIMADA") && block.includes("HPLC"),
      "(?:%)"
    ),

    ...hemogramMarkers,
  });

  // Preenche o que os matchers do laboratório específico não acharam.
  // Só adiciona chaves ausentes — nunca sobrescreve o que já veio.
  const genericos = extractByMarkerName(text);

  for (const [chave, valor] of Object.entries(genericos)) {
    if (markers[chave] === undefined || markers[chave] === null) {
      markers[chave] = valor;
    }
  }

  const { riskLevel, alerts } = getRiskAndAlerts(markers);

  return {
    examDate: findAnyDate(text),
    markers,
    riskLevel,
    alerts,
  };
}