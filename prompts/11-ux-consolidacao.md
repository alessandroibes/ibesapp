# Prompt 11 — Consolidação da experiência web

## Pré-condição

Execute somente depois dos prompts 06 a 10 estarem concluídos, validados e registrados em commits próprios.

## Leitura obrigatória

Leia integralmente `AGENTS.md`, `DECISIONS.md`, `README.md`, `docs/`, `plans/IMPLEMENTATION-ROADMAP.md`, `plans/UX-REDESIGN-ROADMAP.md` e todos os relatórios de validação produzidos pelos prompts 06 a 10.

## Objetivo

Execute somente a Etapa UX 11: consolidar a migração visual, remover padrões obsoletos, corrigir inconsistências e produzir evidência final. Não criar funcionalidades de negócio novas.

## Escopo obrigatório

- Auditar todas as rotas web em desktop e celular.
- Corrigir inconsistências de cabeçalho, breadcrumb, filtros, tabelas, abas, formulários, ações e mensagens.
- Garantir que ação primária, secundária, discreta e destrutiva tenham uso consistente.
- Unificar loading, skeleton, vazio, erro, sucesso, acesso negado e conflito de concorrência.
- Remover CSS, componentes, ícones e dependências que ficaram sem uso.
- Reduzir componentes de domínio excessivamente grandes quando a separação melhorar manutenção e testes.
- Verificar navegação direta, recarregamento, voltar/avançar, foco, scroll e preservação de filtros.
- Verificar que nenhuma informação pessoal sensível foi adicionada a URL, log, telemetria ou mensagem global.
- Revisar textos de interface para português brasileiro, clareza, pluralização e consistência.
- Comparar as telas finais com `docs/ux/UX-REDESIGN.md` e registrar exceções justificadas.
- Atualizar `README.md`, `docs/ux/SCREEN-MAP.md`, `docs/ux/UX-SYSTEM.md` e documentação operacional quando necessário.

## Restrições

- Não implementar Dashboard, Relatórios ou identidade visual oficial.
- Não alterar regra de negócio para resolver desconforto de interface.
- Não reduzir autorização, auditoria ou isolamento multi-tenant.
- Não alterar migrations ou OpenAPI sem justificativa técnica indispensável.
- Se houver lacuna funcional, documente-a no backlog/questões abertas em vez de inventar comportamento.

## Critérios de aceite

- Todas as rotas web seguem os padrões consolidados ou possuem exceção documentada.
- Não restam componentes, estilos ou dependências obsoletos conhecidos.
- Nenhuma jornada crítica apresenta regressão funcional, de autorização ou de tenant.
- Estados e ações equivalentes possuem texto, aparência e comportamento consistentes.
- As evidências permitem repetir localmente todas as validações declaradas.

## Matriz mínima de validação

- larguras: 320, 390, 768, 1024 e 1440 px;
- navegadores E2E suportados pelo projeto;
- teclado, foco visível, leitor de tela por semântica e redução de movimento;
- contraste e WCAG 2.2 AA com Axe;
- carregamento, vazio, erro, sucesso, sem permissão, registro inativo e conflito de concorrência;
- usuário com todas as permissões e usuário com permissões parciais;
- pelo menos duas Igrejas autorizadas, confirmando troca de contexto e isolamento;
- volumes representativos de listas e calendários;
- rotas acessadas diretamente e após recarregamento.

## Validação obrigatória

- `dotnet build` e todos os testes .NET;
- script idempotente e ausência de mudanças pendentes no modelo EF;
- contrato OpenAPI regenerado e comparado;
- web: format, lint, typecheck, testes e build;
- mobile: lint, typecheck e testes;
- suíte E2E completa, Axe e capturas das páginas de referência;
- `npm audit --omit=dev`;
- `git diff --check`;
- documentação final em `docs/quality/UX-REDESIGN-VALIDATION.md`.

## Relatório final

Apresente:

- mapa das rotas e telas finais;
- componentes reutilizáveis criados;
- padrões antigos removidos;
- resultados exatos de todos os comandos;
- problemas encontrados e como foram resolvidos;
- riscos e limitações restantes;
- itens adiados por dependerem de decisão;
- comandos para execução local;
- sugestão de título e comando de commit.
