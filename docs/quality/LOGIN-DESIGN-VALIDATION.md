# Validação do login alinhado ao design system

Validação da Etapa 13 executada em 21/09/2026.

## Escopo entregue

- A página Razor de login passou a usar a mesma composição visual, tipografia, cores, raios, sombras, espaçamentos e foco do web autenticado.
- O layout possui apresentação institucional provisória e cartão de acesso responsivo, sem criar logotipo, brasão ou identidade oficial.
- Rótulos permanecem visíveis; e-mail e senha mantêm `autocomplete` adequado; ajuda, erro neutro e atalho para o conteúdo possuem semântica acessível.
- A página continua inteiramente no servidor, com antiforgery e sem scripts ou estilos inline.
- Identity, OpenIddict, cookie, sessão, lockout, rate limit e recuperação de conta não foram alterados.

## Decisões técnicas

- `src/Ibes.Api/wwwroot/design-tokens.css` é a fonte única dos tokens usados pelo login e pelo React. O web o importa por `apps/web/src/styles/tokens.css`; o Dockerfile copia essa fonte para o estágio de build do Vite.
- `conta.css` contém somente a composição da página Razor. A separação mantém a CSP sem `unsafe-inline` e evita duplicar a paleta sem transformar o login em React.
- A marca continua textual, com o monograma provisório `ER` já usado no shell.
- O teste de integração confirma o vínculo da página com a política `autenticacao`; os valores do limitador e a configuração de Identity permaneceram intactos.

## Resultados

| Validação | Resultado |
| --- | --- |
| Build .NET Release | aprovado, sem avisos ou erros |
| Testes .NET | 93 aprovados, incluindo 6 testes específicos de login |
| Web Prettier, ESLint e TypeScript | aprovados |
| Web Vitest | 9 arquivos e 24 testes aprovados |
| Web build Vite | aprovado |
| Build Docker | aprovado após incluir a fonte compartilhada no estágio web |
| Login E2E | login inválido e válido, teclado e logout aprovados |
| Axe e contraste | nenhuma violação WCAG A/AA nas páginas inicial e de erro |
| Responsividade | sem rolagem horizontal em 320 e 1440 px |
| Antiforgery, CSP, `no-store` e ausência de conteúdo inline | aprovados |
| Enumeração de conta | conta desconhecida e senha incorreta retornam a mesma mensagem neutra |
| `ReturnUrl` | destino local aceito; destinos absoluto e relativo a protocolo rejeitados |
| Rate limit | política `autenticacao` confirmada no endpoint Razor |
| Dependências npm/NuGet | nenhuma vulnerabilidade conhecida |
| `git diff --check` | aprovado |

As imagens locais de evidência ficam em `artifacts/login-desktop.png` e `artifacts/login-mobile.png`; `artifacts/` não é versionado.

## Problemas, limitações e riscos

- O primeiro teste local não iniciou porque o Docker Desktop estava parado. Depois de iniciar o daemon, a suíte completa passou.
- A primeira estratégia de arquivo vinculado pelo MSBuild não servia o CSS no `WebApplicationFactory`. O arquivo físico da API passou a ser a fonte única, importada pelo Vite e copiada explicitamente no estágio web do Dockerfile.
- O import do Vite depende da estrutura atual do monorepo; uma reorganização de `apps/` ou `src/` deve atualizar o import e a cópia do Dockerfile em conjunto.
- O Vite mantém o aviso conhecido de pacote inicial acima de 500 kB. Esta etapa não acrescentou JavaScript nem ampliou o pacote do login.
- Axe automatizado e inspeção das evidências não substituem validação manual completa em leitores de tela reais.

## Comandos locais

```powershell
./scripts/dev-setup.ps1
dotnet dev-certs https --trust
docker compose up --build -d

dotnet build Ibes.slnx -c Release --no-restore
dotnet test tests/Ibes.IntegrationTests/Ibes.IntegrationTests.csproj -c Release --no-build
dotnet list Ibes.slnx package --vulnerable --include-transitive

cd apps/web
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
$senhaE2e = (Get-Content ..\..\.env | Where-Object { $_ -like 'BOOTSTRAP_PASSWORD=*' } | Select-Object -First 1).Substring('BOOTSTRAP_PASSWORD='.Length)
$env:BOOTSTRAP_PASSWORD = $senhaE2e
npx playwright test e2e/login.spec.ts --workers=1

cd ../..
git diff --check
```
