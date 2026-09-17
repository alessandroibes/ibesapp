# Validação de Pessoas e Jornada

Validação da Etapa UX 07 executada em 16/09/2026.

## Escopo entregue

- `/pessoas` foi consolidada como listagem principal, com busca e condições Todos, Embaixadores, Candidatos, Visitantes e Inativos. Condição, inclusão de inativos e paginação são restauráveis pela URL.
- Visualizar permanece como ação evidente, Adicionar pessoa é a ação primária e editar/inativar ficam no menu de ações.
- A condição Inativos inclui ativos e inativos para consulta histórica e eventual reativação, conforme a semântica existente de `incluirInativos` da API; a interface explica esse comportamento.
- Cadastro e edição passaram a usar páginas próprias, campos agrupados por assunto, ações Salvar/Cancelar e proteção durante o envio.
- A ficha estável de Pessoa reúne resumo superior e as áreas Resumo, Jornada, Frequência, Vínculos e Histórico, com a aba selecionada preservada na URL.
- Inativação e reativação usam diálogo acessível e mantêm o histórico visível. Ações futuras ficam indisponíveis para a pessoa inativa conforme as regras existentes.
- Jornada passou a apresentar requisitos, postos e tarefas como progresso educacional e linha do tempo, sem linguagem de patente ou autoridade.
- Requisitos e tarefas continuam concluíveis em qualquer ordem; cerimônias permanecem independentes da progressão.
- Primeira reunião e faixa etária continuam derivadas dos dados de frequência e nascimento/data-base.
- Estados de carregamento, vazio, erro, sucesso e acesso negado foram mantidos ou adicionados às novas composições.
- O layout de Pessoas e Jornada foi separado em `apps/web/src/styles/pessoas.css` e validado em 320 px sem rolagem horizontal.

## Decisões técnicas

- As rotas e integrações existentes foram preservadas. Não houve mudança em API, banco, entidades, permissões ou contratos compartilhados.
- Condição, inclusão de inativos, página e aba usam parâmetros de consulta sem dados pessoais; mensagens de sucesso usam estado de navegação.
- A busca por nome permanece no estado local da tela e é omitida da URL para não expor dados pessoais no histórico do navegador, em logs de infraestrutura ou em links compartilhados.
- Os filtros de condição usam botões com estado `aria-pressed`, pois não controlam painéis e não devem anunciar relações de abas inexistentes.
- Abas, menu de ações e diálogos reutilizam os componentes Radix do design system introduzido na Etapa UX 06.
- O componente de formulário passou a aceitar agrupamentos e área de ações, mantendo compatibilidade com as telas existentes.
- A grade principal usa colunas redutíveis com `minmax(0, 1fr)` para impedir que conteúdo intrínseco amplie a página em telas estreitas.

## Resultados

| Validação | Resultado |
| --- | --- |
| Web Prettier, ESLint e TypeScript | aprovado |
| Web Vitest | 7 arquivos e 15 testes aprovados |
| Web build Vite de produção | aprovado |
| Mobile Prettier, ESLint e TypeScript | aprovado |
| Mobile Jest | 6 suítes e 9 testes aprovados |
| Build .NET | aprovado, sem avisos ou erros |
| Testes .NET | 83 testes de integração aprovados |
| Playwright E2E | 5 jornadas aprovadas |
| Axe WCAG 2.2 AA | nenhuma violação nas páginas de lista, formulário e detalhe verificadas |
| Responsividade | ficha e Jornada sem rolagem horizontal em 320 px |
| Isolamento de tenant e progressão | testes de integração existentes aprovados |
| Modelo EF | nenhuma mudança pendente desde a última migration |
| Migrations | script idempotente gerado e serviço `migrate` concluído no Compose |
| OpenAPI | tipos regenerados idênticos a `packages/contracts/api.d.ts` |
| Backend e contratos | nenhum arquivo alterado em `src` ou `packages/contracts` |
| `npm audit --omit=dev` | zero vulnerabilidades conhecidas |
| `git diff --check` | aprovado |

Evidências locais ignoradas pelo Git: `artifacts/jornada-mobile.png`, `artifacts/migrations-ux-pessoas-jornada.sql`, `artifacts/openapi-ux-pessoas-jornada.json` e `artifacts/api-ux-pessoas-jornada.d.ts`.

## Problemas, limitações e riscos

- A API oferece `incluirInativos`, sem um filtro exclusivo para inativos. A opção visual Inativos inclui ambos os estados e informa isso ao usuário, evitando mudar o contrato apenas por conveniência da tela.
- O primeiro uso de abas como filtro produziu relações ARIA sem painéis correspondentes. O Axe identificou o problema e os filtros foram substituídos por botões de alternância semanticamente adequados.
- A ficha inicialmente excedia 320 px porque a coluna implícita do grid respeitava a largura intrínseca dos filhos. A grade passou a permitir redução explícita e o E2E verifica a largura do documento.
- `dotnet format Ibes.slnx --verify-no-changes --no-restore` já identifica CRLF/codificação divergente em `src/Ibes.Infrastructure/Persistence/Migrations/20260916194933_SituacaoAtivaPessoa.cs`. Essa migration é anterior e não foi alterada nesta etapa visual.
- As telas dos demais módulos permanecem no estado da etapa anterior; sua migração pertence aos próximos prompts e não foi antecipada.
- A identidade visual oficial continua pendente. Esta etapa usa os tokens provisórios definidos na Etapa UX 06.

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
npm test

cd ../..
dotnet build Ibes.slnx --no-restore
dotnet test Ibes.slnx --no-build --no-restore
dotnet ef migrations has-pending-model-changes --project src/Ibes.Infrastructure --startup-project src/Ibes.Api
dotnet ef migrations script --idempotent --project src/Ibes.Infrastructure --startup-project src/Ibes.Api --output artifacts/migrations-ux-pessoas-jornada.sql
docker compose up -d --build api
curl.exe -kfsS https://localhost:7443/openapi/v1.json -o artifacts/openapi-ux-pessoas-jornada.json
git diff --check
```

Para o Playwright, carregue `BOOTSTRAP_PASSWORD` de `.env` no ambiente. Para os comandos do Entity Framework, carregue `ConnectionStrings__Postgres` com a conexão local documentada em `docs/operations/LOCAL-DEVELOPMENT.md`.
