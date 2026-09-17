# Validação da revisão UX 90

Revisão executada em 17/09/2026 contra `docs/ux`, sem alteração de regra de negócio.

## Entregas

- Corrigida a hierarquia visual dos anexos no Acervo: substituir é ação secundária; remover é ação destrutiva e mantém confirmação explícita.
- A Igreja selecionada no mobile passou a ter superfície, borda e texto destacados, além do estado acessível `selected` já existente.
- O contêiner principal do mobile agora fecha o teclado ao arrastar e mantém o primeiro toque em controles, reduzindo interações durante busca, data, observações e cadastro de visitante.
- Responsividade, hierarquia, estados, acessibilidade e fluxos existentes foram revisados no web e mobile. Nenhuma nova funcionalidade foi criada.

## Decisões técnicas

- Foram reutilizadas as variantes existentes do `Button`; nenhuma dependência foi adicionada.
- O mobile mantém seu design atual e os mesmos módulos, permissões e contratos. A alteração limita-se ao feedback de seleção e comportamento do teclado.
- Nenhum endpoint, entidade, migration, permissão, regra, auditoria ou contrato compartilhado foi alterado.

## Resultados

| Validação | Resultado |
| --- | --- |
| Web format, lint, TypeScript e build | aprovado |
| Web Vitest | 9 arquivos e 24 testes aprovados |
| Web Playwright | 6 jornadas aprovadas serialmente |
| Axe WCAG 2.2 AA, teclado e foco | aprovados nos fluxos E2E percorridos |
| Responsividade web | 320, 390, 768, 1024 e 1440 px sem rolagem horizontal |
| Web npm audit de produção | zero vulnerabilidades |
| Mobile format, lint e TypeScript | aprovado |
| Mobile Jest | 6 suítes e 9 testes aprovados |
| Mobile npm audit | quatro vulnerabilidades moderadas transitivas já documentadas |
| Build .NET | aprovado, zero avisos e zero erros |
| Testes .NET | 83 aprovados |
| Modelo EF | nenhuma mudança pendente; script idempotente gerado |
| OpenAPI | tipos regenerados idênticos ao contrato versionado |
| `git diff --check` | aprovado |

## Limitações e riscos

- O pacote inicial web permanece com 506,67 kB e mantém o aviso do Vite acima de 500 kB.
- O mobile mantém quatro ocorrências moderadas transitivas em `decode-uri-component`; `npm audit fix --force` propõe uma mudança incompatível do Expo Router.
- A revisão mobile foi validada por TypeScript, Jest e semântica dos componentes. Testes manuais em aparelhos, VoiceOver e TalkBack continuam necessários antes de release.
- Axe automatizado e Chromium não substituem validação manual completa em leitores de tela e outros navegadores.

## Comandos

```powershell
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
git diff --check
```
