# Financeiro e acervo histórico

Entrega exclusiva do prompt `05-financeiro-historia.md`. O módulo financeiro atende ao caixa simples da Embaixada e não implementa contabilidade, contas bancárias, conciliação, lançamentos previstos ou o financeiro geral da Igreja.

## Financeiro da Embaixada

`LancamentoFinanceiro` representa uma entrada ou saída realizada, com data, valor positivo em reais, motivo obrigatório e descrição opcional. Um lançamento pode se relacionar a uma pessoa, uma atividade da agenda e uma `IniciativaFinanceira`. A iniciativa permite agrupar campanhas, confecção de camisas e outras ações que não precisam ser eventos da agenda.

Consultas podem filtrar por período, pessoa, atividade ou iniciativa. O resumo calcula entradas, saídas, saldo e quantidade diretamente dos lançamentos filtrados. Valores derivados não são persistidos.

Lançamentos podem ser alterados e excluídos. Conforme decisão do produto, essas operações não possuem histórico funcional nem geram auditoria global. Tokens de versão ainda evitam que duas telas sobrescrevam uma à outra silenciosamente.

## Memória histórica

`MarcoHistorico` registra data ou período, título, descrição, categoria livre, autoria, atividade opcional e pessoas relacionadas. A linha do tempo pode mostrar a retrospectiva completa ou os marcos que atravessam determinado ano, em ordem cronológica ou inversa.

Fotos PNG/JPEG e documentos PDF de até 10 MB ficam armazenados privadamente no PostgreSQL. O download exige autenticação, permissão e contexto da Igreja e usa `Cache-Control: no-store`. Nome, tipo e assinatura do conteúdo são validados. Marcos e anexos podem ser editados, substituídos ou removidos sem histórico funcional, conforme decisão do produto.

## Isolamento e autorização

Todas as tabelas usam `IgrejaId` nas chaves primárias e estrangeiras de negócio. Filtros globais impedem leitura sem tenant e as chaves compostas impedem referências entre Igrejas. As permissões são `financeiro.consultar`, `financeiro.gerenciar`, `acervo.consultar` e `acervo.gerenciar`; elas permanecem independentes de Posto e cargo organizacional.

O web oferece lançamentos, iniciativas, filtros, resumo financeiro, marcos, filtros anuais, pessoas relacionadas e gestão de anexos. O mapa de telas não inclui esses módulos no mobile do MVP.
