# Roadmap de evolução da experiência web

## Objetivo e limites

Este ciclo reorganiza e aprimora as telas web existentes. Ele não cria regras de negócio nem substitui o roadmap funcional. A fonte de verdade continua sendo, nesta ordem, `AGENTS.md`, `DECISIONS.md`, a documentação do domínio, produto, arquitetura, UX, segurança e planos.

Todas as fases devem preservar:

- linguagem de negócio em português brasileiro;
- autorização e permissões atuais;
- isolamento lógico por Igreja;
- BFF e cookie de sessão;
- OpenAPI como contrato;
- histórico, auditoria e concorrência existentes;
- comportamento dos fluxos mobile;
- acessibilidade WCAG 2.2 AA.

Se uma melhoria visual exigir decisão de negócio, novo endpoint, migration ou mudança de contrato, a execução deve parar e apresentar opções, recomendação e justificativa. Ajustes técnicos de contrato só podem ser feitos quando necessários para representar comportamento já documentado.

## Sequência obrigatória

Os prompts devem ser executados em ordem. Cada fase começa somente depois que a anterior estiver validada e registrada em commit próprio.

### Etapa UX 06 — Fundação visual e shell

Prompt: `prompts/06-design-system-shell.md`

Entregas:

- tokens e componentes fundamentais;
- ícones consistentes;
- shell simplificado;
- sidebar agrupada e responsiva;
- cabeçalho de página reutilizável;
- estados compartilhados;
- redução inicial do CSS global.

Não migrar profundamente os módulos nesta fase.

### Etapa UX 07 — Pessoas e Jornada

Prompt: `prompts/07-pessoas-jornada-ux.md`

Entregas:

- listagem de Pessoas refinada;
- páginas de cadastro e edição padronizadas;
- ficha dividida em Resumo, Jornada, Frequência, Vínculos e Histórico;
- ações de situação consistentes;
- fluxo de Jornada legível em desktop e celular.

Este módulo será a referência visual para as fases seguintes.

### Etapa UX 08 — Agenda e operação semanal

Prompt: `prompts/08-agenda-operacao-ux.md`

Entregas:

- calendário responsivo sem crescimento anormal;
- visualizações de agenda organizadas;
- páginas de atividade e ocorrência;
- chamada destacada;
- configurações de tipos, promotoras e modelos separadas da operação diária.

### Etapa UX 09 — Organização e Competições

Prompt: `prompts/09-organizacao-competicoes-ux.md`

Entregas:

- Consulados, Diretoria e mandatos em fluxos de lista/detalhe;
- competições, provas, aptidões e escalações organizadas por contexto;
- situação de escalação clara;
- históricos legíveis e ações sensíveis confirmadas.

### Etapa UX 10 — Instituição, Manuais, Financeiro e Acervo

Prompt: `prompts/10-modulos-administrativos-ux.md`

Entregas:

- dados institucionais e lideranças reorganizados;
- Manuais e versões com lista/detalhe;
- Financeiro com resumo, filtros e lançamentos;
- Acervo com linha do tempo, detalhe e anexos;
- formulários extensos removidos das páginas de listagem.

### Etapa UX 11 — Consolidação e validação

Prompt: `prompts/11-ux-consolidacao.md`

Entregas:

- remoção de padrões antigos não utilizados;
- consistência final entre módulos;
- validação responsiva, visual, acessível e de performance;
- documentação e evidências atualizadas;
- nenhuma regressão de domínio, segurança ou multi-tenancy.

## Critérios globais de conclusão

- cada módulo possui entrada, listagem, detalhe e edição coerentes com sua complexidade;
- não há página de operação comum com rolagem vertical excessiva causada por formulários sempre expostos;
- ações principais, secundárias e destrutivas são distinguíveis;
- estados de loading, vazio, erro e sucesso são consistentes;
- navegação direta e recarregamento de rotas funcionam;
- permissões continuam ocultando e bloqueando ações adequadamente;
- web compila e passa em lint, typecheck, testes de componentes e E2E;
- mobile passa em lint, typecheck e testes;
- solução .NET compila e todos os testes passam;
- migrations e OpenAPI permanecem sem divergências não justificadas;
- `npm audit --omit=dev` não apresenta vulnerabilidades conhecidas de produção;
- `git diff --check` passa;
- documentação de validação registra comandos, resultados e limitações.

## Itens deliberadamente adiados

- Dashboard operacional: depende da definição dos indicadores e de contratos de agregação.
- Relatórios e aniversariantes: dependem de requisitos de filtros, formato, exportação e autorização; pessoas inativas já devem permanecer excluídas por padrão conforme `DECISIONS.md`.
- Identidade visual oficial: permanece em `docs/product/OPEN-QUESTIONS.md`.
- Reformulação visual do aplicativo React Native: deve ter ciclo próprio após estabilização do design web.
