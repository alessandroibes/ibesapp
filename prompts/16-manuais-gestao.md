# Prompt 16 — Gestão de Manuais e versões

## Pré-condição

Execute somente depois dos prompts 12 a 15 estarem concluídos, validados e registrados em commits próprios.

## Leitura obrigatória

Leia integralmente `AGENTS.md`, `DECISIONS.md`, `README.md`, toda a documentação de Progressão/Manuais, `docs/ux/`, `docs/security/`, validações existentes e `plans/USABILITY-FEEDBACK-ROADMAP.md`.

Revise a Jornada e o contrato entregues na Etapa 15 antes de editar.

## Objetivo

Executar somente a Etapa 16: permitir corrigir e organizar diretamente Manuais e versões, inclusive quando já vinculados a Jornadas.

## Escopo obrigatório

- Permitir editar diretamente identificação da versão, texto e ordem das tarefas, mesmo quando a versão já estiver em uso.
- Explicar na interface a diferença entre Manual do Posto e versão identificada.
- Aplicar a decisão da Etapa 12 ao adicionar e remover tarefas em versões usadas.
- Detectar uso da versão e Postos concluídos no servidor para aplicar essa decisão; não confiar apenas no estado da tela.
- Preservar a mesma versão vinculada à Jornada; editar não cria migração nem exige cópia.
- Manter identidade estável das tarefas que continuam existindo, inclusive ao alterar texto ou ordem.
- Não migrar Jornada existente para versão nova.
- Manter o Manual do Emérito indisponível até definição oficial.
- Criar rota de edição coerente, por exemplo `/manuais/{id}/editar`, e atualizar mapa de telas.
- Incluir estados de versão usados/não usados em linguagem clara e acessível.

## Restrições

- Não permitir trocar o Posto de uma versão existente.
- Não inventar edição/ano, tarefas, páginas, checklist ou critérios.
- Não trocar silenciosamente a versão vinculada a uma Jornada.
- Não transformar ordem em pré-requisito de conclusão.
- Não avançar para Agenda.

## Critérios de aceite

- Versão pode ser editada diretamente com concorrência, sem justificativa ou histórico funcional detalhado.
- A Jornada vinculada passa a mostrar a versão corrigida sem trocar seu Id.
- Postos já concluídos permanecem fatos oficiais conforme a decisão sobre tarefas adicionadas/removidas.
- Tenant e permissão `manuais.gerenciar` são exigidos em todas as mutações.

## Validação obrigatória

- testes de domínio/API para edição, versão usada, texto, ordem, adição/remoção, duplicidade, tenant, permissão e concorrência;
- testes web e E2E de criar, editar e consultar a versão corrigida na Jornada existente;
- Axe, teclado e responsividade;
- build, lint, typecheck, formatação e testes web/mobile/.NET;
- migrations e OpenAPI validados;
- auditorias de dependência e `git diff --check`;
- documentação em `docs/quality/MANUAIS-GESTAO-VALIDATION.md`.

Ao final, apresente funcionalidades, decisões, problemas, riscos, resultados e comandos locais.
