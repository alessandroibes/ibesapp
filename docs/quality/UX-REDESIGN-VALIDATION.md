# Validação final da evolução da experiência web

Validação da Etapa UX 11 executada em 17/09/2026.

## Mapa final e entregas

O mapa completo está em [Mapa de telas](../ux/SCREEN-MAP.md). As áreas finais são Pessoas e Jornada, Igreja e Embaixada, Manuais, Agenda e Chamada, Consulados e Diretoria, Competições, Financeiro e Acervo Histórico. Dashboard e Relatórios continuam deliberadamente adiados.

- Eliminado o segundo cabeçalho dos módulos que já possuem `PageHeader` próprio.
- Estados de carregamento, erro, acesso negado e conflito passaram a reutilizar `PageSkeleton` e `Alert`.
- Filtros de período/iniciativa do Financeiro e ano/categoria do Acervo agora são restaurados pela URL sem incluir dados pessoais.
- Exclusões e remoções usam ação destrutiva e confirmação descritiva.
- Operações de anexo foram removidas da linha do tempo e concentradas no detalhe do marco.
- Implementações antigas `Organizacao.tsx` e `Competicoes.tsx`, seus estilos exclusivos e código duplicado foram removidos. As versões em rotas aninhadas são as únicas mantidas.
- README, mapa de telas, sistema de UX e execução local foram atualizados para o estado final.

## Componentes reutilizáveis

Nenhuma nova dependência foi adicionada. A consolidação ampliou o uso dos componentes existentes `PageHeader`, `PageSkeleton`, `Alert`, `EmptyState`, `Button`, `Dialog` e `AlertDialog`. `Estado` e `EstadoConsultas` centralizam carregamento, erro, acesso negado e conflito para os módulos.

## Exceções ao desenho alvo

- Pessoas e Agenda mantêm cabeçalho de área fornecido pelo shell porque suas implementações internas antecedem `PageHeader`; os demais módulos possuem cabeçalho próprio. Em ambos os casos há um único título de página.
- Algumas telas extensas de Pessoas, Agenda, Organização e Competições permanecem em arquivos grandes. A divisão exigiria uma refatoração ampla sem benefício funcional imediato; os fluxos já estão separados em componentes internos e cobertos por testes.
- O pacote inicial permanece pouco acima do aviso do Vite. Agenda continua carregada sob demanda.
- Identidade oficial, Dashboard, Relatórios e reformulação mobile não foram antecipados.

## Matriz de validação

| Validação | Resultado |
| --- | --- |
| Web Prettier, ESLint e TypeScript | aprovado |
| Web Vitest | 9 arquivos e 24 testes aprovados |
| Web build Vite | aprovado; pacote inicial 506,67 kB e Agenda 27,63 kB |
| Web npm audit de produção | zero vulnerabilidades |
| Mobile Prettier, ESLint e TypeScript | aprovado |
| Mobile Jest | 6 suítes e 9 testes aprovados |
| Mobile npm audit | quatro vulnerabilidades moderadas transitivas já documentadas |
| Build .NET | aprovado, zero avisos e zero erros |
| Testes .NET | 83 aprovados |
| Playwright | 6 jornadas no Chromium configurado pelo projeto |
| Axe WCAG 2.2 AA | nenhuma violação nos estados e páginas percorridos |
| Responsividade | sem rolagem horizontal em 320, 390, 768, 1024 e 1440 px |
| Navegação | URL direta, recarga, voltar, avançar e filtros restauráveis verificados |
| Teclado e foco | Escape, retorno de foco e foco visível verificados nos componentes Radix |
| Redução de movimento | regra global `prefers-reduced-motion` preservada |
| Estados | carregamento, vazio, erro, sucesso, acesso negado, inativo e conflito cobertos por componentes, Vitest, E2E e integração |
| Permissões parciais | navegação e ações filtradas em teste de componente; API mantém autorização |
| Duas Igrejas | troca de contexto web e isolamento da Igreja B confirmados por testes de componente e integração |
| Volumes | limites de calendário e listas preservados pelos testes de Agenda e paginação |
| Modelo EF | nenhuma mudança pendente; script idempotente gerado |
| OpenAPI | tipos regenerados idênticos a `packages/contracts/api.d.ts` |
| Backend e contratos | nenhum arquivo alterado em `src` ou `packages/contracts` |
| `git diff --check` | aprovado |

Capturas ignoradas pelo Git foram produzidas em `artifacts/`: `web-desktop.png`, `web-mobile.png`, `jornada-mobile.png`, `financeiro-desktop.png` e `acervo-mobile.png`, além das referências das etapas anteriores.

## Segurança, privacidade e domínio

- Busca por nome permanece em estado local e não aparece na URL. Os novos parâmetros contêm apenas datas, categoria e identificador técnico de iniciativa.
- Nenhuma informação pessoal foi acrescentada a logs, telemetria ou mensagens globais.
- Isolamento por Igreja, permissões, CSRF, anexos privados, concorrência, auditoria e progressão continuam no servidor e foram revalidados pelos 83 testes de integração.
- Nenhuma migration, endpoint, entidade ou regra de negócio foi alterada.

## Problemas, riscos e itens adiados

- `npm audit` mobile mantém quatro ocorrências moderadas em `decode-uri-component`. A correção automática troca o Expo Router por versão incompatível e não foi aplicada.
- O pacote inicial de 506,67 kB excede em 6,67 kB o limite de aviso do Vite. Divisão adicional deve ser avaliada junto de métricas reais de carregamento.
- Axe automatizado e Chromium não substituem teste manual com leitores de tela nem navegadores que venham a ser adicionados ao projeto.
- O ambiente E2E usa uma conta com todas as permissões. Permissões parciais e duas Igrejas autorizadas são cobertas por testes de componente e integração; o seed do Compose não foi ampliado apenas para duplicar essa evidência no navegador.
- Políticas de retenção, identidade visual, Dashboard e Relatórios continuam nas questões abertas ou no backlog.

## Comandos reproduzíveis

```powershell
./scripts/dev-setup.ps1
docker compose up -d --build api

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
npm audit --omit=dev

cd ../..
dotnet build Ibes.slnx --no-restore
dotnet test Ibes.slnx --no-build
dotnet ef migrations has-pending-model-changes --project src/Ibes.Infrastructure/Ibes.Infrastructure.csproj --startup-project src/Ibes.Api/Ibes.Api.csproj --context AppDbContext
dotnet ef migrations script --idempotent --project src/Ibes.Infrastructure/Ibes.Infrastructure.csproj --startup-project src/Ibes.Api/Ibes.Api.csproj --context AppDbContext --output artifacts/migrations-ux-redesign.sql
curl.exe -kfsS https://localhost:7443/openapi/v1.json -o artifacts/openapi-ux-redesign.json
git diff --check
```

Título sugerido: `feat(web): consolida evolução da experiência`.

```powershell
git add README.md apps/web docs
git commit -m "feat(web): consolida evolução da experiência"
```
