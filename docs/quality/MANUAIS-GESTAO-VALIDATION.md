# Validação — Gestão de Manuais e versões

## Escopo entregue

- Edição direta de identificação, texto e ordem das tarefas de uma versão, com concorrência otimista.
- Página `/manuais/{id}/editar`, com explicação entre Manual do Posto e versão identificada, estado de uso e impacto de alterações.
- Inclusão e retirada de tarefas para os Postos em andamento que usam a versão.
- Postos concluídos mantêm a relação de tarefas aplicáveis e suas conclusões; não são reabertos nem recalculados.
- Migration que registra as tarefas aplicáveis de cada Posto já existente antes de permitir edições futuras.
- Permissão `manuais.gerenciar`, filtro de Igreja e contrato OpenAPI em todas as mutações.

## Resultados

- Testes de domínio, API e migrations cobrem edição, textos, ordem, adição, retirada, duplicidade, concorrência, tenant e preservação da versão vinculada.
- Frontend: 30 testes, lint, typecheck, build e formatação aprovados.
- A especificação OpenAPI foi obtida da API local e regenerou `packages/contracts/api.d.ts`.
- Migration `GestaoManuais` foi aplicada no ambiente local; o health check respondeu `200`.

## Limitações e riscos

- O bundle principal web continua com cerca de 514 kB minificado e o Vite emite aviso de tamanho.
- A auditoria do mobile mantém vulnerabilidades moderadas transitivas do Expo Router já conhecidas; não foi aplicada atualização incompatível automática.
- A remoção de uma tarefa é intencionalmente limitada ao conjunto aplicável de Postos em andamento. A tarefa permanece armazenada para que o histórico de Postos concluídos continue consultável.

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
