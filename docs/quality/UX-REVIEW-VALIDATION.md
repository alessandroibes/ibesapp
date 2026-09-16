# Validação da revisão de UX

## Escopo entregue

- O contexto autenticado do web prioriza a Embaixada e a Igreja selecionadas, com cabeçalho e painel mais compactos.
- As áreas permitidas no web são apresentadas como abas acessíveis. Uma única área permanece montada por vez, e o teclado permite navegar com setas, `Home` e `End`.
- A navegação de áreas no web rola horizontalmente dentro de seu próprio limite em telas estreitas, sem aumentar a largura da página.
- O aplicativo mobile apresenta somente o módulo ativo e inicia pela Agenda quando ela está autorizada. A troca entre Agenda, Pessoas, Organização e Competições respeita as permissões retornadas pela API.
- Formulários web anunciam sucesso e erro, removem mensagens antigas quando a pessoa volta a editar e levam foco programático ao erro de envio.
- Consultas simultâneas exibem um único estado de carregamento ou erro, evitando mensagens repetidas.
- Listas de pessoas aproveitam a largura disponível no desktop, e formulários de organização usam cartões consistentes.
- A preferência de redução de movimento do sistema é respeitada.

## Decisões técnicas

- As áreas usam o padrão ARIA de abas no web e papéis equivalentes de acessibilidade no React Native.
- A seleção continua derivada das permissões do contexto. A revisão não acrescenta permissões nem altera autorização.
- Apenas o conteúdo da área ativa é montado, reduzindo consultas, rolagem e distração visual.
- Nenhuma entidade, regra de domínio, endpoint ou migration foi alterado.

## Validações

- Testes web: 11 aprovados.
- Testes mobile: 9 aprovados.
- Testes de integração .NET: 81 aprovados.
- Testes E2E: 5 aprovados, incluindo análise WCAG 2.2 AA, navegação das abas por teclado e verificação de largura móvel.
- O Entity Framework não encontrou mudanças pendentes no modelo e gerou o script idempotente das 6 migrations existentes.
- Build de produção, lint, typecheck e formatação foram validados no web, mobile e .NET.
- Os testes de integração confirmaram novamente isolamento por Igreja e regras de progressão, incluindo idade, admissão, tarefas fora de ordem, versões de Manual e permanência em Posto.

## Linguagem de negócio

Os novos nomes e textos de negócio permanecem em português brasileiro: Embaixada, Igreja, Pessoas, Agenda, Organização, Competições e áreas de trabalho. Termos técnicos como `tab`, `tabpanel`, `loading` e `typecheck` aparecem somente em APIs técnicas, testes ou comandos.
