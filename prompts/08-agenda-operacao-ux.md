# Prompt 08 — Agenda e operação semanal

## Pré-condição

Execute somente depois dos prompts 06 e 07 estarem concluídos, validados e registrados em commits próprios.

## Leitura obrigatória

Leia integralmente `AGENTS.md`, `DECISIONS.md`, `README.md`, `docs/domain/AGENDA-E-REUNIOES.md`, `docs/domain/BUSINESS-RULES.md`, `docs/architecture/OPERACAO-AGENDA.md`, `docs/ux/`, `docs/security/SECURITY-BASELINE.md`, `docs/quality/OPERACAO-AGENDA-VALIDATION.md`, `docs/quality/DEFINITION-OF-DONE.md` e `plans/UX-REDESIGN-ROADMAP.md`.

## Objetivo

Execute somente a Etapa UX 08: reorganizar Agenda, atividades, reuniões, ocorrências, chamada e configurações operacionais usando o design system consolidado.

## Escopo obrigatório

- Fazer de `/agenda` uma entrada clara para Hoje/Próximos, Lista, Mês e Ano, preservando as visualizações documentadas.
- Corrigir o calendário para que eventos não provoquem crescimento vertical anormal nem uma única coluna excessivamente longa.
- Exibir detalhes resumidos do dia e permitir abrir atividade/ocorrência em rota ou painel adequado.
- Separar cadastro e edição de atividade dos filtros e do calendário.
- Organizar detalhe de atividade, recorrência, exceções, ocorrências e situação sem apagar histórico.
- Destacar Preparar reunião e Chamada como fluxos operacionais de poucos toques.
- Manter os quatro estados de frequência exatamente como documentados.
- Manter visitante como Pessoa com cadastro mínimo.
- Manter primeira reunião derivada e presenças de reunião cancelada no cálculo.
- Separar tipos de atividade, entidades promotoras e modelos de roteiro em Configurações da Agenda.
- Preservar recorrência, exceções, eventos de vários dias, prazos e entidades promotoras.
- Garantir experiência móvel adequada para chamada e consulta rápida.

## Restrições

- Não alterar regras de frequência, recorrência, cancelamento ou primeira reunião.
- Não transformar ausência de lançamento em falta.
- Não excluir registros históricos para simplificar a interface.
- Não criar novos estados de atividade ou frequência.
- Não avançar para os módulos das etapas seguintes.
- Se a navegação desejada exigir contrato novo ou decisão funcional, pare e apresente opções.

## Critérios de aceite

- Calendário desktop permanece legível com muitos eventos.
- A agenda móvel não exige rolagem horizontal da página.
- Filtros têm rótulos, estado restaurável e ação clara para limpar.
- Cadastro de atividade não fica permanentemente exposto abaixo do calendário.
- Chamada continua rápida, acessível e resistente a envio duplicado.
- Cancelados permanecem visíveis como histórico.

## Validação obrigatória

- testes de visualizações, filtros, rotas e estados;
- E2E de agenda, recorrência, exceção, visitante, chamada e cancelamento;
- cenários com muitos eventos no mesmo dia e no mesmo mês;
- Axe em calendário, formulário, detalhe e chamada;
- validação responsiva em 320, 390, 768, 1024 e 1440 px;
- build, lint, typecheck, formatação e testes web/mobile;
- todos os testes .NET e validação de isolamento multi-tenant;
- migrations e OpenAPI sem mudanças não justificadas;
- auditoria de dependências e `git diff --check`;
- documentação em `docs/quality/UX-AGENDA-OPERACAO-VALIDATION.md`.

Ao final, apresente entregas, decisões, problemas, limitações, evidências e comandos locais.

