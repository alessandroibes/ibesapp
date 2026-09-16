# Organização interna

O módulo `Ibes.ConsuladosDiretoria` implementa a organização da Embaixada sem criar dependência entre cargo, Posto e permissão do sistema. Seus dados ficam no schema PostgreSQL `organizacao`; todas as chaves primárias e estrangeiras de negócio incluem `IgrejaId`.

## Consulados

`Consulado` preserva seu período de existência. `MembroConsulado` aceita Candidato ou Embaixador entre 9 anos e a véspera dos 18 na data do fato. A API impede períodos sobrepostos e a transferência encerra o vínculo anterior, encerra uma eventual liderança de Cônsul e abre o vínculo de destino na mesma transação e data.

`LiderancaConsulado` registra o histórico de Cônsules. A pessoa escolhida precisa ser membro vigente daquele Consulado na data. Índices únicos parciais protegem no banco o único vínculo atual por menino e o único Cônsul atual por Consulado.

## Diretoria

`CargoEmbaixada` permite nome e quantidade de vagas configuráveis. `MandatoDiretoria` possui período fechado e não pode se sobrepor a outro mandato do tenant. `OcupacaoCargo` exige Embaixador na data, respeita o período do mandato e calcula a lotação durante todo o intervalo atingido. Uma pessoa pode ocupar cargos diferentes e acumular um cargo com a função de Cônsul.

`ResultadoEleicao` registra somente o resultado e a ocupação produzida. O registro é imutável. Uma troca é representada pelo encerramento motivado da ocupação anterior e por uma nova ocupação, com ou sem intervalo entre as datas. A versão do mandato serializa novas ocupações concorrentes para proteger a última vaga.

O vínculo eclesiástico como Membro da Igreja da Embaixada é calculado na data inicial da ocupação e retornado como informação. Ele não bloqueia a designação. Nenhuma entidade de organização lê ou altera `VinculoIgreja.Permissoes`.

## Interfaces

A web permite consultar e manter Consulados, vínculos, Cônsules, cargos, mandatos, ocupações e resultados eleitorais conforme as permissões `organizacao.consultar` e `organizacao.gerenciar`. O mobile oferece consulta à composição atual e histórica para a liderança adulta. Os dois clientes usam o contrato OpenAPI compartilhado e apresentam estados de carregamento, vazio e erro.
