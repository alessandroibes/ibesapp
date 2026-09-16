# Prompt 09 — Organização e Competições

## Pré-condição

Execute somente depois dos prompts 06, 07 e 08 estarem concluídos, validados e registrados em commits próprios.

## Leitura obrigatória

Leia integralmente `AGENTS.md`, `DECISIONS.md`, `README.md`, `docs/domain/COMPETICOES-E-PROVAS.md`, `docs/domain/BUSINESS-RULES.md`, `docs/architecture/ORGANIZACAO-INTERNA.md`, `docs/architecture/COMPETICOES-E-ESCALACOES.md`, `docs/architecture/PERMISSIONS.md`, `docs/ux/`, `docs/security/SECURITY-BASELINE.md`, as validações existentes de Organização/Competições e `plans/UX-REDESIGN-ROADMAP.md`.

## Objetivo

Execute somente a Etapa UX 09: separar e padronizar os fluxos de Consulados, Diretoria, mandatos, aptidões, competições, provas e escalações.

## Escopo obrigatório

### Organização

- Criar navegação clara entre Consulados e Diretoria.
- Apresentar lista e detalhe de Consulado, membros vigentes, Cônsul e histórico.
- Tornar transferência uma ação explícita, preservando encerramento/início na mesma data.
- Apresentar mandatos, cargos, vagas e ocupações com distinção clara entre atual e histórico.
- Permitir visualizar acúmulo válido de funções sem sugerir equivalência com Posto ou Permissão.
- Mostrar preferência de vínculo como Membro apenas como informação, sem bloqueio.

### Competições

- Separar catálogo de modalidades/provas da operação de uma competição.
- Criar listagem e detalhe de competição.
- Organizar provas, aptidões, elegibilidade e escalações em áreas próprias do detalhe.
- Exibir somente candidatos aptos e elegíveis conforme o servidor.
- Mostrar titulares, reservas, limites e conflitos de forma compreensível.
- Destacar situação Rascunho/Finalizada e exigir confirmação para finalizar ou reabrir.
- Preservar histórico e auditoria de finalização/reabertura.

## Restrições

- Não associar Cargo, Cônsul ou Posto a permissão de software.
- Não alterar quantidade de vagas, acumulação de cargos, critérios de Cônsul ou regras de mandato.
- Não alterar aptidão humana, elegibilidade calculada, data-base ou limites de prova.
- Não criar regras esportivas ou categorias novas.
- Não alterar APIs/banco por conveniência sem demonstrar necessidade e solicitar decisão quando aplicável.
- Não avançar para módulos administrativos.

## Critérios de aceite

- Listagens e detalhes possuem URLs estáveis e retorno previsível.
- Atual e histórico são visualmente distinguíveis sem depender apenas de cor.
- Ações indisponíveis explicam o motivo quando isso ajudar a operação.
- Formulários extensos não permanecem sempre abertos nas páginas de listagem.
- Desktop e celular permitem concluir as jornadas críticas sem perda de contexto.
- Permissões e isolamento por Igreja permanecem intactos.

## Validação obrigatória

- testes de componentes para listas, detalhes, estados e confirmações;
- E2E de Consulado, transferência, Cônsul, mandato, aptidão, escalação, finalização e reabertura;
- testes .NET de limites, concorrência, histórico e tenant;
- Axe e navegação por teclado nas páginas principais;
- validação responsiva nos breakpoints definidos;
- build, lint, typecheck, formatação e testes web/mobile/.NET;
- migrations, OpenAPI, dependências e `git diff --check`;
- documentação em `docs/quality/UX-ORGANIZACAO-COMPETICOES-VALIDATION.md`.

Ao final, apresente entregas, decisões, problemas, riscos, evidências e comandos locais.

