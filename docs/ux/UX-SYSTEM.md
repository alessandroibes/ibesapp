# UX e Design System

Objetivo: produto institucional contemporâneo, bonito, rápido e simples de operar durante reuniões/eventos.

Princípios:
- tarefas frequentes em poucos toques;
- mobile-first para frequência e consulta operacional;
- desktop eficiente para cadastros, relatórios, financeiro e planejamento;
- WCAG 2.2 AA;
- estados vazio/loading/erro/sucesso;
- hierarquia tipográfica forte;
- design tokens próprios sobre Tailwind/shadcn;
- composição de painel administrativo próxima ao Tailwind Admin, com sidebar responsiva, cabeçalho operacional, superfícies neutras e páginas em cartões;
- preservar identidade e linguagem dos Embaixadores do Rei sobre essa composição, sem incorporar fluxos ou dados demonstrativos de templates.

Navegação e cadastros:
- cada módulo possui rota própria e endereço copiável;
- cadastros extensos usam uma página de listagem e páginas próprias para inclusão, visualização e edição;
- ações curtas e contextuais, como inativar ou reativar uma pessoa, usam diálogo modal;
- listas operacionais oferecem busca, filtros, estado vazio e ações explícitas por registro;
- a navegação preserva foco, rótulos acessíveis e adaptação para telas pequenas.

Agenda deve oferecer mês, semana/lista e cronograma anual. Status concluído deve ser visível sem depender apenas de cor. Eventos cancelados devem permanecer no histórico.

A evolução planejada da interface web, seus padrões por tipo de tela e os limites para não alterar regras de negócio estão definidos em `docs/ux/UX-REDESIGN.md` e `plans/UX-REDESIGN-ROADMAP.md`.

Os tokens, componentes fundamentais, variantes e regras de composição da fundação web estão documentados em `docs/ux/DESIGN-SYSTEM-COMPONENTS.md`.
