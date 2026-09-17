# Mapa de telas

## Web autenticado

O shell apresenta somente áreas permitidas no vínculo da Igreja selecionada. Igreja é o tenant e cada Igreja possui uma Embaixada.

| Área | Rotas finais | Finalidade |
| --- | --- | --- |
| Pessoas e Jornada | `/pessoas`, `/pessoas/nova`, `/pessoas/{id}`, `/pessoas/{id}/editar` | lista, cadastro, ficha, Jornada, Frequência, vínculos, histórico, inativação e reativação |
| Igreja e Embaixada | `/instituicao`, `/instituicao/editar` | resumo institucional, Conselheiros, lideranças e edição |
| Manuais | `/manuais`, `/manuais/nova`, `/manuais/{id}` | versões e tarefas versionadas |
| Agenda | `/agenda`, `/agenda/nova`, `/agenda/configuracoes` | Hoje, Próximos, Lista, Mês, Ano, cadastro e configurações |
| Atividade e reunião | `/agenda/atividades/{id}/ocorrencias/{data}`, `/agenda/reunioes/{id}/chamada` | detalhe, recorrência, roteiro e chamada |
| Organização | `/organizacao/consulados`, `/organizacao/consulados/{id}`, `/organizacao/diretoria`, `/organizacao/mandatos/{id}` | Consulados, Cônsul, membros, Diretoria, cargos e mandatos |
| Competições | `/competicoes`, `/competicoes/nova`, `/competicoes/catalogo`, `/competicoes/aptidoes`, `/competicoes/{id}` | catálogo, aptidões, provas e escalações |
| Financeiro | `/financeiro` | resumo, filtros e lançamentos simples da Embaixada |
| Acervo Histórico | `/acervo`, `/acervo/novo`, `/acervo/{id}`, `/acervo/{id}/editar` | linha do tempo, detalhe, pessoas, atividade e anexos privados |

Busca por nome permanece fora da URL. Parâmetros restauráveis usam somente contexto operacional sem dados pessoais, como visualização, datas, situação, categoria, iniciativa, página e aba.

## Mobile

O aplicativo para liderança adulta mantém Agenda, Chamada, Pessoas, Jornada, Organização e Competições conforme permissões. Sua reformulação visual pertence a um ciclo futuro.

## Itens adiados

Dashboard, Relatórios, aniversariantes, identidade visual oficial e políticas ainda abertas não possuem rotas nesta entrega. Seus requisitos devem ser decididos antes da implementação.
