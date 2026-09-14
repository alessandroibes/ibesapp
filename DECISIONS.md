# Decisões consolidadas

## Produto e plataforma
- Multi-organização/multi-tenant.
- Primeiro tenant: Embaixada James Jackson Taylor, nome usual Embaixada J. J. Taylor.
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

## Embaixadores
- Faixa geral: 9 a 17 anos.
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
- Deve existir cronograma anual/mensal e agenda.
- Atividades podem ser internas ou promovidas por entidades externas.
- Deve suportar recorrência, prazos, eventos de um ou vários dias, horário, local, valor, entidade promotora, status e observações.
- Reuniões podem utilizar roteiros/modelos reutilizáveis.
