# AGENTS.md

## Missão
Construir um sistema robusto, seguro, eficiente, acessível e visualmente bem elaborado para Embaixadores do Rei, preservando possibilidade de evolução para uma plataforma completa de gestão de igrejas.

## Fonte de verdade
1. Este arquivo.
2. `DECISIONS.md`.
3. `docs/domain/`.
4. `docs/product/`.
5. `docs/architecture/`.
6. `docs/ux/`.
7. `docs/security/`.
8. `plans/`.

Se houver conflito, a regra de negócio mais específica e mais recente documentada prevalece. Não invente regra de negócio.

## Linguagem ubíqua
Conceitos de negócio DEVEM ser nomeados em português brasileiro no código, API, banco, testes e documentação: Embaixada, Embaixador, Candidato, Conselheiro, Posto, Manual, Tarefa, Consulado, Cônsul, Diretoria, Frequência, Atividade, Prova, Competição etc.
Termos técnicos consolidados podem permanecer em inglês: Id, CreatedAt, UpdatedAt, Request, Response, Handler, DbContext, Middleware, DTO, CancellationToken etc.

## Arquitetura
- .NET 10 + ASP.NET Core.
- Monólito modular com vertical slices.
- PostgreSQL.
- Multi-tenancy lógico obrigatório.
- React/Vite no web.
- React Native/Expo no mobile.
- Identity + OpenIddict.
- OpenAPI como contrato.
- Docker para desenvolvimento.
- Observabilidade, auditoria e testes desde o início.

## Regras críticas
- Posto é titulação educacional, nunca patente/hierarquia.
- Cargo organizacional, Posto e Permissão do sistema são conceitos independentes.
- Meninos não possuem login no MVP.
- Dados de menores exigem proteção reforçada.
- Não duplicar dados derivados: primeira reunião vem da frequência; faixa etária vem da data de nascimento/data-base.
- Não hardcode tarefas de manuais em enums.
- Manual é versionado.
- Critérios/checklists e páginas dos manuais estão fora do escopo.
- Tarefas podem ser concluídas em qualquer ordem.
- Cerimônia não bloqueia progressão.
- Aptidão para prova é definida por Conselheiro; elegibilidade etária é calculada pelo sistema.

## Qualidade
Toda feature deve incluir validação, autorização, isolamento de tenant, testes adequados, estados de loading/empty/error, acessibilidade e auditoria quando aplicável.

## Dúvidas
Quando uma decisão de negócio/tecnologia relevante não estiver documentada, pergunte apresentando opções, recomendação e justificativa antes de implementar.
