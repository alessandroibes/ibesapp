# Validação dos módulos institucionais e administrativos

Validação da Etapa UX 10 executada em 17/09/2026.

## Escopo entregue

- Igreja e Embaixada apresentam dados estruturados, Conselheiros e lideranças vigentes e históricos; a edição institucional ocupa uma página própria.
- Manuais possuem listagem por versão, página de cadastro e detalhe das tarefas versionadas. Embaixador Emérito permanece sem Manual ou tarefas presumidas.
- Financeiro apresenta entradas, saídas, saldo e quantidade, com filtros de período e iniciativa. Inclusão ocorre em diálogo, edição é contextual e exclusão informa motivo, valor e data.
- Acervo Histórico possui linha do tempo filtrável, páginas próprias de inclusão e edição e detalhe com atividade, pessoas e anexos.
- Anexos mostram nome, tipo e tamanho. Envio, substituição, remoção e download continuam usando os endpoints privados e a autorização existentes.
- Nenhuma regra de domínio, endpoint, migration, permissão ou contrato compartilhado foi alterado.

## Decisões técnicas

- As rotas `/instituicao/*`, `/manuais/*` e `/acervo/*` mantêm as entradas anteriores e acrescentam URLs estáveis de edição, cadastro e detalhe.
- Os módulos reutilizam `PageHeader`, `Card`, `Badge`, `EmptyState`, `Dialog`, `AlertDialog`, `Timeline` e os controles de formulário consolidados.
- Filtros financeiros são enviados à API; totais não são recalculados no navegador.
- A versão do Manual é apresentada como contexto histórico. Não há ação de migração entre versões.
- Edição e exclusão financeiras e do Acervo permanecem livres, sem auditoria funcional criada pela interface.
- Confirmações destrutivas usam diálogos acessíveis e descrevem o registro afetado.

## Evidências

| Validação | Resultado |
| --- | --- |
| Web Prettier, ESLint e TypeScript | aprovado |
| Web Vitest | 8 arquivos e 20 testes aprovados |
| Web build Vite | aprovado; aviso de pacote inicial de 507,41 kB |
| Web E2E | 6 jornadas verificadas serialmente; 5 passaram na execução conjunta e a jornada adaptada de domínio passou depois isoladamente |
| Axe e teclado | jornadas administrativas sem violações Axe; diálogos Radix preservam foco e Escape |
| Mobile Prettier, ESLint e TypeScript | aprovado |
| Mobile Jest | 6 suítes e 9 testes aprovados |
| Build .NET | aprovado, sem avisos ou erros |
| Testes .NET | 83 testes aprovados |
| Tenant, autorização, uploads privados e progressão | preservados e cobertos pela suíte de integração existente |
| Modelo EF | nenhuma mudança pendente; script idempotente gerado |
| OpenAPI | tipos regenerados idênticos ao contrato versionado |
| Dependências web de produção | zero vulnerabilidades conhecidas |
| `git diff --check` | aprovado |

## Problemas, limitações e riscos

- O pacote JavaScript inicial ultrapassa por 7,41 kB o limite de aviso de 500 kB do Vite. A divisão adicional fica para uma etapa que possa revisar o carregamento global sem ampliar este escopo.
- O aplicativo móvel não define script `build`; foram executados formatação, lint, TypeScript e Jest. O `npm audit` do mobile informa quatro vulnerabilidades moderadas transitivas em `decode-uri-component`; a correção sugerida instala uma versão incompatível do Expo Router e não foi aplicada nesta etapa de UX.
- O fechamento dos diálogos de cadastro financeiro continua explícito após salvar; os dados são recarregados imediatamente e o usuário pode fechar por Escape ou pelo botão de fechar.
- Testes E2E gravam dados fictícios no ambiente local. Os registros usam sufixos únicos.
- Axe automatizado e breakpoints em CSS não substituem avaliação manual completa com leitor de tela e em aparelhos físicos.

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
npx playwright test --workers=1 --timeout=60000

cd ../mobile
npm run format:check
npm run lint
npm run typecheck
npm test

cd ../..
dotnet build Ibes.slnx --no-restore
dotnet test Ibes.slnx --no-build
dotnet ef migrations has-pending-model-changes --project src/Ibes.Infrastructure/Ibes.Infrastructure.csproj --startup-project src/Ibes.Api/Ibes.Api.csproj --context AppDbContext
dotnet ef migrations script --idempotent --project src/Ibes.Infrastructure/Ibes.Infrastructure.csproj --startup-project src/Ibes.Api/Ibes.Api.csproj --context AppDbContext
git diff --check
```

Playwright utiliza `BOOTSTRAP_PASSWORD`; Entity Framework utiliza `ConnectionStrings__Postgres`, conforme `docs/operations/LOCAL-DEVELOPMENT.md`.
