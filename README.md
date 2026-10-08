# Juicers

Aplicação web desenvolvida como projeto de challenge da FIAP (1º ano) para monitoramento de saúde voltado a usuários que fazem uso de esteroides anabolizantes. O sistema permite acompanhar marcadores laboratoriais, visualizar alertas de risco por sistema orgânico e simular o impacto de compostos no organismo.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 |
| Bundler | Vite 8 |
| Roteamento | React Router DOM 7 |
| Gráficos | Recharts 3 |
| Estilização | CSS modular por componente + Bootstrap 5 |
| Linting | ESLint 9 |

---

## Time

| Nome | Papel |
|---|---|
| Jefferson Gomes | Pesquisa científica, validação médica e organização dos dados de saúde |
| Natalia Lugão | Frontend / UI-UX — construção visual e experiência do usuário |
| Sophia Coelho | Criação dos gráficos interativos e visualização dos dados de saúde |
| Gabriel Soares | Análises de risco, cálculos e regras que processam os dados de saúde do sistema |
| André Melo | Processo criativo do projeto, construção do pitch e apresentação da proposta |

---

## Arquitetura

```
src/
├── App.jsx                  # Configuração de rotas e providers globais
├── main.jsx                 # Entrypoint
├── pages/                   # Páginas (uma por rota)
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Perfil.jsx
│   └── Sobre.jsx
├── components/              # Componentes reutilizáveis e seções
│   ├── Navbar.jsx / Footer.jsx / Topbar.jsx / Layout.jsx
│   ├── inicio/              # Seção hero da Home
│   ├── painel/              # Painel de visão geral na Home
│   ├── mapaCorporal/        # Mapa corporal interativo (HumanBody)
│   ├── simulador/           # Simulador de compostos e riscos
│   ├── perfilDoUsuario/     # Cards de métricas, gráficos e alertas do Perfil
│   │   └── graficos/        # Gráficos por sistema (Recharts)
│   ├── sobreProjeto/        # Contextualização, time e stacks
│   ├── Acessibilidade/      # Menu e botões de acessibilidade
│   ├── LeitorDeAudio/       # Leitor de áudio (screen reader próprio)
│   ├── DadosConta.jsx       # Formulário de dados pessoais (persiste em localStorage)
│   ├── HistoricoExames.jsx  # Listagem cronológica de exames
│   └── OnboardingForm.jsx   # Formulário de onboarding inicial
└── style/                   # Arquivos CSS individuais por componente
```

**Persistência:** os dados da conta do usuário são salvos no `localStorage` com a chave `dadosContaCicloRisco` e carregados dinamicamente na página de perfil.

---

## Fluxo de Navegação

```
/ (Home)
├── Início       — hero com apresentação do produto
├── Painel       — visão geral dos principais indicadores
├── Mapa Corporal — corpo humano interativo com sistemas de risco
└── Simulador    — simulação de efeitos de compostos

/sobre
├── Contextualização — problema e proposta
├── Time             — membros do projeto
└── Stacks Usadas    — tecnologias

/login           — autenticação do usuário

/perfil          — dashboard individual
├── Topbar           — identificação e resumo do ciclo
├── Dados da Conta   — accordion com formulário editável
├── Métricas         — cards com testosterona, LDL, TGO/TGP, HDL
├── Gráfico          — evolução temporal por sistema orgânico
├── Alertas / Exames / Insights — painel lateral
└── Histórico de Exames — linha do tempo completa

/conta           — edição isolada dos dados da conta
```

Componentes de acessibilidade (`AccessibilityMenu` e `LeitorDeAudio`) são montados globalmente no `App.jsx` e ficam disponíveis em todas as rotas.

---

## Como rodar

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173` por padrão.

---

## Verificação do CRM no cadastro médico

O cadastro de médicos consulta o Web Service oficial do Conselho Federal de Medicina. O backend confirma que a inscrição está **Regular** e valida que CRM, UF, CPF e data de nascimento correspondem ao mesmo médico. CPF e data de nascimento são encaminhados ao CFM durante a verificação e não são persistidos pela aplicação. O perfil médico e suas rotas protegidas só são liberados após a confirmação.

Contas médicas criadas antes dessa integração podem ser preservadas: ao tentar entrar, o médico é encaminhado para uma etapa de revalidação. Após a conferência pelo CFM, o sistema atualiza o registro médico existente e mantém a mesma conta, senha, pacientes e dados já cadastrados.

### Modo local de apresentação sem licença CFM

Para uma apresentação local enquanto o acesso ao CFM não foi contratado, é possível liberar **somente contas médicas já existentes** no banco que também tenham um perfil em `doctors`. No `.env` do backend, use `NODE_ENV=development` e `ALLOW_LEGACY_DOCTOR_DEMO=true`. Esse modo não verifica nem afirma que o CRM está ativo; o painel exibe um aviso de demonstração. Ele não funciona em produção e não permite criar novas contas médicas sem a verificação oficial.

Para habilitar a integração, configure no ambiente do backend:

```env
MONGO_URI=mongodb://...
JWT_SECRET=seu-segredo-jwt
CFM_ACCESS_KEY=chave-fornecida-pelo-cfm
```

Copie `backend/.env.example` para `backend/.env` e preencha os valores antes de iniciar o servidor na pasta `backend`.

Sem `CFM_ACCESS_KEY`, o cadastro de médico falha de forma fechada; cadastros de pacientes continuam disponíveis. A chave deve permanecer somente no servidor e nunca ser incluída no frontend.

O CFM exige que a própria pessoa jurídica usuária solicite acesso ao Web Service, assine o termo aplicável e receba uma chave válida. Consulte as regras, finalidade de uso e valores vigentes diretamente no [CFM](https://sistemas.cfm.org.br/listamedicos/informacoes). Não use a chave de outra organização nem publique os dados consultados.

Referências oficiais: [Web Service de consulta de médicos](https://sistemas.cfm.org.br/listamedicos/informacoes), [especificação técnica SOAP](https://sistemas.cfm.org.br/listamedicos/arquivos/manualwebservices.pdf) e [Resolução CFM nº 2.309/2022](https://sistemas.cfm.org.br/normas/arquivos/resolucoes/BR/2022/2309_2022.pdf).
