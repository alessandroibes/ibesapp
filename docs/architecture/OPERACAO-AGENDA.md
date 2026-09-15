# Operação e agenda — Fase 3

Entrega exclusiva do prompt `02-operacao-agenda.md`. Não implementa Consulados, Diretoria, participantes de atividades, competições ou financeiro.

## Frequência e visitantes

Estados confirmados: **Presença com Pontualidade**, **Presença com Atraso**, **Falta**, **Falta Justificada**. Não existe estado persistido de “não informado”: pessoa sem registro aparece como “Sem lançamento”, sem falta presumida. A chamada inicia com pessoas que têm trajetória e pessoas já registradas naquela reunião; a busca por nome encontra os demais cadastros da Igreja.

Visitante é uma Pessoa com nome obrigatório; a criação não gera jornada, login ou presença. A busca antes do cadastro evita duplicações sem deduzir identidade somente pelo nome. O mesmo cadastro mantém as presenças caso depois ganhe uma trajetória ER.

Cada reunião/pessoa tem uma frequência atual e versão de concorrência. Toda gravação registra autor, instante e estado anterior/novo em histórico imutável, além da auditoria geral. Observação/justificativa é opcional. Não há conversão automática de pontualidade a partir do horário: quem faz a chamada escolhe explicitamente o estado.

Frequência não pode ser lançada para data futura ou anterior ao nascimento informado. Não se impõe a faixa de 9–17 anos aos visitantes. A primeira reunião é a menor data entre as presenças atuais com pontualidade ou atraso, calculada na leitura da ficha; não existe coluna duplicada. **Reuniões canceladas continuam contando**, conforme a decisão expressa do usuário. Correção para falta pode mudar a primeira reunião, preservando o histórico da correção.

## Agenda e recorrências

Atividade tem título, tipo configurável, promotora cadastrada, início/fim, horários ou dia inteiro, fuso, local, observações, destaque, valor/moeda opcionais, link HTTPS, responsável e atividade relacionada opcionais. Prazo é um item de agenda que pode se relacionar a outra atividade. Não gera lançamento financeiro.

Situações: Planejada, Confirmada, Concluída, Cancelada e Adiada. Eventos podem durar vários dias. Tipos e promotoras não usam enum fechado nem seed de dados reais. Modelos aceitam até 100 blocos ordenados, com duração estimada e observação.

Recorrências diárias, semanais, mensais e anuais têm intervalo e término opcional inclusivo. Semanas são agrupadas a partir do domingo; dias selecionados incluem o dia inicial. Mensais/anuais mantêm o dia e ignoram datas inexistentes (31 de fevereiro, 29 de fevereiro em ano não bissexto). As datas são de calendário, com horários locais e fuso explícito; não se soma uma duração fixa de 24 horas em UTC para gerar recorrências.

Séries não são materializadas indefinidamente. Consultas expandem até 366 dias e retornam no máximo 5.000 ocorrências de até 1.000 séries, pedindo filtros mais específicos quando necessário. Eventos que começaram antes do intervalo mas ainda estão ocorrendo são incluídos. Exceções remarcadas aparecem no novo intervalo e não duplicam a ocorrência original.

Alterar/cancelar uma ocorrência mantém a série e sua data original identificadora. Não se permite remarcar reunião já realizada ou com frequência; cancelamento continua disponível, preservando dados. Alteração de trecho futuro encerra a série antiga na véspera e cria nova série; reuniões/exceções já preparadas bloqueiam a substituição desse trecho para impedir sua perda silenciosa. Nesse caso, usar exceções individuais ou escolher um trecho posterior.

## Reuniões e roteiros

Uma ocorrência de atividade pode ser preparada como reunião, uma única vez. Prazo não é reunião. O modelo é opcional: guarda-se a cópia dos itens e a versão do modelo usada. Editar o modelo posteriormente não altera reuniões existentes. O roteiro da reunião pode ser ajustado independentemente, com concorrência e auditoria; não há execução rígida dos blocos.

## Interfaces e segurança

Web: dia, próximos 30 dias, semana, calendário mensal e cronograma anual; filtros por tipo, promotora e situação; modelos, exceções, criação de reuniões, chamada e histórico. Ficha mostra primeira reunião e até 500 registros recentes de frequência.

Mobile: agenda diária, seleção de reunião, roteiro, busca/paginação da chamada, criação mínima de visitante e quatro botões de frequência por pessoa com observação opcional. Gravações aguardam confirmação da API; falha de rede não é apresentada como sucesso. Não há fila offline nesta entrega. Troca de Igreja desmonta a interface anterior e cancela suas consultas.

Permissões independentes: `agenda.consultar`, `agenda.editar`, `frequencia.consultar`, `frequencia.registrar`. Nenhum cargo ou Posto concede essas permissões. API exige vínculo na Igreja; cookie web usa CSRF, mobile usa bearer. Chaves/FKs compostas, filtros e guarda de escrita impedem referências cruzadas. DTOs e conceitos de negócio permanecem em português.

Migration `OperacaoEAgenda` acrescenta schemas `agenda` e `frequencia`, sem apagar tabelas anteriores. Valores e estados de frequência não são gravados nos logs. Bootstrap explicitamente habilitado atualiza apenas as permissões da conta fictícia; não cria cronograma sem ano informado nem presume promotoras reais.

Execução: `docker compose up --build -d`, depois abrir `https://localhost:7443`. Para desenvolvimento web/mobile e demais comandos, consultar [execução local](../operations/LOCAL-DEVELOPMENT.md).
