# Evolução da experiência web

## Objetivo

Evoluir a interface web para um painel administrativo contemporâneo, claro e eficiente, próximo à composição visual do Tailwind Admin, sem incorporar código, dados demonstrativos ou fluxos de terceiros. A evolução deve preservar integralmente regras de negócio, contratos, permissões, isolamento por Igreja, auditoria e proteção dos dados de menores.

Esta especificação complementa `UX-SYSTEM.md`. Enquanto a migração estiver em andamento, cada prompt deve manter as telas não migradas funcionais.

## Diagnóstico da interface atual

- O cabeçalho global, a identificação da área e o título interno repetem contexto e consomem espaço.
- Vários módulos concentram consulta, cadastro, edição e histórico em uma única página.
- A ficha de Pessoa acumula dados pessoais, vínculos, frequência e Jornada em uma rolagem muito longa, principalmente no celular.
- Agenda, Organização e Competições misturam filtros, visualizações, formulários e detalhes.
- Há excesso de cartões aninhados, bordas e expansores com o mesmo peso visual.
- A maior parte dos elementos usa HTML e CSS global; apenas o botão possui primitiva reutilizável no design system.
- Estados de carregamento, vazio, erro e sucesso ainda variam entre módulos.
- `styles.css` e os componentes de domínio concentram responsabilidades demais, dificultando consistência e evolução.

## Direção visual

- Manter identidade provisória baseada em azul, azul-marinho e neutros. A identidade visual oficial continua uma questão aberta e não deve ser presumida.
- Usar cor para indicar ação, seleção e estado, sempre com texto ou ícone complementar.
- Reduzir cartões aninhados; reservar cartões para agrupamentos com significado.
- Usar hierarquia tipográfica clara, largura de leitura controlada e densidade adequada para operação administrativa.
- Usar sombras discretas, bordas suaves, raios e espaçamentos derivados de tokens.
- Adotar ícones de uma biblioteca consistente em vez de SVGs duplicados manualmente.

## Estrutura de página

Cada página de módulo deve ser composta, quando aplicável, por:

1. breadcrumb navegável;
2. `PageHeader` com título, descrição curta e ações;
3. indicadores resumidos apenas quando ajudarem uma decisão;
4. filtros persistentes na própria rota ou na URL;
5. conteúdo principal em tabela, calendário, linha do tempo ou cartões;
6. estado de carregamento, vazio, erro e sucesso;
7. paginação e ações secundárias no contexto correto.

O nome da Embaixada e a Igreja selecionada permanecem no shell. Eles não devem ser repetidos como título principal em todas as páginas.

## Padrões por tipo de interação

### Listagem

- busca e filtros próximos da tabela;
- filtros refletidos na URL quando isso permitir compartilhar ou restaurar a consulta;
- ação primária no cabeçalho;
- linha inteira ou ação explícita para visualizar;
- menu de ações para editar, inativar, excluir ou outras operações menos frequentes;
- tabela no desktop e apresentação adequada à largura móvel, sem rolagem horizontal desnecessária;
- quantidade, paginação e estado vazio com linguagem natural em português.

### Detalhe

- resumo da entidade e situação no topo;
- ações autorizadas agrupadas;
- abas quando existirem conjuntos independentes de informação;
- histórico apresentado como linha do tempo ou tabela, não como formulário;
- operações curtas em diálogo; operações extensas em página própria.

### Formulário

- campos agrupados por assunto;
- descrição curta quando o efeito do campo não for evidente;
- erros próximos dos campos e resumo acessível quando necessário;
- ação principal e cancelamento consistentes;
- proteção contra envio duplicado;
- aviso antes de abandonar alterações não salvas quando aplicável;
- valores históricos e derivados claramente identificados.

### Ações sensíveis

- inativação, reativação, cancelamento, reabertura e exclusão exigem confirmação adequada ao risco;
- a interface não substitui validação, autorização ou auditoria do servidor;
- ações destrutivas usam variante visual própria e texto específico.

## Componentes fundamentais

O design system web deve oferecer componentes reutilizáveis e acessíveis para:

- botão com variantes e tamanhos;
- campo de texto, área de texto, seleção, checkbox e rótulo;
- cartão, badge e separador;
- breadcrumb e cabeçalho de página;
- abas;
- tabela e paginação;
- menu de ações;
- diálogo, painel lateral e confirmação;
- alerta e notificação;
- skeleton;
- estados de vazio, erro e acesso negado;
- avatar/foto;
- linha do tempo;
- filtros e barra de ferramentas.

Os componentes podem seguir as convenções do shadcn/ui sobre Radix e Tailwind. Não copiar componentes de templates comerciais. Dependências novas devem ser mínimas, justificadas e auditadas.

## Arquitetura de informação alvo

### Pessoas

- lista com condições Todos, Embaixadores, Candidatos, Visitantes e Inativos;
- cadastro e edição em páginas próprias;
- detalhe com Resumo, Jornada, Frequência, Vínculos e Histórico;
- inativação e reativação em diálogo.

### Agenda e reuniões

- calendário/lista como entrada do módulo;
- cadastro e edição em página própria;
- detalhe da atividade com ocorrências e ações;
- chamada como fluxo operacional destacado;
- tipos, promotoras e modelos em Configurações da Agenda.

### Organização

- visão separada de Consulados e Diretoria;
- detalhe do Consulado com membros, Cônsul e histórico;
- mandatos e ocupações em detalhe próprio.

### Competições

- lista de competições;
- detalhe com provas, aptidões, escalações e histórico;
- catálogo de modalidades/provas separado da operação de uma competição;
- finalização e reabertura com situação e confirmação explícitas.

### Instituição, Manuais, Financeiro e Acervo

- dados da Igreja e Embaixada apresentados como resumo legível, com edição própria;
- Conselheiros e lideranças em listagens ou seções independentes;
- Manuais com lista de versões e detalhe das tarefas;
- Financeiro com resumo, filtros e lançamentos; formulário extenso fora da listagem;
- Acervo com linha do tempo e detalhe do marco; anexos dentro do detalhe.

## Responsividade

- larguras de 320 px ou mais não podem gerar rolagem horizontal da página;
- ações críticas devem permanecer alcançáveis sem cobrir conteúdo;
- tabelas devem escolher entre colunas prioritárias, cartões ou rolagem localizada;
- abas devem permitir rolagem própria e indicar a seleção;
- formulários usam uma coluna no celular e agrupamento progressivo em telas maiores;
- o menu lateral torna-se painel lateral com foco controlado e retorno de foco.

## Acessibilidade

- WCAG 2.2 AA;
- navegação completa por teclado;
- foco visível;
- contraste validado automaticamente;
- rótulos e descrições programáticas;
- mensagens de erro e sucesso anunciadas;
- estados não comunicados somente por cor;
- alvos de toque adequados;
- preferência de redução de movimento respeitada.

## Fora do escopo desta evolução

- alterar regras de progressão, frequência, organização, competições ou financeiro;
- criar permissões, cargos ou estados de negócio;
- modificar migrations ou contratos apenas por conveniência visual;
- criar a identidade visual oficial da organização;
- implementar Dashboard ou Relatórios sem requisitos e contratos aprovados;
- reescrever o aplicativo mobile nativo. Ele deve continuar compilando e consumindo o contrato existente.

