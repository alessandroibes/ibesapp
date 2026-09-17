# Validação da fundação visual e do shell web

Validação da Etapa UX 06 executada em 16/09/2026.

## Escopo entregue

- Tokens semânticos de cor, tipografia, raio, sombra, foco, dimensões do shell e camadas foram separados em `apps/web/src/styles/tokens.css`.
- A base de estilos dos componentes foi separada em `apps/web/src/styles/design-system.css`, iniciando a decomposição do arquivo global sem reescrever as telas de domínio.
- Foram criados componentes para botão, campos, rótulo, cartão, badge, separador, breadcrumb, cabeçalho de página, diálogo, painel lateral, confirmação, menu de ações, abas, tabela, paginação, alerta, skeleton, toast, avatar, timeline, toolbar e estados vazio, erro e acesso negado.
- O shell autenticado passou a ter sidebar agrupada por Gestão, Operação, Organização e Administração, mantendo a filtragem pelas permissões existentes.
- O contexto da Embaixada e da Igreja, o seletor de Igreja e o encerramento de sessão permanecem disponíveis no desktop e no celular.
- O painel móvel usa gerenciamento de foco do Radix, fecha por `Escape` e devolve o foco ao acionador.
- O cabeçalho de página concentra breadcrumb, área atual e contexto do tenant, eliminando a hierarquia repetida anterior.
- Todas as rotas e telas existentes continuam funcionais no novo shell. Nenhuma tela de domínio foi migrada profundamente nesta etapa.

## Decisões técnicas

- A identidade visual provisória foi mantida com azul, marinho e neutros; não foram criados marca, brasão ou paleta institucional definitiva.
- Radix UI foi usado nos componentes com interação complexa de teclado, foco ou camada: diálogo, painel lateral, confirmação, menu, abas e toast.
- `lucide-react` substitui SVGs manuais do shell e fornece uma biblioteca única de ícones com importação por componente.
- Os componentes seguem composição semelhante ao shadcn/ui e são exportados por `apps/web/src/components/ui/index.ts`.
- A sidebar permanece montada no desktop e o painel móvel cria uma cópia acessível da mesma navegação. Ambos recebem a mesma lista já filtrada por permissão.
- Regras de negócio, entidades, permissões, endpoints, migrations, contratos compartilhados e aplicativo React Native não foram alterados.

## Dependências adicionadas

- `@radix-ui/react-alert-dialog` 1.1.23;
- `@radix-ui/react-dialog` 1.1.23;
- `@radix-ui/react-dropdown-menu` 2.1.24;
- `@radix-ui/react-tabs` 1.1.21;
- `@radix-ui/react-toast` 1.2.23;
- `lucide-react` 1.46.0.

`npm audit --omit=dev` informou zero vulnerabilidades conhecidas nas dependências de produção.

## Resultados

| Validação | Resultado |
| --- | --- |
| Web Prettier, ESLint e TypeScript | aprovado |
| Web Vitest | 7 arquivos e 13 testes aprovados |
| Web build Vite de produção | aprovado |
| Mobile Prettier, ESLint e TypeScript | aprovado |
| Mobile Jest | 6 suítes e 9 testes aprovados |
| Build .NET | aprovado, sem avisos ou erros |
| Testes .NET | 83 testes de integração aprovados |
| Playwright E2E | 5 jornadas aprovadas |
| Axe WCAG 2.2 AA | nenhuma violação nas páginas verificadas, inclusive com painel móvel aberto |
| Responsividade | sem rolagem horizontal em 320 px |
| Navegação | URL direta, recarga, voltar do navegador, estado ativo e rotas existentes aprovados |
| Modelo EF | nenhuma mudança pendente desde a última migration |
| Isolamento e progressão | 83 testes de integração existentes aprovados |
| Contratos e backend | nenhum arquivo alterado em `src` ou `packages/contracts` |
| `npm audit --omit=dev` | zero vulnerabilidades |
| `git diff --check` | aprovado |

## Problemas e limitações

- `dotnet format Ibes.slnx --verify-no-changes --no-restore` identificou CRLF e codificação divergente em `src/Ibes.Infrastructure/Persistence/Migrations/20260916194933_SituacaoAtivaPessoa.cs`. O arquivo já estava versionado antes desta etapa e não foi alterado porque migrations e backend estão fora do escopo visual.
- A cópia local ignorada `artifacts/openapi.json` está defasada em relação ao contrato publicado pela API atual. Foi gerada a evidência local `artifacts/openapi-ux-design-system.json`; o diff do Git confirma que esta etapa não alterou API nem `packages/contracts`.
- As páginas de domínio conservam sua composição anterior. Os novos componentes serão adotados em cada módulo nas etapas UX seguintes.
- A identidade oficial continua pendente e a paleta permanece propositalmente provisória.

## Comandos executados

```powershell
cd apps/web
npm run format
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
docker compose up --build -d
git diff --check
```
