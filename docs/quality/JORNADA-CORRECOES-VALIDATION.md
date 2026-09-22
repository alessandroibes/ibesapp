# Validação — Jornada: correções e numeração de tarefas

## Escopo entregue

- Correção direta da data de conclusão de Requisitos Mínimos e tarefas, sem motivo ou histórico funcional adicional.
- Ação disponível somente a uma conta com permissão de progressão e vínculo vigente como Conselheiro.
- Validação da idade no fato, de data futura, da admissão e do intervalo entre ingresso e conclusão do Posto.
- Concorrência otimista pela versão da Jornada; a correção atualiza somente o fato escolhido.
- Tarefas expostas como `Tarefa N: nome`, com `N = OrdemExibicao + 1`, no contrato, web e mobile.

## Resultados

- Build .NET Release, formatação e 96 testes de domínio e integração, incluindo fronteiras cronológicas, autorização, concorrência e isolamento de Igreja: aprovados.
- Web: lint, tipos, 29 testes, build e formatação aprovados; o cenário unitário cobre a ação de correção e a numeração.
- Mobile: lint, tipos, 10 testes e formatação aprovados; o cenário cobre a numeração e a chamada `PUT` de correção.
- E2E: 8 cenários aprovados. A Jornada conclui uma tarefa, corrige a data, recarrega a página e rejeita uma data anterior ao ingresso no Posto.
- `dotnet ef migrations has-pending-model-changes`: sem mudanças pendentes. A etapa não exige migration de schema; o script idempotente foi gerado.
- API em Docker foi reconstruída, respondeu à especificação OpenAPI e regenerou `packages/contracts/api.d.ts`.

## Limitações conhecidas

- O bundle principal web tem aproximadamente 510 kB minificado, acima do aviso padrão do Vite.
- A auditoria de dependências do mobile mantém quatro vulnerabilidades moderadas transitivas do Expo Router. A atualização automática exige mudança incompatível de versão e não foi aplicada.
- O console dos testes mobile ainda registra avisos de `act(...)` em testes preexistentes da tela Pessoas; a suíte permanece aprovada.

## Comandos locais

```powershell
docker compose up -d --build

$configLocal = Get-Content .env | ConvertFrom-StringData
$env:ConnectionStrings__Postgres = "Host=localhost;Database=ibes;Username=ibes;Password=$($configLocal.POSTGRES_PASSWORD)"
dotnet ef migrations has-pending-model-changes --project src/Ibes.Infrastructure/Ibes.Infrastructure.csproj --startup-project src/Ibes.Api/Ibes.Api.csproj --context AppDbContext

dotnet test Ibes.slnx --no-restore

cd apps/web
npm test
npm run build

cd ../mobile
npm test
```
