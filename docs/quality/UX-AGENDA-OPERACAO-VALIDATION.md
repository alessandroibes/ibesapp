# Validação de Agenda e Operação Semanal

Validação da Etapa UX 08 executada em 17/09/2026.

## Escopo entregue

- `/agenda` passou a oferecer Hoje, Próximos, Lista, Mês e Ano com data, visualização e filtros restauráveis pela URL.
- O calendário mensal limita a quantidade de atividades visíveis por dia e resume o restante. A consulta móvel também limita a prévia diária e permite expandi-la, evitando colunas excessivamente longas.
- Cadastro de atividade e Configurações da Agenda usam páginas próprias. Tipos de atividade, entidades promotoras e modelos de roteiro estão separados por área.
- O detalhe reúne Resumo, Ocorrência e Recorrência, preservando cancelamentos, exceções e alterações futuras da série no histórico.
- Preparar reunião leva diretamente à Chamada. A Chamada apresenta busca, totais, roteiro, cadastro mínimo de visitante e os quatro estados documentados: Presença com Pontualidade, Presença com Atraso, Falta e Falta Justificada.
- Eventos recorrentes, de vários dias, prazos e entidades promotoras continuam usando as integrações existentes.
- Estados de carregamento, vazio, erro, sucesso, acesso negado e envio foram tratados nas jornadas modificadas.
- Agenda e Chamada receberam estilos responsivos próprios, com alvos de toque adequados e ausência de rolagem horizontal da página entre 320 e 1440 px.

## Decisões técnicas

- A Agenda usa rotas aninhadas em `/agenda/*`; filtros e modos ficam em parâmetros de consulta sem dados pessoais.
- A ocorrência é identificada pela atividade e pela data exibida. Isso mantém o contrato existente, que não possui um endpoint de detalhe de ocorrência.
- Edição de recorrência usa apenas as operações existentes: exceção individual ou alteração dos eventos futuros. Não foi criado um fluxo visual que simule uma atualização geral sem suporte da API.
- A listagem mensal mostra até três atividades por célula; a prévia móvel mostra quatro por dia; a visão anual mostra quatro por mês. Os demais registros permanecem acessíveis por resumo expansível ou pela visualização de lista.
- O envio de frequência fica bloqueado enquanto a requisição está em andamento, reduzindo o risco de lançamentos duplicados.
- `Agenda` passou a ser carregada sob demanda com `React.lazy`, mantendo o pacote inicial de produção abaixo de 500 kB.
- Nenhuma regra, entidade, migration, permissão, endpoint ou contrato compartilhado foi alterado.

## Resultados

| Validação | Resultado |
| --- | --- |
| Web Prettier, ESLint e TypeScript | aprovado |
| Web Vitest | 8 arquivos e 18 testes aprovados |
| Web build Vite de produção | aprovado; pacote inicial 478,21 kB e Agenda 27,63 kB |
| Mobile Prettier, ESLint e TypeScript | aprovado |
| Mobile Jest | 6 suítes e 9 testes aprovados |
| Build .NET | aprovado, sem avisos ou erros |
| Testes .NET | 83 testes de integração aprovados |
| Playwright E2E | 5 jornadas aprovadas |
| Agenda E2E | recorrência, exceção, visitante, chamada e cancelamento aprovados |
| Axe WCAG 2.2 AA | nenhuma violação nos escopos de calendário, formulário, detalhe e chamada verificados |
| Muitos eventos | limite visual e resumo excedente verificados por teste e E2E |
| Responsividade | sem rolagem horizontal em 320, 390, 768, 1024 e 1440 px |
| Isolamento de tenant e progressão | testes de integração existentes aprovados |
| Modelo EF | nenhuma mudança pendente desde a última migration |
| Migrations | script idempotente gerado e serviço `migrate` concluído no Compose |
| OpenAPI | tipos regenerados idênticos a `packages/contracts/api.d.ts` |
| Backend e contratos | nenhum arquivo alterado em `src` ou `packages/contracts` |
| `npm audit --omit=dev` | zero vulnerabilidades conhecidas |
| `git diff --check` | aprovado |

Evidências locais ignoradas pelo Git: `artifacts/agenda-desktop.png`, `artifacts/operacao-mobile.png`, `artifacts/migrations-ux-agenda-operacao.sql`, `artifacts/openapi-ux-agenda-operacao.json` e `artifacts/api-ux-agenda-operacao.d.ts`.

## Problemas, limitações e riscos

- A API não oferece atualização geral de uma atividade já criada. A interface expõe somente a exceção individual e a alteração de eventos futuros suportadas pelo contrato atual.
- A rota direta de ocorrência depende da data exibida no parâmetro `data`, pois não existe endpoint próprio de detalhe. Um link obsoleto ou uma série posteriormente remapeada apresenta orientação de registro não encontrado.
- Os testes E2E usam o banco local e criam dados fictícios. Reexecuções deixam essas atividades no volume de desenvolvimento até que ele seja recriado.
- Axe foi aplicado aos escopos exigidos e não substitui uma auditoria manual completa com leitores de tela.
- `dotnet format --verify-no-changes` continua identificando CRLF/codificação divergente em `src/Ibes.Infrastructure/Persistence/Migrations/20260916194933_SituacaoAtivaPessoa.cs`. Essa migration é anterior e não foi alterada nesta etapa visual.
- A identidade visual oficial continua pendente. Esta etapa mantém os tokens provisórios definidos na Etapa UX 06.

## Comandos executados

```powershell
cd apps/web
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
npx playwright test

cd ../mobile
npm run format:check
npm run lint
npm run typecheck
npm test -- --runInBand

cd ../..
dotnet build
dotnet test --no-build
dotnet format --verify-no-changes
dotnet ef migrations has-pending-model-changes --project src/Ibes.Infrastructure/Ibes.Infrastructure.csproj --startup-project src/Ibes.Api/Ibes.Api.csproj --context AppDbContext
dotnet ef migrations script --idempotent --project src/Ibes.Infrastructure/Ibes.Infrastructure.csproj --startup-project src/Ibes.Api/Ibes.Api.csproj --context AppDbContext --output artifacts/migrations-ux-agenda-operacao.sql
docker compose up -d --build api
curl.exe -k https://localhost:7443/openapi/v1.json -o artifacts/openapi-ux-agenda-operacao.json
npx openapi-typescript artifacts/openapi-ux-agenda-operacao.json -o artifacts/api-ux-agenda-operacao.d.ts
git diff --no-index -- packages/contracts/api.d.ts artifacts/api-ux-agenda-operacao.d.ts
git diff --check
```

Para o Playwright, carregue `BOOTSTRAP_PASSWORD` de `.env` no ambiente. Para os comandos do Entity Framework, carregue `ConnectionStrings__Postgres` com a conexão local documentada em `docs/operations/LOCAL-DEVELOPMENT.md`.
