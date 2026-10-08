const CFM_ENDPOINT =
  "https://ws.cfm.org.br:8080/WebServiceConsultaMedicos/ServicoConsultaMedicos";

export class CfmVerificationError extends Error {
  constructor(message, status = 503) {
    super(message);
    this.name = "CfmVerificationError";
    this.status = status;
  }
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function xmlValue(xml, tag) {
  const expression = new RegExp(
    `<(?:[\\w.-]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${tag}\\s*>`,
    "i"
  );
  const match = xml.match(expression);

  if (!match) return null;

  return match[1]
    .replace(/<[^>]*>/g, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .trim();
}

function envelope(operation, fields) {
  const values = Object.entries(fields)
    .map(([name, value]) => `<${name}>${xmlEscape(value)}</${name}>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://servico.cfm.org.br/">
  <soapenv:Body><ser:${operation}>${values}</ser:${operation}></soapenv:Body>
</soapenv:Envelope>`;
}

async function callCfm(operation, fields) {
  const key = process.env.CFM_ACCESS_KEY;
  if (!key) {
    throw new CfmVerificationError(
      "A validação de CRM ainda não foi configurada. Tente novamente mais tarde."
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(CFM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: '""',
      },
      body: envelope(operation, { ...fields, chave: key }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new CfmVerificationError("Não foi possível consultar o CFM agora.");
    }

    const xml = await response.text();
    const errorCode = xmlValue(xml, "codigoErro");

    if (errorCode) {
      if (errorCode === "8101") {
        throw new CfmVerificationError(
          "CRM não encontrado para a UF informada.",
          422
        );
      }

      throw new CfmVerificationError("Não foi possível consultar o CFM agora.");
    }

    return xml;
  } catch (error) {
    if (error instanceof CfmVerificationError) throw error;
    throw new CfmVerificationError("Não foi possível consultar o CFM agora.");
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatBirthDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new CfmVerificationError("Informe uma data de nascimento válida.", 400);
  }

  const [, year, month, day] = match;
  const parsedDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    parsedDate.getUTCFullYear() !== Number(year) ||
    parsedDate.getUTCMonth() !== Number(month) - 1 ||
    parsedDate.getUTCDate() !== Number(day) ||
    parsedDate > new Date()
  ) {
    throw new CfmVerificationError("Informe uma data de nascimento válida.", 400);
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

export async function verifyDoctorWithCfm({ crm, uf, cpf, birthDate }) {
  const rawCrm = String(crm || "").trim();
  const normalizedUf = String(uf || "").trim().toUpperCase();
  const crmForLookup = normalizedUf === "RJ"
    ? rawCrm.replace(/^52[-\s](\d+)$/, "$1")
    : rawCrm;
  const normalizedCrm = crmForLookup.replace(/\D/g, "");
  const normalizedCpf = String(cpf || "").replace(/\D/g, "");

  if (!/^\d{1,7}$/.test(normalizedCrm)) {
    throw new CfmVerificationError("Informe um CRM válido, sem a sigla da UF.", 400);
  }
  if (!/^[A-Z]{2}$/.test(normalizedUf)) {
    throw new CfmVerificationError("Selecione a UF do CRM.", 400);
  }
  if (!/^\d{11}$/.test(normalizedCpf)) {
    throw new CfmVerificationError("Informe um CPF válido, somente números.", 400);
  }

  const dataNascimento = formatBirthDate(birthDate);
  const baseFields = { crm: normalizedCrm, uf: normalizedUf };
  const crmDataXml = await callCfm("Consultar", baseFields);
  const situation = xmlValue(crmDataXml, "situacao");

  if (!situation) {
    throw new CfmVerificationError("O CFM não retornou a situação deste CRM.");
  }
  if (situation !== "A") {
    throw new CfmVerificationError(
      "O CRM informado não está regular para exercício nesta UF.",
      403
    );
  }

  const identityXml = await callCfm("Validar", {
    ...baseFields,
    cpf: normalizedCpf,
    dataNascimento,
  });
  const identityMatches = xmlValue(identityXml, "resultadoConsulta");

  if (identityMatches !== "true") {
    throw new CfmVerificationError(
      "Os dados pessoais não correspondem ao CRM informado.",
      422
    );
  }

  return {
    crm: normalizedCrm,
    uf: normalizedUf,
    verifiedAt: new Date(),
  };
}
