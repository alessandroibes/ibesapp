# Decisões consolidadas

## Produto e plataforma
- Multi-organização/multi-tenant.
- Cada Igreja é um tenant e possui exatamente uma Embaixada.
- Primeiro tenant real: a Igreja da Embaixada James Jackson Taylor (Embaixada J. J. Taylor); identificação da Igreja ainda não informada. Não criar dados reais presumidos.
- O produto deverá poder evoluir para sistema completo da igreja.
- Pais/responsáveis não terão acesso no MVP.
- Mobile inicialmente para Conselheiros/liderança adulta.

## Tecnologia
- .NET 10 / ASP.NET Core.
- Monólito modular + vertical slices.
- PostgreSQL.
- React + TypeScript + Vite.
- Tailwind CSS + shadcn/ui com design system próprio.
- React Native + Expo + Expo Router.
- ASP.NET Core Identity + OpenIddict.
- Containers + PostgreSQL gerenciado.
- Conta adulta única, com vínculos e permissões independentes por Igreja.
- Web com BFF e cookie de sessão HttpOnly; credenciais OAuth não são entregues ao JavaScript web.
- Mobile com Authorization Code + PKCE no navegador do sistema.
- CI no GitHub Actions.

## Fundação — confirmação de 14/09/2026
- Igreja define o limite de isolamento; o escopo da Embaixada é o mesmo tenant, dada a relação 1:1.
- O bootstrap usa somente dados fictícios de desenvolvimento, ativados explicitamente. Provisionamento real, convites e recuperação de contas não estão definidos nesta fase.

## Embaixadores
- Faixa geral: 9 a 17 anos.
- O menino permanece Embaixador até a véspera de completar 18 anos. A condição atual é calculada, sem apagar sua trajetória ao completar 18.
- É permitido cadastrar hoje pessoas maiores de 17 anos para registrar trajetórias históricas; a idade é validada na data de cada fato da jornada.
- A conclusão do Sênior registra o ingresso como Emérito na mesma data, mesmo sem manual disponível. Tarefas e conclusão do Emérito permanecem indisponíveis até definição do manual.
- A versão do manual fica vinculada ao ingresso em cada posto e não muda durante aquele posto. Migrações de edição não fazem parte desta fase.
- Antes de completar Requisitos Mínimos, o menino é Candidato.
- Requisitos Mínimos: Significado do nome Embaixador do Rei; Compromisso dos ER; Tema dos ER; Divisa dos ER; Hino Oficial dos ER.
- Cada requisito registra sua data de conclusão.
- Ao completar os requisitos e ter a admissão oficialmente registrada, ingressa como Embaixador Escudeiro.
- Postos: Embaixador Escudeiro, Embaixador Arauto, Embaixador Sênior, Embaixador Emérito.
- Postos são titulações educacionais, não hierarquia.
- Cada um dos três manuais atualmente conhecidos possui 10 tarefas; o manual do Emérito ainda não foi finalizado.
- Tarefas podem ser concluídas em qualquer ordem.
- Cada tarefa concluída possui data de conclusão.
- Manual é versionado por identificação como `2ª Edição - 2024`.
- Página, conteúdo detalhado e checklist/critério de avaliação não são controlados.
- Idade no ingresso no primeiro posto define permanência mínima: <14 anos = 12 meses por posto; >=14 anos = 6 meses por posto.
- A regra permanece durante a trajetória.
- Ao registrar oficialmente a conclusão de um posto, o ingresso no posto seguinte ocorre na mesma data, independentemente da cerimônia.
- Cerimônias de reconhecimento e entrega de certificado possuem histórico próprio.

## Faixas etárias
- Junior: menor de 12.
- Adolescente: 12 a 14.
- Juvenil: 15 a 17.
- Não armazenar como estado permanente quando puder ser derivado.

## Organização
- Embaixada é formada por ER e Conselheiros.
- Consulados são pequenos grupos de ER; cada um possui um Cônsul.
- Nome de Consulado é curto, normalmente personagem/lugar bíblico.
- Diretoria é flexível: cada Embaixada escolhe cargos e quantidade conforme realidade local.
- Cargos básicos sugeridos: Embaixador Chefe, Embaixador Assistente, Secretário, Porta-Voz, Tesoureiro, Intendente.
- Cônsul decorre da liderança de um Consulado.
- Cargo, Posto e Permissão são independentes.
- Preservar histórico de diretorias, cargos, consulados, lideranças e acontecimentos.
- Confirmação da Fase 4: Candidatos e Embaixadores podem integrar Consulados, definidos pelos Conselheiros; cada menino possui no máximo um vínculo vigente e a transferência encerra o anterior na mesma data em que inicia o novo.
- Cada Consulado possui no máximo um Cônsul vigente, escolhido entre seus membros vigentes.
- Somente Embaixadores podem integrar a Diretoria. Vínculo vigente como Membro da Igreja da Embaixada é uma preferência informativa, sem impedir a ocupação.
- Diretoria possui mandatos datados; cargos são configuráveis e possuem quantidade de vagas. Um Embaixador pode ocupar mais de um cargo e acumular cargo com a função de Cônsul.
- Eleição registra somente o resultado. Ocupações preservam histórico e podem ser encerradas e iniciadas em datas diferentes, registrando o motivo quando encerradas.

## Frequência e cadastro
- Frequência aceita ER, Candidatos e Visitantes.
- Primeira reunião é derivada da primeira presença registrada.
- Ficha do ER agrega dados pessoais, responsáveis, igreja/batismo, admissão, progressão, frequência, carteira, Bíblia, foto e observações.
- Responsáveis são extensíveis, embora UI inicial destaque pai e mãe.

## Competições
- Catálogo de provas reutilizável.
- Competição possui data-base de categoria definida pelo regulamento.
- Conselheiro define previamente em quais provas cada menino está apto.
- Escalação mostra apenas aptos que também sejam elegíveis pelas regras da competição.
- Provas coletivas possuem mínimo/máximo de titulares/inscritos e limite de reservas configuráveis.
- Revezamentos podem exigir exatamente 4 titulares e permitir reservas conforme regulamento.
- Biografia Missionária possui missionário/referência variável por competição.
- Conhecimentos Gerais da Bíblia possui livro de referência variável por competição.

## Agenda
- Confirmação da Fase 3: frequência usa Presença com Pontualidade, Presença com Atraso, Falta e Falta Justificada. Ausência de lançamento não equivale a falta.
- Visitante utiliza cadastro mínimo de Pessoa, sem candidatura automática.
- Cancelamento preserva frequência e auditoria. Presenças de reunião cancelada continuam contando para a primeira reunião.
- Recorrências diárias, semanais, mensais e anuais, com intervalo e término opcional; exceções individuais e alterações futuras preservam reuniões realizadas.
- Deve existir cronograma anual/mensal e agenda.
- Atividades podem ser internas ou promovidas por entidades externas.
- Deve suportar recorrência, prazos, eventos de um ou vários dias, horário, local, valor, entidade promotora, status e observações.
- Reuniões podem utilizar roteiros/modelos reutilizáveis.
