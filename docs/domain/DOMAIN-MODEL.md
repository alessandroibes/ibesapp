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

## Embaixada
Possui nome oficial, nome usual, igreja vinculada, data de fundação, endereço, pastor, liderança adulta, história e configurações.

## Jornada do menino
Candidato -> admissão -> Escudeiro -> Arauto -> Sênior -> Emérito.
A jornada preserva histórico e datas oficiais.

## Progressão
Conclusões de requisitos/tarefas são fatos históricos com `DataConclusao`, `RegistradoPor` e timestamps técnicos.
