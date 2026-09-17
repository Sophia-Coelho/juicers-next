import { useState } from "react";
import { useTranslation } from "../context/LanguageContext";
import "../style/simulador.css";

function calculateRiskScore({ age, sex, frequency, months, route, stacking }) {
  let pontos = 0;

  if (age < 18) {
    pontos += 30;
  } else if (age <= 25) {
    pontos += 15;
  }

  if (frequency === "occasional") {
    pontos += 10;
  } else if (frequency === "frequent") {
    pontos += 25;
  } else {
    pontos += 40;
  }

  if (months <= 6) {
    pontos += 10;
  } else if (months <= 12) {
    pontos += 20;
  } else {
    pontos += 35;
  }

  if (sex === "F") {
    pontos += 10;
  }

  if (route === "oral") {
    pontos += 10;
  }

  if (route === "both") {
    pontos += 20;
  }

  if (stacking) {
    pontos += 15;
  }

  if (pontos > 100) {
    pontos = 100;
  }

  return pontos;
}

function getRiskProfile(score) {
  if (score <= 20) return { key: "low", hex: "#22c55e" };
  if (score <= 40) return { key: "moderate", hex: "#eab308" };
  if (score <= 60) return { key: "high", hex: "#f97316" };
  if (score <= 80) return { key: "veryHigh", hex: "#ef4444" };
  return { key: "critical", hex: "#dc2626" };
}

function getContextualMessages({ age, sex, frequency, months, route, stacking, score }) {
  const msgs = [];

  if (age <= 18) {
    msgs.push({ severity: "danger", key: "minor" });
  }

  if (age > 18 && age <= 25) {
    msgs.push({ severity: "warning", key: "youngAdult" });
  }

  if (sex === "F") {
    msgs.push({ severity: "danger", key: "femaleRisk" });

    if (frequency === "intense") {
      msgs.push({ severity: "danger", key: "femaleIntense" });
    }

    if (stacking) {
      msgs.push({ severity: "danger", key: "femaleStacking" });
    }
  }

  if (route === "oral") {
    msgs.push({ severity: "warning", key: "oralHepatotox" });
  }

  if (route === "both") {
    msgs.push({ severity: "danger", key: "bothHepatotox" });
  }

  if (stacking) {
    msgs.push({ severity: "danger", key: "stackingPoly" });
  }

  if (months >= 24) {
    msgs.push({ severity: "warning", key: "trtDependency" });
  }

  if (months >= 12 && (route === "oral" || route === "both")) {
    msgs.push({ severity: "warning", key: "cumulativeLiver" });
  }

  if (frequency !== "occasional" && months >= 6) {
    msgs.push({ severity: "info", key: "cardio" });
  }

  if (score >= 80) {
    msgs.push({ severity: "danger", key: "critical" });
  }

  return msgs;
}

const T = {
  pt: {
    sexOptions: [{ key: "M", label: "Masculino" }, { key: "F", label: "Feminino" }],
    frequencyOptions: [{ key: "occasional", label: "Ocasional" }, { key: "frequent", label: "Frequente" }, { key: "intense", label: "Intenso" }],
    routeOptions: [{ key: "injectable", label: "Injetável" }, { key: "oral", label: "Oral" }, { key: "both", label: "Ambos" }],
    stackingOptions: [{ key: false, label: "Não" }, { key: true, label: "Sim" }],
    riskLabels: { low: "Baixo", moderate: "Moderado", high: "Alto", veryHigh: "Muito Alto", critical: "Crítico" },
    durationMonth: "mês", durationMonths: "meses", durationYear: "ano", durationYears: "anos",
    title: "Simulador de Risco",
    subtitle: "Estime seu perfil de risco com base no seu histórico de uso.",
    ageLabel: "Idade:",
    sexLabel: "Sexo biológico",
    frequencyLabel: "Frequência de uso",
    durationLabel: "Duração:",
    durationTickMin: "1 mês",
    durationTickMax: "5 anos",
    routeLabel: "Via de administração",
    stackingLabel: "Usa mais de um composto?",
    calculate: "Calcular Risco",
    riskPrefix: "Risco",
    scoreNote: "Score calculado com base em todos os fatores clínicos combinados",
    factorsFound: (n) => `${n} fator${n > 1 ? "es" : ""} de risco identificado${n > 1 ? "s" : ""}`,
    messages: {
      minor: {
        title: "Adolescente em desenvolvimento",
        text: "Antes dos 18 anos o eixo Hipotálamo-Hipófise-Testicular (HPT) ainda está em formação. O uso nessa fase pode causar fechamento prematuro das placas de crescimento e supressão hormonal permanente — comprometendo a produção natural de testosterona pelo resto da vida.",
      },
      youngAdult: {
        title: "Sistema endócrino ainda em maturação",
        text: "Entre 18 e 25 anos a produção natural de testosterona ainda está se estabelecendo. O uso de anabolizantes nessa janela pode suprimir o pico hormonal natural da juventude de forma irreversível, mesmo que o eixo HPT já seja considerado funcionalmente maduro.",
      },
      femaleRisk: {
        title: "Risco elevado para o sexo feminino",
        text: "Mulheres são muito mais sensíveis a doses menores do que homens. O uso pode causar virilização — engrossamento permanente da voz, hipertrofia do clitóris e hirsutismo — além de interrupção do ciclo menstrual. Muitos desses efeitos não regridem com a interrupção do uso.",
      },
      femaleIntense: {
        title: "Virilização irreversível — uso intenso",
        text: "Com uso intenso em mulheres, as chances de virilização permanente são muito elevadas. Alterações como mudança de voz e hipertrofia clitoriana não regridem mesmo após anos sem uso, pois resultam de mudanças estruturais nos tecidos.",
      },
      femaleStacking: {
        title: "Combinação especialmente perigosa para mulheres",
        text: "O uso de múltiplos compostos em mulheres multiplica o risco de virilização e distúrbios hormonais graves. Cada composto adicional eleva exponencialmente a chance de efeitos androgenizantes permanentes.",
      },
      oralHepatotox: {
        title: "Hepatotoxicidade — compostos orais",
        text: "Anabolizantes orais são modificados quimicamente (17-alfa alquilados) para resistir ao metabolismo hepático, causando acúmulo de toxinas no fígado. O uso prolongado pode levar a peliose hepática, colestase e, em casos graves, carcinoma hepatocelular. Monitoramento de ALT, AST e bilirrubinas é essencial.",
      },
      bothHepatotox: {
        title: "Toxicidade hepática composta",
        text: "Combinar compostos orais e injetáveis potencializa o estresse hepático de forma aditiva. Os 17-alfa alquilados orais já sobrecarregam o fígado individualmente — associados a injetáveis que passam pelo mesmo ciclo metabólico, o risco de lesão hepática grave é consideravelmente elevado.",
      },
      stackingPoly: {
        title: "Polifarmácia — múltiplos compostos",
        text: "O uso simultâneo de mais de um anabolizante (stacking) potencializa a supressão do eixo HPT, aumenta o risco cardiovascular com queda de HDL e elevação de LDL, e dificulta identificar qual composto está causando efeitos adversos. A recuperação hormonal pós-ciclo é significativamente mais lenta.",
      },
      trtDependency: {
        title: "Risco de dependência hormonal (TRT)",
        text: "Após 2 anos ou mais de uso contínuo, a recuperação natural do eixo HPT pode nunca ser completa. Muitos usuários de longo prazo desenvolvem dependência de Terapia de Reposição Hormonal (TRT) permanente, pois o organismo perde a capacidade de produzir testosterona endógena.",
      },
      cumulativeLiver: {
        title: "Lesão hepática cumulativa",
        text: "Mais de 12 meses de uso de compostos orais aumenta significativamente o risco de lesão hepática cumulativa. A fibrose e alterações histológicas no tecido hepático podem não apresentar sintomas evidentes até estágios avançados da doença.",
      },
      cardio: {
        title: "Risco cardiovascular",
        text: "O uso regular de anabolizantes causa dislipidemia (queda do HDL e elevação do LDL), hipertrofia ventricular esquerda e aumento da pressão arterial. Esses fatores combinados elevam o risco de infarto e AVC mesmo em pessoas jovens e aparentemente saudáveis.",
      },
      critical: {
        title: "Perfil de risco crítico — busque ajuda",
        text: "A combinação de fatores inseridos representa um perfil de risco muito elevado. Danos cardiovasculares, hepáticos e hormonais nesse contexto costumam ser permanentes. Se você está nessa situação, buscar acompanhamento médico especializado com endocrinologista ou cardiologista é urgente.",
      },
    },
  },
  en: {
    sexOptions: [{ key: "M", label: "Male" }, { key: "F", label: "Female" }],
    frequencyOptions: [{ key: "occasional", label: "Occasional" }, { key: "frequent", label: "Frequent" }, { key: "intense", label: "Intense" }],
    routeOptions: [{ key: "injectable", label: "Injectable" }, { key: "oral", label: "Oral" }, { key: "both", label: "Both" }],
    stackingOptions: [{ key: false, label: "No" }, { key: true, label: "Yes" }],
    riskLabels: { low: "Low", moderate: "Moderate", high: "High", veryHigh: "Very High", critical: "Critical" },
    durationMonth: "month", durationMonths: "months", durationYear: "year", durationYears: "years",
    title: "Risk Simulator",
    subtitle: "Estimate your risk profile based on your usage history.",
    ageLabel: "Age:",
    sexLabel: "Biological sex",
    frequencyLabel: "Frequency of use",
    durationLabel: "Duration:",
    durationTickMin: "1 month",
    durationTickMax: "5 years",
    routeLabel: "Route of administration",
    stackingLabel: "Using more than one compound?",
    calculate: "Calculate Risk",
    riskPrefix: "Risk",
    scoreNote: "Score calculated based on all combined clinical factors",
    factorsFound: (n) => `${n} risk factor${n > 1 ? "s" : ""} identified`,
    messages: {
      minor: {
        title: "Adolescent in development",
        text: "Before age 18 the Hypothalamic-Pituitary-Testicular (HPT) axis is still forming. Use during this phase can cause premature closure of growth plates and permanent hormonal suppression — compromising natural testosterone production for the rest of life.",
      },
      youngAdult: {
        title: "Endocrine system still maturing",
        text: "Between 18 and 25 years old, natural testosterone production is still settling. Using anabolic steroids in this window can irreversibly suppress the natural hormonal peak of youth, even if the HPT axis is already considered functionally mature.",
      },
      femaleRisk: {
        title: "Elevated risk for females",
        text: "Women are far more sensitive to lower doses than men. Use can cause virilization — permanent voice deepening, clitoral hypertrophy and hirsutism — as well as menstrual cycle disruption. Many of these effects do not reverse after stopping use.",
      },
      femaleIntense: {
        title: "Irreversible virilization — intense use",
        text: "With intense use in women, the chances of permanent virilization are very high. Changes such as voice deepening and clitoral hypertrophy don't reverse even years after stopping, since they result from structural tissue changes.",
      },
      femaleStacking: {
        title: "Especially dangerous combination for women",
        text: "Using multiple compounds in women multiplies the risk of virilization and severe hormonal disorders. Each additional compound exponentially raises the chance of permanent androgenic effects.",
      },
      oralHepatotox: {
        title: "Hepatotoxicity — oral compounds",
        text: "Oral steroids are chemically modified (17-alpha alkylated) to resist liver metabolism, causing toxin buildup in the liver. Prolonged use can lead to hepatic peliosis, cholestasis and, in severe cases, hepatocellular carcinoma. Monitoring ALT, AST and bilirubin is essential.",
      },
      bothHepatotox: {
        title: "Compound liver toxicity",
        text: "Combining oral and injectable compounds adds up liver stress. 17-alpha alkylated orals already overload the liver on their own — paired with injectables that go through the same metabolic cycle, the risk of severe liver injury is considerably elevated.",
      },
      stackingPoly: {
        title: "Polypharmacy — multiple compounds",
        text: "Using more than one anabolic steroid at once (stacking) intensifies HPT axis suppression, increases cardiovascular risk with falling HDL and rising LDL, and makes it harder to identify which compound is causing adverse effects. Post-cycle hormonal recovery is significantly slower.",
      },
      trtDependency: {
        title: "Risk of hormonal dependency (TRT)",
        text: "After 2 years or more of continuous use, natural HPT axis recovery may never be complete. Many long-term users develop permanent dependency on Testosterone Replacement Therapy (TRT), as the body loses the ability to produce endogenous testosterone.",
      },
      cumulativeLiver: {
        title: "Cumulative liver damage",
        text: "More than 12 months of oral compound use significantly increases the risk of cumulative liver damage. Fibrosis and histological changes in liver tissue may show no clear symptoms until advanced stages of disease.",
      },
      cardio: {
        title: "Cardiovascular risk",
        text: "Regular anabolic steroid use causes dyslipidemia (falling HDL and rising LDL), left ventricular hypertrophy and increased blood pressure. These combined factors raise the risk of heart attack and stroke even in young, seemingly healthy people.",
      },
      critical: {
        title: "Critical risk profile — seek help",
        text: "The combination of entered factors represents a very high risk profile. Cardiovascular, liver and hormonal damage in this context tends to be permanent. If this is your situation, seeking specialized medical care from an endocrinologist or cardiologist is urgent.",
      },
    },
  },
};

function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="d-flex gap-2">
      {options.map((opt) => (
        <button
          key={String(opt.key)}
          type="button"
          className={`btn flex-fill fw-medium ${
            value === opt ? "option-btn" : "btn-outline-secondary"
          }`}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MessageCard({ severity, title, text }) {
  return (
    <div className={`sim-msg sim-msg--${severity} mb-2`}>
      <div className="d-flex align-items-center gap-2 mb-1">
        <span className={`sim-msg__dot sim-msg__dot--${severity}`} />
        <strong className={`sim-msg__title sim-msg__title--${severity}`}>
          {title}
        </strong>
      </div>
      <p className="sim-msg__text mb-0">{text}</p>
    </div>
  );
}

export default function Simulador() {
  const t = useTranslation(T, "Simulador.T");

  const [age, setAge] = useState(25);
  const [sex, setSex] = useState("M");
  const [frequency, setFrequency] = useState("occasional");
  const [duration, setDuration] = useState(6);
  const [route, setRoute] = useState("injectable");
  const [stacking, setStacking] = useState(false);

  const [result, setResult] = useState(null);
  const [messages, setMessages] = useState([]);

  function formatDuration(months) {
    if (months < 12) return `${months} ${months === 1 ? t.durationMonth : t.durationMonths}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (rem === 0) return `${years} ${years === 1 ? t.durationYear : t.durationYears}`;
    return `${years}${t.durationYear[0]} ${rem}${t.durationMonth[0]}`;
  }

  function handleCalculate() {
    const params = { age, sex, frequency, months: duration, route, stacking };

    const score = calculateRiskScore(params);
    const msgs = getContextualMessages({ ...params, score });

    setResult(score);
    setMessages(msgs);
  }

  const profile = result !== null ? getRiskProfile(result) : null;

  return (
    <section id="simulador" className="sim-wrapper sim-page-spacing">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7 col-xl-6">
            {/* Cabeçalho */}
            <h2 className="text-center text-white fw-bold mb-2">
              {t.title}
            </h2>
            <p className="text-center text-secondary small mb-4">
              {t.subtitle}
            </p>

            {/* Card do formulário */}
            <div className="sim-card p-4">
              {/* Idade */}
              <div className="mb-4">
                <label className="form-label text-secondary small mb-1">
                  {t.ageLabel} <strong className="text-white">{age}</strong>
                </label>
                <input
                  type="range"
                  className="form-range sim-range"
                  min={15}
                  max={60}
                  step={1}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                />
                <div className="d-flex justify-content-between sim-ticks">
                  <span>15</span>
                  <span>60</span>
                </div>
              </div>

              {/* Sexo biológico */}
              <div className="mb-4">
                <label className="form-label text-secondary small mb-2">
                  {t.sexLabel}
                </label>
                <ToggleGroup options={t.sexOptions} value={sex} onChange={setSex} />
              </div>

              {/* Frequência de uso */}
              <div className="mb-4">
                <label className="form-label text-secondary small mb-2">
                  {t.frequencyLabel}
                </label>
                <ToggleGroup options={t.frequencyOptions} value={frequency} onChange={setFrequency} />
              </div>

              {/* Duração */}
              <div className="mb-4">
                <label className="form-label text-secondary small mb-1">
                  {t.durationLabel}{" "}
                  <strong className="text-white">
                    {formatDuration(duration)}
                  </strong>
                </label>
                <input
                  type="range"
                  className="form-range sim-range"
                  min={1}
                  max={60}
                  step={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
                <div className="d-flex justify-content-between sim-ticks">
                  <span>{t.durationTickMin}</span>
                  <span>{t.durationTickMax}</span>
                </div>
              </div>

              {/* Via de administração */}
              <div className="mb-4">
                <label className="form-label text-secondary small mb-2">
                  {t.routeLabel}
                </label>
                <ToggleGroup options={t.routeOptions} value={route} onChange={setRoute} />
              </div>

              {/* Usa mais de um composto */}
              <div className="mb-4">
                <label className="form-label text-secondary small mb-2">
                  {t.stackingLabel}
                </label>
                <ToggleGroup options={t.stackingOptions} value={stacking} onChange={setStacking} />
              </div>

              {/* Botão de cálculo */}
              <button
                className="btn option-btn w-100 py-2 fw-semibold"
                onClick={handleCalculate}
              >
                {t.calculate}
              </button>

              {/* Bloco de resultado — só aparece após o cálculo */}
              {result !== null && profile && (
                <div className="mt-4">
                  {/* Score */}
                  <div
                    className="sim-result text-center p-4 rounded-3 mb-3"
                    style={{
                      border: `1px solid ${profile.hex}44`,
                      background: `${profile.hex}11`,
                    }}
                  >
                    <div className="sim-score" style={{ color: profile.hex }}>
                      {result}%
                    </div>
                    <div
                      className="fw-semibold mt-1"
                      style={{ color: profile.hex }}
                    >
                      {t.riskPrefix} {t.riskLabels[profile.key]}
                    </div>
                    <div className="progress sim-progress mt-3">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${result}%`, background: profile.hex }}
                        aria-valuenow={result}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <small className="text-muted d-block mt-2">
                      {t.scoreNote}
                    </small>
                  </div>

                  {/* Mensagens contextuais */}
                  {messages.length > 0 && (
                    <>
                      <p className="sim-msg-header">
                        {t.factorsFound(messages.length)}
                      </p>
                      {messages.map((msg, i) => (
                        <MessageCard key={i} severity={msg.severity} {...t.messages[msg.key]} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            {/* /sim-card */}
          </div>
        </div>
      </div>
    </section>
  );
}
