# Prompt 06 — Fundação visual e shell web

## Leitura obrigatória

Leia integralmente, nesta ordem:

1. `AGENTS.md`;
2. `DECISIONS.md`;
3. `README.md`;
4. `docs/ux/UX-SYSTEM.md`;
5. `docs/ux/UX-REDESIGN.md`;
6. `docs/ux/SCREEN-MAP.md`;
7. `docs/architecture/ARCHITECTURE.md`;
8. `docs/architecture/PERMISSIONS.md`;
9. `docs/security/SECURITY-BASELINE.md`;
10. `docs/quality/DEFINITION-OF-DONE.md`;
11. `docs/quality/TESTING-STRATEGY.md`;
12. `plans/UX-REDESIGN-ROADMAP.md`.

Analise também o código atual de `apps/web`, seus testes e os contratos compartilhados antes de editar.

## Objetivo

Execute somente a Etapa UX 06: criar a fundação do design system e simplificar o shell autenticado. Não migre profundamente as telas de domínio e não avance para Pessoas, Agenda ou outros módulos.

## Escopo obrigatório

- Consolidar tokens de cor, tipografia, espaçamento, raio, sombra, foco e camadas.
- Manter a identidade visual provisória; não inventar identidade oficial, brasão, marca ou paleta institucional definitiva.
- Criar ou completar componentes acessíveis para botão, campos, rótulo, cartão, badge, separador, breadcrumb, cabeçalho de página, diálogo, painel lateral, confirmação, menu de ações, abas, tabela, paginação, alerta, skeleton, toast e estados vazio/erro/acesso negado.
- Usar convenções shadcn/ui e Radix quando forem adequadas à stack atual.
- Adotar uma biblioteca consistente de ícones se isso reduzir SVGs manuais; justificar e auditar qualquer dependência adicionada.
- Simplificar o shell para evitar repetição entre nome da Embaixada, área atual e título da página.
- Reorganizar a sidebar em grupos claros, preservando visibilidade por permissão e todas as rotas existentes.
- Manter o seletor de Igreja, encerramento de sessão e contexto do tenant acessíveis no desktop e no celular.
- Preservar foco ao abrir/fechar a navegação móvel, foco visível e redução de movimento.
- Começar a decomposição de `styles.css`, sem exigir reescrita integral nesta etapa.
- Manter telas ainda não migradas funcionais dentro do novo shell.

## Restrições

- Não alterar regras de negócio, entidades, banco, migrations, endpoints ou permissões.
- Não copiar código ou ativos de templates comerciais.
- Não implementar Dashboard ou Relatórios.
- Não reescrever o aplicativo React Native.
- Não criar dados demonstrativos novos.
- Não introduzir textos de negócio em inglês.
- Se uma decisão relevante não estiver documentada, pare e pergunte com opções, recomendação e justificativa.

## Critérios de aceite

- O shell possui uma única hierarquia clara de contexto e página.
- Navegação direta, recarregamento e retorno do navegador funcionam.
- Sidebar desktop e painel móvel respeitam permissões.
- Componentes fundamentais possuem variantes documentadas e exemplos reais de uso no shell.
- Não há rolagem horizontal da página a partir de 320 px.
- O shell passa em WCAG 2.2 AA automatizado e navegação por teclado.
- Dependências de produção não apresentam vulnerabilidades conhecidas.

## Validação obrigatória

Antes de concluir:

- execute formatação, lint, typecheck, testes e build do web;
- execute testes e typecheck do mobile para detectar impacto do contrato compartilhado;
- execute build e todos os testes .NET;
- execute E2E das jornadas existentes e análise Axe;
- confirme que não há alteração pendente de modelo EF nem contrato OpenAPI não justificado;
- execute `npm audit --omit=dev` e `git diff --check`;
- registre a validação em `docs/quality/UX-DESIGN-SYSTEM-VALIDATION.md`.

Ao final, apresente arquivos criados/alterados, decisões técnicas, dependências, problemas encontrados, resultados dos comandos e instruções para execução local.

