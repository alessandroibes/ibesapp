# Validação da Fase 0 — 14/09/2026

Escopo: somente `prompts/00-bootstrap.md`. Fontes de verdade lidas integralmente antes da implementação. Decisões de tenant, contas, BFF/PKCE e CI confirmadas pelo usuário e registradas em `DECISIONS.md`.

## Entregas

- Solução .NET 10 executável, fundação de Identidade/Organizações/Auditoria e projetos reservados para os módulos seguintes.
- PostgreSQL real, migração EF Core, Dockerfile multi-stage sem root e Compose com migração separada e HTTPS.
- Conta adulta global, vínculo/permissão por Igreja, uma Embaixada por tenant, filtros e guards de escrita, auditoria transacional.
- BFF co-hospedado com Identity/cookie/CSRF; OpenIddict mobile com PKCE e código de uso único.
- Shell web responsivo com Tailwind/shadcn e shell Expo/Router; tipos compartilhados gerados de OpenAPI.
- Logs estruturados, trace id, métricas/tracing OTLP opcionais, liveness/readiness.
- CI GitHub Actions com builds, testes, auditorias de dependências, bundles e imagem como artefatos. Nenhum deploy foi realizado.

## Evidências executadas

| Verificação | Resultado |
| --- | --- |
| Build .NET e Docker publish | Passou |
| Testes de integração com PostgreSQL/Testcontainers | 11 passaram |
| Web: build, lint, typecheck e testes | 4 testes passaram |
| Mobile: lint, typecheck e Jest | 5 testes passaram |
| Expo Doctor | 20/20 verificações passaram |
| Exportação Metro/Hermes Android e iOS | Bundles gerados |
| Chromium: login, contexto e logout reais | Passou |
| axe WCAG 2/2.1/2.2 A/AA nas telas web verificadas | Nenhuma violação automática encontrada |
| Responsividade web | Sem overflow em 390 px; screenshots também em 1440 px |
| Migração, readiness e contrato OpenAPI | Passaram |
| Auditoria npm web | Zero vulnerabilidades reportadas |
| Auditoria npm mobile | Oito entradas moderadas pendentes; sem altas/críticas |

Integração verifica 401 anônimo, 400 sem Igreja, 403 sem vínculo/permissão, isolamento de consultas, rejeição de escrita cruzada, auditoria imutável, paginação, CSRF, PKCE obrigatório, emissão de bearer e rejeição de reutilização de código. O fluxo mobile testa a ligação entre autenticação, armazenamento seguro, consulta da Igreja e saída local, além de expiração/corrupção da sessão.

Resultados locais ficam em `TestResults/` e `artifacts/` (ignorados no Git). Screenshots: `artifacts/web-desktop.png` e `artifacts/web-mobile.png`.

## Problemas encontrados e tratamento

- Sandbox bloqueava npm/NuGet/Docker; verificações necessárias foram executadas com autorização fora do sandbox.
- Docker Desktop estava parado; foi iniciado para executar a integração real.
- Dependências vulneráveis corrigidas em OpenAPI, OpenTelemetry, Vitest, SSH.NET e UUID do tooling. Pendência mobile detalhada em `docs/security/DEPENDENCIES-BOOTSTRAP.md`.
- Expo resolveu uma versão incompatível de React DOM e duplicou expo-font; versões alinhadas ao SDK 55, com validação pelo Doctor e exportação.
- Imagem oficial .NET continha feature band mais nova; global.json aceita atualização dentro de .NET 10.
- Volume Data Protection inicialmente sem permissão para usuário não-root; imagem cria diretório com propriedade correta. Chaves protegidas com certificado no Compose.
- Asserção inicial de cache comparava string exata; ajustada para verificar a diretiva NoStore, pois Identity adiciona também NoCache.

## Limites da evidência

A CI foi escrita e suas verificações executadas localmente; não houve execução remota no GitHub. Bundles mobile não equivalem a APK/IPA instalado: login nativo em dispositivo físico/simulador e inspeção com leitor de tela permanecem sem validação neste ambiente Windows. Axe não substitui auditoria manual completa de acessibilidade.

Os módulos futuros são somente projetos vazios, e a identidade visual é provisória. Cadastro institucional real, convites, recuperação de contas, dados de menores, jornadas, frequência e demais funcionalidades de produto não foram implementados. Nenhuma regra desses módulos foi inventada.
