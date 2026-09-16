# Validação da organização interna

Validação executada em 15/09/2026:

- build .NET sem avisos;
- 57 testes .NET aprovados com PostgreSQL 17 descartável;
- migration `OrganizacaoInterna` aplicada desde as migrations anteriores, sem alteração pendente de modelo, e script idempotente reaplicado duas vezes;
- testes de isolamento confirmam filtros sem tenant, leitura entre Igrejas e chaves estrangeiras compostas;
- regressões de progressão confirmam idade, admissão, tarefas, permanência, Emérito e trajetória após os 18 anos;
- testes web, lint, build de produção e formatação aprovados;
- testes mobile, lint, TypeScript e formatação aprovados;
- imagem Docker construída, migration concluída com código zero, readiness saudável e sete tabelas confirmadas no schema `organizacao`;
- 3 testes E2E aprovados contra a aplicação publicada no Compose;
- contrato OpenAPI regenerado em `packages/contracts/api.d.ts`.

Os testes de organização cobrem Candidato e Embaixador em Consulado, transferência na mesma data, encerramento associado do Cônsul, Cônsul membro e único, Diretoria exclusiva para Embaixador, quantidade de vagas, acúmulo de cargos, concorrência pela versão do mandato, resultado eleitoral imutável e independência entre cargo e permissão.
