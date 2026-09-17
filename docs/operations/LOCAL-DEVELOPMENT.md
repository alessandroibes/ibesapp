# Executar a fundação localmente

Pré-requisitos: Docker Desktop com containers Linux, .NET SDK 10.0.302 ou feature band posterior do .NET 10, PowerShell, Node 20.20.2+ (Node 22 usado na CI). O script funciona com Windows PowerShell 5.1 e PowerShell 7.

## Aplicação completa

Na raiz:

```powershell
./scripts/dev-setup.ps1
dotnet dev-certs https --trust
docker compose up --build -d
```

Abrir `https://localhost:7443`. Login fictício: `adulto@example.test`; senha na entrada `BOOTSTRAP_PASSWORD` do `.env` gerado. Não enviar esse arquivo ao Git. A senha só é aplicada na primeira criação do seed; editar `.env` não troca a senha de uma conta existente.

O script gera segredos aleatórios e exporta certificados para `.local/`, também ignorado pelo Git. O Compose provisiona PostgreSQL 17, aplica a migração e cria os dados fictícios. Banco acessível somente pelo loopback na porta 5432. Aplicação HTTPS na porta 7443.

```powershell
docker compose ps
docker compose logs --tail 50 api
docker compose stop
```

Parar containers preserva os volumes. O Compose é exclusivamente para desenvolvimento.

## Backend no host e web com hot reload

Com o banco já provisionado pelo Compose:

```powershell
docker compose stop api
$configLocal = @{}
Get-Content .env | ForEach-Object { $p = $_ -split '=',2; $configLocal[$p[0]] = $p[1] }
$env:ConnectionStrings__Postgres = "Host=localhost;Database=ibes;Username=ibes;Password=$($configLocal.POSTGRES_PASSWORD)"
$env:ASPNETCORE_ENVIRONMENT = 'Development'
dotnet run --project src/Ibes.Api --no-launch-profile --urls https://localhost:7443
```

Em outro terminal:

```powershell
cd apps/web
npm ci
npm run dev
```

Abrir `https://localhost:5173`. O Vite usa os certificados exportados e encaminha chamadas da aplicação ao backend. Não desabilitar TLS/cookies Secure.

## Mobile

```powershell
cd apps/mobile
npm ci
Copy-Item .env.example .env
npm run android
npm start
```

Usar development build, pois callback próprio e módulos nativos não são um fluxo suportado pelo Expo Go. Em dispositivo/emulador, configurar `EXPO_PUBLIC_API_URL` com um endereço HTTPS que ele alcance e cujo certificado seja confiável. `localhost` no dispositivo não aponta para o computador. Alinhar `Auth__Issuer` no backend ao endereço publicado; não desabilitar verificação TLS. Para iOS, executar `npm run ios` em macOS com Xcode. Bundle JS não substitui compilação/validação nativa.

## Verificações

```powershell
dotnet restore --locked-mode
dotnet format --no-restore --verify-no-changes
dotnet build --no-restore
dotnet test --no-restore
npm --prefix apps/web run build
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/mobile run typecheck
npm --prefix apps/mobile run lint
npm --prefix apps/mobile test
```

Os testes .NET iniciam seu próprio PostgreSQL descartável com Testcontainers; não usam o banco local da aplicação. Para E2E, manter Compose ativo, instalar Chromium com `npx playwright install chromium` em `apps/web`, carregar `BOOTSTRAP_PASSWORD` de `.env` no ambiente e executar `npx playwright test --workers=1`. A execução serial evita disputa pelos registros do ambiente demonstrativo. Capturas de referência ficam em `artifacts/`.

## Contrato e migrações

OpenAPI: `https://localhost:7443/openapi/v1.json`. Em `apps/web`, salvar esse JSON em `artifacts/openapi.json` e gerar tipos:

```powershell
curl.exe -kfsS https://localhost:7443/openapi/v1.json -o ../../artifacts/openapi.json
npx openapi-typescript ../../artifacts/openapi.json -o ../../packages/contracts/api.d.ts
```

`-k` acima é somente para o certificado local de desenvolvimento. A CI verifica divergência dos tipos gerados. Endpoints OAuth seguem o discovery em `/.well-known/openid-configuration`.

```powershell
dotnet tool restore
dotnet ef migrations script --idempotent --project src/Ibes.Infrastructure --startup-project src/Ibes.Api --output artifacts/migrations.sql
```

Configurar a connection string no ambiente antes do comando. Em implantação, revisar/aplicar migração separadamente e verificar readiness; não executar rollback destrutivo automaticamente.
