# Prompt 17 — Gestão de configurações e remoções da Agenda

## Pré-condição

Execute somente depois dos prompts 12 a 16 estarem concluídos, validados e registrados em commits próprios.

## Leitura obrigatória

Leia integralmente `AGENTS.md`, `DECISIONS.md`, `README.md`, `docs/domain/AGENDA-E-REUNIOES.md`, `docs/domain/BUSINESS-RULES.md`, `docs/architecture/OPERACAO-AGENDA.md`, `docs/architecture/FINANCEIRO-E-ACERVO-HISTORICO.md`, `docs/ux/`, `docs/security/`, validações atuais da Agenda e `plans/USABILITY-FEEDBACK-ROADMAP.md`.

## Objetivo

Executar somente a Etapa 17: completar a gestão de modelos, entidades promotoras e tipos de atividade e permitir remoções seguras na Agenda.

## Escopo obrigatório

- Tornar edição de modelos de roteiro encontrável e clara; permitir alterar nome, itens, ordem, duração e observações.
- Excluir fisicamente modelo somente quando nunca usado; quando já usado, permitir edição para preparações futuras ou arquivamento e preservar a cópia do roteiro em reuniões existentes.
- Permitir editar diretamente o nome de Entidade promotora e Tipo de atividade com concorrência e validação de duplicidade, sem exigir justificativa ou histórico funcional.
- Manter referências existentes coerentes ao editar nomes.
- Excluir atividade simples ou série inteira somente quando não houver reunião ou outra dependência. Em série recorrente, deixar explícito que a exclusão alcança toda a série; ocorrência individual é cancelada por exceção.
- Permitir desfazer reunião preparada sem frequência, mantendo a atividade na Agenda.
- Antes de remover, verificar reuniões, frequência, exceções, atividades relacionadas, lançamentos financeiros e marcos históricos.
- Preservar primeira reunião e frequências de reunião cancelada conforme decisões vigentes.
- Exibir confirmação descritiva informando exatamente o alcance: ocorrência, série, reunião preparada ou atividade inteira.
- Retornar conflito orientativo quando a política exigir cancelamento em vez de exclusão.
- Atualizar web e mobile para lidar com registros removidos/arquivados sem referências quebradas.

## Restrições

- Não apagar frequência ou histórico auditado.
- Não fazer cascade delete implícito de financeiro, acervo ou atividade relacionada.
- Não confundir cancelamento com exclusão.
- Não criar novos estados de atividade sem decisão.
- Não excluir em massa por conveniência da UI.

## Critérios de aceite

- Modelos podem ser editados e retirados de uso conforme a política confirmada.
- Promotoras e tipos podem ser corrigidos sem quebrar atividades históricas.
- Uma remoção simples desaparece das consultas após confirmação.
- Ocorrência individual cancelada permanece como exceção da série, e reunião desfeita não remove sua atividade.
- Uma remoção com dependência histórica é bloqueada ou convertida em ação explícita confirmada, nunca silenciosa.
- Operações são isoladas por Igreja, autorizadas e concorrentes; histórico funcional permanece somente nos acontecimentos que `DECISIONS.md` manda preservar.

## Validação obrigatória

- testes de domínio/API para cada matriz de dependências e alcance de remoção;
- testes de tenant, permissão, concorrência, FKs e dos históricos especificamente exigidos;
- testes web de editar/remover, confirmações, conflitos e estados;
- E2E de modelo, promotora, tipo, atividade simples, recorrência e reunião com frequência;
- regressão explícita da primeira reunião e de reunião cancelada;
- Axe, teclado e responsividade;
- build, lint, typecheck, formatação e testes web/mobile/.NET;
- migrations e OpenAPI validados;
- auditorias de dependência e `git diff --check`;
- documentação em `docs/quality/AGENDA-GESTAO-VALIDATION.md`.

Ao final, apresente funcionalidades, decisões, problemas, riscos, resultados e comandos locais.
