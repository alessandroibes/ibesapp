# Componentes do design system web

Esta referência documenta a fundação visual criada na Etapa UX 06. Os componentes ficam em `apps/web/src/components/ui`, seguem composição semelhante ao shadcn/ui e usam Radix nos controles que precisam de foco, teclado e camadas robustas.

## Tokens

`apps/web/src/styles/tokens.css` concentra cores semânticas, tipografia, raios, sombras, foco, dimensões do shell e camadas. A identidade continua provisória: azul, marinho e neutros expressam o produto sem assumir uma paleta institucional oficial.

Use os tokens semânticos (`--primary`, `--surface`, `--foreground`, `--muted`, `--border`, `--danger`, `--success` e `--warning`) em vez de repetir cores em novos módulos. `--focus-ring` define o foco visível e os níveis `--z-*` organizam cabeçalho, sidebar, sobreposição, diálogo e toast.

## Componentes e variantes

| Componente | Variantes ou composição | Uso atual ou previsto |
| --- | --- | --- |
| `Button` | `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`; tamanhos `sm`, `default`, `lg`, `icon` | seletor, sessão e navegação móvel |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Label` | campos nativos com erro, descrição e foco comuns | formulários dos módulos |
| `Card` | cabeçalho, título, descrição, conteúdo e rodapé | superfícies de cadastro e resumo |
| `Badge` | `neutral`, `primary`, `success`, `warning`, `danger` | tenant e contexto ativo |
| `Separator` | separação visual neutra | grupos e painéis |
| `Breadcrumb` | itens, links e página atual | cabeçalho de página do shell |
| `PageHeader` | título, descrição, ações, metadados e breadcrumb | hierarquia única das páginas autenticadas |
| `Dialog` | título, descrição e fechamento acessível | ações contextuais e formulários curtos |
| `Sheet` | painel lateral com sobreposição | navegação móvel do shell |
| `AlertDialog` | confirmação explícita | ações destrutivas ou irreversíveis |
| `DropdownMenu` | gatilho, itens, rótulo e separador | menus de ações por registro |
| `Tabs` | lista, gatilhos e conteúdo | visões alternativas no mesmo contexto |
| `Table` | cabeçalho, corpo, linha, célula e legenda | listas de dados estruturados |
| `Pagination` | navegação, itens e links | listas paginadas |
| `Alert` | `info`, `success`, `warning`, `danger` | mensagens e estado de erro ou acesso negado |
| `Skeleton` | bloco adaptável | carregamento sem mudança brusca de layout |
| `EmptyState` | ícone, título, descrição e ação | lista vazia, erro e acesso negado |
| `Toast` | `default`, `success`, `danger`; provedor e hook | retorno breve após ações |
| `Avatar` | imagem ou iniciais | identidade de pessoas e usuários |
| `Timeline` | lista cronológica com título e descrição | históricos e andamento |
| `Toolbar` | conteúdo, ações e grupo | busca, filtros e ações de listas |

## Regras de uso

- Todo botão somente com ícone precisa de nome acessível.
- Erros de campo devem ligar a mensagem ao controle com `aria-describedby` e `aria-invalid`.
- Diálogos, painéis, menus, abas e toasts devem usar os componentes desta fundação para conservar teclado, foco e leitura por tecnologia assistiva.
- Status nunca pode depender apenas de cor; associe texto ou ícone com rótulo.
- Páginas autenticadas usam um único `PageHeader`. O nome da Embaixada e da Igreja aparece como metadado, sem competir com o título da área atual.
- Novas telas devem oferecer estados de carregamento, vazio, erro e acesso negado com `Skeleton`, `EmptyState` ou `Alert`, conforme o caso.
- Respeite `prefers-reduced-motion`; não adicione animação essencial para entender ou operar a interface.
