# Validação — Operação e agenda

Fase 3, prompt `02-operacao-agenda.md`, em 15/09/2026. Ambiente: Windows, .NET 10, PostgreSQL 17 em Docker, Node e Chromium.

## Verificações executadas

- Restore NuGet com lockfiles, formatação e build Release: sem erros ou avisos.
- **52 testes .NET aprovados**, incluindo toda a suíte anterior de progressão e as novas regras de agenda/frequência.
- Progressão preservada: fronteiras de 14/18 anos, permanência de 6/12 meses, datas históricas, tarefas fora de ordem, edição fixa, ingresso seguinte e Emérito sem manual.
- Frequência: quatro estados, visitante sem candidatura, correções com histórico, conflitos de versão, proibição de fatos futuros, primeira reunião derivada e presença de reunião cancelada incluída.
- Recorrência: semanal com intervalo/término, mensal no dia 31, anual em ano bissexto, vários dias atravessando o intervalo, exceção remarcada sem duplicação e alteração futura preservando a série anterior.
- Modelos: editar o roteiro reutilizável não altera a cópia/versão guardada na reunião.
- Segurança: permissões independentes, CSRF, conta vinculada a duas Igrejas sem acesso cruzado, tentativa de FK cruzada rejeitada e consultas sem tenant vazias. Mantida a suíte anterior de autenticação, fotos e auditoria.
- Migration aplicada em bancos vazios de teste e no desenvolvimento. Teste específico parte do bootstrap, passa pela migration da Fase 2 com Pessoa cadastrada e aplica a Fase 3 preservando Igreja, Embaixada e Pessoa. Script idempotente reaplicado duas vezes; nenhum modelo/migration pendente.
- **6 testes web**: suíte anterior e testes novos de retenção do formulário durante atualização, limpeza ao trocar Igreja e remoção de dados após perda de autorização. Build, lint e formatação aprovados.
- **7 testes mobile**: suíte anterior e chamada com bearer/tenant, gravação explícita de pontualidade e desmontagem ao trocar Igreja. Typecheck, lint e formatação aprovados.
- Expo Doctor **20/20** e bundles Android/iOS gerados.
- **3 testes Playwright aprovados**: fundação, jornada e operação. Operação cobre atividade, visitante, atraso, cancelamento, primeira reunião preservada, calendário mensal e cronograma anual, com Axe e verificação de ausência de overflow em 390 px.
- Imagem Docker construída, job de migration concluído e readiness `Healthy`. Contrato gerado da imagem idêntico a `packages/contracts/api.d.ts`.
- Linguagem de negócio revisada em entidades, banco, DTOs, mensagens, testes e interfaces; nomes técnicos consolidados mantidos.
- `git diff --check` sem erros.

## Problemas corrigidos

A consulta do histórico tentava converter diretamente no SQL estados persistidos em português para números. A conversão agora ocorre após materializar os estados; o teste percorre todos os quatro estados e o histórico.

Atualizações de catálogos fechavam formulários ao limpar temporariamente a resposta. A consulta agora preserva os dados durante atualização do mesmo contexto, mas limpa quando muda a API/Igreja ou o caminho e quando há erro de autorização. Testes específicos verificam essas fronteiras. Seletores E2E foram ajustados aos rótulos de campos obrigatórios.

Uma primeira execução local disputou arquivos com processos da API e tentou iniciar um binário anterior à migration. A reconstrução seguida da aplicação da migration resolveu o problema; o build final e os testes usam artefatos atualizados.

## Evidências e limites

Evidências locais ignoradas pelo Git: `TestResults/operacao.trx`, `TestResults/operacao-dependencies.json`, `artifacts/operacao-migrations.sql`, `artifacts/operacao-openapi.json` e screenshots em `artifacts/`. E2E cria registros explicitamente fictícios no ambiente de demonstração.

NuGet e web sem vulnerabilidades reportadas na consulta executada. Mobile mantém quatro entradas moderadas na cadeia de `decode-uri-component`, já documentadas no bootstrap; nenhuma alta/crítica. Não foi aplicado downgrade incompatível de Expo/Router.

Não houve publicação, execução de CI remota ou testes em dispositivos físicos. Exportação de bundles não substitui build nativo. Axe cobre os estados percorridos e não constitui certificação integral de acessibilidade. Não há fila offline ou envio de notificações.

Comandos de execução e testes em [desenvolvimento local](../operations/LOCAL-DEVELOPMENT.md); comportamento e limites documentados em [operação e agenda](../architecture/OPERACAO-AGENDA.md).
