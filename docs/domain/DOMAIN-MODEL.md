# Modelo de domínio

## Agregados/módulos
- Organizações e Tenants
- Pessoas e Responsáveis
- Embaixadas
- Candidatos e Embaixadores
- Conselheiros
- Requisitos Mínimos
- Postos, Manuais e Progressão
- Consulados
- Diretoria e Cargos
- Frequência e Visitantes
- Atividades, Agenda e Reuniões
- Competições, Provas, Aptidões e Escalações
- Financeiro
- Acervo Histórico
- Documentos
- Identidade, Permissões e Auditoria

## Pessoa
Base compartilhada para ER, Conselheiro e futura plataforma da igreja. Evitar duplicar uma pessoa quando ela assumir novos vínculos.

Na Embaixada, Conselheiros possuem fluxo próprio. Candidatos, Embaixadores, Visitantes e Inativos permanecem no fluxo de Pessoas. Vínculo vigente de Conselheiro impede que a ausência de Jornada o classifique como Visitante; uma Jornada antiga continua disponível somente como histórico.

## Responsável

Registro livre pertencente ao cadastro do menino, com relação, nome, telefone/WhatsApp e informação opcional de moradia. Não exige cadastro de outra Pessoa nem período de vigência.

## Embaixada
Possui nome oficial, nome usual, igreja vinculada, data de fundação, endereço, pastor, liderança adulta, história e configurações.

## Jornada do menino
Candidato -> admissão -> Escudeiro -> Arauto -> Sênior -> Emérito.
A jornada preserva histórico e datas oficiais.

## Progressão
Conclusões de requisitos/tarefas são fatos históricos com `DataConclusao`, `RegistradoPor` e timestamps técnicos.

Correções autorizadas de datas não exigem motivo ou histórico funcional adicional. Tarefas retiradas deixam de valer para Postos em andamento; fatos de Postos concluídos permanecem preservados.
