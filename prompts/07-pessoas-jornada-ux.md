# Prompt 07 — Pessoas e Jornada

## Pré-condição

Execute somente depois de `prompts/06-design-system-shell.md` estar concluído, validado e registrado em commit próprio.

## Leitura obrigatória

Leia integralmente `AGENTS.md`, `DECISIONS.md`, `README.md`, `docs/domain/`, `docs/product/`, `docs/architecture/DOMAIN-FOUNDATION.md`, `docs/architecture/PERMISSIONS.md`, `docs/ux/`, `docs/security/SECURITY-BASELINE.md`, `docs/quality/DEFINITION-OF-DONE.md` e `plans/UX-REDESIGN-ROADMAP.md`.

Revise a implementação entregue pela Etapa UX 06 antes de editar.

## Objetivo

Execute somente a Etapa UX 07: transformar Pessoas e Jornada no módulo de referência do novo design system, preservando integralmente regras de cadastro, inativação, frequência e progressão.

## Escopo obrigatório

- Refinar `/pessoas` como listagem principal.
- Oferecer condições claras para Todos, Embaixadores, Candidatos, Visitantes e Inativos, sem alterar a classificação do servidor.
- Manter busca, paginação, filtros e inclusão de inativos restauráveis pela URL quando tecnicamente adequado.
- Mostrar colunas e informações realmente úteis; mover ações menos frequentes para menu de ações.
- Manter Visualizar como ação evidente e Adicionar pessoa como ação primária.
- Padronizar `/pessoas/nova` e `/pessoas/{id}/editar` com campos agrupados por assunto, ações Salvar/Cancelar e estados de envio.
- Reorganizar `/pessoas/{id}` com resumo superior e áreas Resumo, Jornada, Frequência, Vínculos e Histórico.
- Apresentar Jornada como progresso/linha do tempo, sem sugerir hierarquia militar e sem alterar regras de progressão.
- Manter requisitos e tarefas concluíveis em qualquer ordem.
- Manter cerimônia independente da progressão.
- Manter primeira reunião e faixa etária como dados derivados.
- Manter histórico de responsáveis, vínculos, frequência, postos, cerimônias, inativações e reativações.
- Usar diálogo para inativação/reativação e página própria para edições extensas.
- Garantir que pessoa inativa permaneça fora das operações futuras já documentadas, sem ocultar seu histórico.
- Adequar desktop e celular, evitando ficha vertical monolítica.

## Restrições

- Não alterar critérios de Candidato, Embaixador, Posto, Manual ou permanência.
- Não inventar tarefas, versões de Manual, dados de responsáveis ou regras de carteira.
- Não adicionar login para meninos.
- Não ampliar coleta ou exposição de dados pessoais.
- Não alterar API ou banco apenas para conveniência da tela. Se um contrato indispensável estiver ausente, pare e apresente opções.
- Não avançar para Agenda, Organização, Competições, Financeiro ou Acervo.

## Critérios de aceite

- A listagem permite localizar e agir sobre uma Pessoa sem abrir formulários desnecessários.
- A ficha possui URL estável, estado selecionado acessível e boa leitura em 320 px.
- Ações respeitam permissões e situação ativa/inativa.
- Todos os estados de loading, vazio, erro e sucesso estão presentes.
- Dados sensíveis não aparecem em logs, mensagens globais ou URLs.
- Regras de progressão, idade e histórico continuam cobertas por testes.

## Validação obrigatória

- testes de componentes para lista, filtros, rotas, abas e inativação;
- E2E de cadastro, edição, consulta, Jornada e navegação móvel;
- Axe nas páginas de lista, detalhe e formulário;
- build, lint, typecheck, formatação e testes web/mobile;
- todos os testes .NET, incluindo isolamento de tenant e progressão;
- validação de migrations e OpenAPI sem divergências não justificadas;
- `npm audit --omit=dev` e `git diff --check`;
- documentação em `docs/quality/UX-PESSOAS-JORNADA-VALIDATION.md`.

Ao final, apresente funcionalidades entregues, decisões técnicas, riscos, problemas encontrados, evidências e comandos locais.

