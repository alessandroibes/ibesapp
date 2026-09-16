# Prompt 10 — Módulos institucionais e administrativos

## Pré-condição

Execute somente depois dos prompts 06 a 09 estarem concluídos, validados e registrados em commits próprios.

## Leitura obrigatória

Leia integralmente `AGENTS.md`, `DECISIONS.md`, `README.md`, toda a documentação de domínio relacionada, `docs/architecture/DOMAIN-FOUNDATION.md`, `docs/architecture/FINANCEIRO-E-ACERVO-HISTORICO.md`, `docs/ux/`, `docs/security/SECURITY-BASELINE.md`, as validações existentes e `plans/UX-REDESIGN-ROADMAP.md`.

## Objetivo

Execute somente a Etapa UX 10: migrar Igreja e Embaixada, Conselheiros/lideranças, Manuais, Financeiro e Acervo Histórico para os padrões consolidados.

## Escopo obrigatório

### Igreja e Embaixada

- Apresentar dados institucionais como resumo estruturado, evitando parágrafos de campos concatenados.
- Mover edição extensa para página própria.
- Organizar Conselheiros, lideranças vigentes e histórico com ações contextualizadas.

### Manuais

- Criar listagem de Manuais/versões e detalhe das tarefas.
- Distinguir versão ativa no contexto histórico sem permitir migração de versão não documentada.
- Manter tarefas como dados versionados, sem páginas, checklist ou conteúdo detalhado.

### Financeiro

- Exibir resumo de entradas, saídas e saldo com filtros de período e iniciativa.
- Organizar lançamentos em listagem própria.
- Usar página ou diálogo adequado para incluir/editar lançamento.
- Preservar edição e exclusão livres, sem inventar auditoria funcional.
- Confirmar exclusão com descrição clara do lançamento afetado.

### Acervo Histórico

- Apresentar marcos em linha do tempo legível e filtrável.
- Criar detalhe do marco com pessoas, atividade e anexos relacionados.
- Separar inclusão/edição da linha do tempo.
- Manter fotos/documentos privados e operações livres de edição/remoção conforme decisão vigente.

## Restrições

- Não inventar dados da Igreja, versões de Manuais ou tarefas do Emérito.
- Não transformar o financeiro simples da Embaixada em contabilidade da Igreja.
- Não criar conciliação, categorias obrigatórias, fechamento ou auditoria financeira.
- Não alterar regras de upload, privacidade ou autorização.
- Não implementar Dashboard ou Relatórios.
- Não avançar para a consolidação antes de concluir e validar esta etapa.

## Critérios de aceite

- Nenhuma listagem contém formulários extensos sempre expostos.
- Resumos usam valores legíveis, placeholders coerentes e linguagem natural.
- Operações de upload mostram tipo, tamanho, progresso, sucesso e erro adequadamente.
- Exclusões e remoções possuem confirmação acessível.
- Histórico institucional e financeiro continua isolado por Igreja.
- Todos os módulos usam os mesmos componentes, espaçamentos e padrões de ação.

## Validação obrigatória

- testes de componentes e E2E dos fluxos principais de cada módulo;
- testes de uploads privados, autorização e tenant;
- Axe, teclado e responsividade;
- build, lint, typecheck, formatação e testes web/mobile/.NET;
- migrations e OpenAPI sem divergências não justificadas;
- auditoria de dependências e `git diff --check`;
- documentação em `docs/quality/UX-MODULOS-ADMINISTRATIVOS-VALIDATION.md`.

Ao final, apresente entregas, decisões, problemas, limitações, evidências e comandos locais.

