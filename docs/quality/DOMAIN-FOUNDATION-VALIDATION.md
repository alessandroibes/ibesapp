# Validação — Fases 1 e 2

Executada em 15/09/2026, Windows, .NET 10, Docker Desktop com PostgreSQL 17 e Chromium. Escopo exclusivo do prompt 01.

## Resultados

- Restore NuGet em modo locked e formatação verificados; build Release com zero avisos/erros.
- 39 testes .NET aprovados: autenticação/autorização, tenant obrigatório, filtros e FKs compostas, ausência de contexto, auditoria, CSRF, fotos privadas, vínculos, cadastro institucional, concorrência e domínio.
- Progressão: fronteiras de 14 e 18 anos; permanência de 6/12 meses fixada na admissão; histórico de pessoa hoje adulta; datas futuras/anteriores inválidas; tarefas fora de ordem; tarefas incompletas; edição incompatível; ingresso seguinte na mesma data; Emérito sem manual; cerimônia independente.
- Migrações aplicadas em banco vazio nos testes de integração. Teste específico aplica somente a migração da fundação, insere Igreja/Embaixada, atualiza e verifica preservação. Script idempotente executado duas vezes; nenhum modelo ou migration pendente.
- Web: build, lint, formatação e 4 testes unitários aprovados.
- Mobile: typecheck, lint, formatação e 6 testes aprovados, incluindo troca de Igreja sem manter ficha da anterior. Expo Doctor: 20/20; exportações Android/iOS geradas.
- Docker: imagem construída, job de migração concluído e readiness `Healthy`.
- 2 testes Playwright aprovados: sessão/logout e fluxo de cadastro, cinco requisitos, admissão com edição explícita, tarefa fora de ordem e persistência após recarga. Axe sem violações WCAG A/AA nos estados examinados; sem overflow horizontal em 390 px.
- Contrato gerado do OpenAPI da imagem Docker idêntico a `packages/contracts/api.d.ts`.
- Revisão da linguagem de negócio: entidades, campos, rotas, mensagens próprias, testes e telas em português. Termos técnicos consolidados mantidos.
- `git diff --check` sem erros.

## Problemas encontrados e tratados

A validação de DTOs posicionais estava aplicada aos parâmetros do construtor, não às propriedades lidas por DataAnnotations. Corrigida com alvos `property:` e validação de objetos aninhados; testes cobrem nomes e edição vazios. Ajustada também a conversão numérica nas telas conforme o contrato OpenAPI. O teste mobile precisou preservar o elemento raiz ao verificar a desmontagem por troca de Igreja; o E2E precisou incluir formulários recolhidos nos seletores.

Auditoria atual de dependências: NuGet e web sem vulnerabilidades reportadas; mobile com **quatro entradas moderadas**, na cadeia de `decode-uri-component`, sem altas/críticas. Esta é a pendência já identificada no bootstrap; não foi aplicado downgrade incompatível de Expo/Router sugerido por `npm audit fix --force`.

## Evidências e limites

Resultados locais em `TestResults/dominio-release.trx`, `TestResults/dependencies.json`, `artifacts/migrations.sql`, `artifacts/openapi-container.json` e screenshots em `artifacts/`. Esses arquivos são ignorados pelo Git. Testes E2E criam registros explicitamente fictícios no ambiente de demonstração.

Não foram executados builds nativos em dispositivos físicos, publicação nem CI remota. Bundles Expo e testes automatizados não equivalem a validação nativa completa. A auditoria de acessibilidade cobre os estados percorridos, não certifica todas as combinações possíveis.

Os comandos reproduzíveis estão em [execução local](../operations/LOCAL-DEVELOPMENT.md). Para a suíte de navegador, usar `npx playwright test` em `apps/web` com Docker ativo e `BOOTSTRAP_PASSWORD` carregada do `.env` local.
