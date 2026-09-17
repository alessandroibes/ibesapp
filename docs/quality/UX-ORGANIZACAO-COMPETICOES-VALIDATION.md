# Validação de Organização e Competições

Validação da Etapa UX 09 executada em 17/09/2026.

## Escopo entregue

- Organização foi separada em Consulados e Diretoria, com URLs estáveis para listas e detalhes.
- O detalhe de Consulado apresenta membros vigentes, Cônsul vigente e histórico textual de vínculos e lideranças.
- Transferência é uma ação explícita e informa que encerramento e início ocorrem na mesma data.
- Diretoria apresenta cargos, vagas, mandatos atuais/históricos, ocupações, eleições e preferência de vínculo como informação sem bloqueio.
- Competições foi separada em lista, cadastro, catálogo de modalidades/provas, aptidões e detalhe operacional.
- O detalhe apresenta data-base, provas, titulares, reservas, limites, conflitos e candidatos aptos/elegíveis retornados pelo servidor.
- Finalização e reabertura possuem confirmação explícita; reabertura exige motivo e ambas permanecem no histórico.
- Formulários contextuais foram movidos para diálogos e formulários extensos possuem página própria.
- As páginas foram adaptadas para desktop e celular sem rolagem horizontal nos breakpoints exigidos.

## Decisões técnicas

- As rotas `/organizacao/*` e `/competicoes/*` usam navegação aninhada, mantendo as entradas anteriores válidas.
- Todas as escritas continuam usando os endpoints, versões de concorrência, permissões e validações existentes.
- Atual e histórico sempre são identificados por texto e badge, sem depender apenas de cor.
- Cargo, Cônsul, Posto e permissão permanecem independentes; nenhuma associação foi criada na interface.
- Aptidão e elegibilidade não são recalculadas no cliente. A lista da escalação usa exclusivamente os candidatos retornados pelo servidor.
- Nenhum endpoint, entidade, migration ou contrato compartilhado foi alterado.

## Resultados

| Validação | Resultado |
| --- | --- |
| Web Prettier, ESLint e TypeScript | aprovado |
| Web Vitest | 8 arquivos e 20 testes aprovados |
| Web build Vite | aprovado; pacote inicial 495,53 kB |
| Mobile Prettier, ESLint e TypeScript | aprovado |
| Mobile Jest | 6 suítes e 9 testes aprovados |
| Build .NET | aprovado, sem avisos ou erros |
| Testes .NET | 83 testes aprovados |
| Organização E2E | Consulado, Cônsul, transferência e mandato aprovados |
| Competições E2E | aptidão, elegibilidade, escalação, finalização e reabertura aprovadas |
| Regressões E2E | todas as seis jornadas verificadas; Agenda foi confirmada novamente após tornar o cenário independente do volume local |
| Axe e teclado | páginas principais e diálogos sem violações automatizadas; componentes Radix preservam foco e teclado |
| Responsividade | sem rolagem horizontal em 320, 390, 768, 1024 e 1440 px |
| Tenant, limites, concorrência e histórico | cobertos pelos 83 testes de integração |
| Modelo EF | nenhuma mudança pendente |
| OpenAPI | tipos regenerados idênticos ao contrato versionado |
| Dependências de produção | zero vulnerabilidades conhecidas |
| `git diff --check` | aprovado |

## Problemas, limitações e riscos

- A API de Organização retorna o agregado completo; as rotas de detalhe filtram esse agregado no cliente. Com volume muito alto, poderá ser necessário um endpoint de detalhe, mas ele não foi criado por conveniência nesta etapa.
- Os diálogos fecham quando a consulta é recarregada depois de uma gravação. Os testes aguardam o resultado persistido na página em vez de uma mensagem interna transitória.
- Execuções E2E deixam dados fictícios no banco local. Os cenários usam nomes e períodos únicos; o teste de Agenda passou a reutilizar sua URL estável para não depender da posição do evento em calendários já preenchidos.
- A primeira execução E2E paralela sofreu contenção e timeouts. As jornadas foram repetidas serialmente; todas passaram, incluindo a confirmação isolada final de Agenda.
- Axe automatizado não substitui uma auditoria manual completa com leitores de tela.
- `dotnet format --verify-no-changes` mantém a divergência preexistente de codificação/finais de linha na migration `20260916194933_SituacaoAtivaPessoa.cs`, que não foi alterada.

## Comandos locais

```powershell
./scripts/dev-setup.ps1
dotnet dev-certs https --trust
docker compose up --build -d

cd apps/web
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
npx playwright test --workers=1

cd ../mobile
npm run format:check
npm run lint
npm run typecheck
npm test -- --runInBand

cd ../..
dotnet build
dotnet test --no-build
dotnet ef migrations has-pending-model-changes --project src/Ibes.Infrastructure/Ibes.Infrastructure.csproj --startup-project src/Ibes.Api/Ibes.Api.csproj --context AppDbContext
dotnet ef migrations script --idempotent --project src/Ibes.Infrastructure/Ibes.Infrastructure.csproj --startup-project src/Ibes.Api/Ibes.Api.csproj --context AppDbContext
git diff --check
```

O Playwright utiliza `BOOTSTRAP_PASSWORD` e o Entity Framework utiliza `ConnectionStrings__Postgres`, ambos carregados do ambiente local conforme `docs/operations/LOCAL-DEVELOPMENT.md`.
