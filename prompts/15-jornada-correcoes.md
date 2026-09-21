# Prompt 15 — Correções da Jornada e numeração de tarefas

## Pré-condição

Execute somente depois dos prompts 12 a 14 estarem concluídos, validados e registrados em commits próprios.

## Leitura obrigatória

Leia integralmente `AGENTS.md`, `DECISIONS.md`, `README.md`, `docs/domain/BUSINESS-RULES.md`, `docs/domain/DOMAIN-MODEL.md`, `docs/architecture/DOMAIN-FOUNDATION.md`, `docs/ux/`, `docs/security/`, testes atuais de Progressão e `plans/USABILITY-FEEDBACK-ROADMAP.md`.

## Objetivo

Executar somente a Etapa 15: permitir a correção controlada da data de conclusão de Requisitos Mínimos e tarefas e apresentar a numeração das tarefas.

## Escopo obrigatório

- Permitir edição direta da data, sem exigir motivo e sem criar histórico funcional de correção.
- Manter concorrência otimista e exigir conta vinculada a Conselheiro ativo com permissão de progressão.
- Revalidar idade na data do fato, data futura, ingresso no Posto, admissão, conclusão do Posto e demais dependências cronológicas.
- Bloquear correção que torne a trajetória inconsistente, salvo decisão explícita em contrário.
- Não recalcular ou alterar silenciosamente admissão, permanência, conclusão de Posto ou ingresso seguinte.
- Expor identificadores/versões necessários no contrato sem vazar dados pessoais.
- Oferecer ação acessível de “Corrigir data” somente em itens concluídos e permitidos.
- Exibir cada tarefa como `Tarefa N: nome`, com `N` derivado de `OrdemExibicao + 1` da versão do Manual; não extrair número do texto nem usar enum.
- Aplicar a mesma representação nos pontos web/mobile que exibem tarefas.
- Preservar tarefas concluíveis em qualquer ordem; o número é identificação visual, não pré-requisito.

## Restrições

- Não permitir troca da tarefa ou requisito durante a correção.
- Não remover conclusão nesta etapa, salvo decisão expressa da Etapa 12.
- Não alterar versão do Manual vinculada ao Posto.
- Não editar Manuais nesta etapa.
- Não avançar para Agenda.

## Critérios de aceite

- Datas válidas podem ser corrigidas e aparecem imediatamente na Jornada.
- Datas incompatíveis retornam mensagem clara e não alteram nenhum fato.
- A correção substitui a data cadastrada e permanece isolada por Igreja; a auditoria técnica automática não acrescenta etapas à operação.
- A numeração permanece estável conforme a ordem da versão e não impõe sequência de conclusão.

## Validação obrigatória

- testes de domínio e integração para todas as fronteiras cronológicas, autorização, tenant e concorrência;
- testes web/mobile da ação de correção e numeração;
- E2E de concluir, corrigir, recarregar e rejeitar inconsistência;
- build, lint, typecheck, formatação e testes web/mobile/.NET;
- migrations e OpenAPI validados;
- auditorias de dependência e `git diff --check`;
- documentação em `docs/quality/JORNADA-CORRECOES-VALIDATION.md`.

Ao final, apresente funcionalidades, decisões, problemas, riscos, resultados e comandos locais.
