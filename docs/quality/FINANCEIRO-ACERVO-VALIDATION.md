# Validação de financeiro e acervo histórico

Validação da fase executada em 16/09/2026:

- 81 testes .NET aprovados com PostgreSQL 17 descartável;
- build .NET sem avisos ou erros e `dotnet format` sem alterações pendentes;
- 10 testes web, lint, build de produção e formatação aprovados;
- 9 testes mobile, lint, TypeScript e formatação aprovados;
- 5 testes E2E aprovados contra a imagem Docker, incluindo o fluxo financeiro/acervo e acessibilidade;
- migration `FinanceiroEAcervoHistorico` aplicada pelo container com código 0;
- cinco tabelas confirmadas nos schemas `financeiro` e `acervo`;
- modelo EF sem mudanças pendentes e script idempotente gerado;
- API saudável e contrato OpenAPI compartilhado regenerado.

Os testes específicos cobrem:

- entradas e saídas com valor positivo, duas casas decimais e motivo;
- agrupamento e saldo por iniciativa;
- edição e exclusão livre de lançamentos;
- marco com data ou período e linha do tempo anual;
- autoria e relacionamento com pessoas;
- upload e download privado de PNG, JPEG e PDF até 10 MB;
- substituição e exclusão de anexos;
- ausência deliberada de auditoria funcional para financeiro e acervo;
- filtros globais por Igreja e rejeição de chave estrangeira entre tenants;
- permanência integral das regras de progressão das fases anteriores.

O teste de migrations atualiza desde a primeira migration, preserva os dados das fases anteriores, confirma as seis migrations aplicadas e reaplica o script idempotente duas vezes.
