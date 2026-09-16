# Validação de competições

Validação executada em 16/09/2026:

- 73 testes .NET aprovados com PostgreSQL 17 descartável;
- 8 testes web, lint, build de produção e formatação aprovados;
- 9 testes mobile, lint, TypeScript e formatação aprovados;
- 4 testes E2E aprovados contra a imagem Docker;
- migration `CompeticoesEProvas` aplicada ao banco das fases anteriores e nove tabelas confirmadas no schema `competicoes`;
- imagem saudável e contrato OpenAPI conferido com os tipos compartilhados.

Os testes específicos cobrem:

- Candidatos e Embaixadores aptos;
- filtro conjunto de aptidão e elegibilidade;
- limites exatos das categorias na data-base;
- referência obrigatória para Biografia Missionária e Conhecimentos Gerais da Bíblia;
- mínimo e quantidade exata de titulares;
- máximo total contando titulares e reservas;
- limite específico de reservas;
- bloqueio de alterações após finalização;
- reabertura motivada e histórico imutável;
- avisos de conflito em horários sobrepostos;
- filtros de tenant e chaves estrangeiras compostas.

O teste de migrations também confirma ausência de alteração pendente no modelo e reaplica o script idempotente.
