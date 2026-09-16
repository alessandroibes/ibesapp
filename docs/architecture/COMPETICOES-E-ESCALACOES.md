# Competições e escalações

O módulo `Ibes.Competicoes` implementa catálogo reutilizável, aptidões, regras por competição e escalações. Os dados ficam no schema PostgreSQL `competicoes`, com `IgrejaId` em todas as chaves primárias e estrangeiras de negócio.

## Catálogo e aptidões

`Modalidade` agrupa `Prova`. A prova informa se é individual ou coletiva e se exige uma referência variável do tipo Missionário ou Livro bíblico. Modalidades e provas podem ser desativadas sem apagar o histórico.

`AptidaoProva` é uma decisão humana registrada por Conselheiro, com início, encerramento e motivo. Candidatos e Embaixadores entre 9 anos e a véspera dos 18 podem receber aptidão. Um índice único parcial protege uma única aptidão vigente por pessoa e prova.

## Competição e elegibilidade

`Competicao` possui período e `DataBaseCategoria` própria. `ProvaCompeticao` associa uma prova do catálogo às regras daquela edição: categorias permitidas, mínimo de titulares, máximo total de participantes, máximo de reservas, quantidade exata opcional, referência e horário opcional.

As categorias Junior, Adolescente e Juvenil são calculadas a partir da data de nascimento e da data-base. Livre aceita qualquer faixa ER válida. Nenhuma faixa é persistida na pessoa. O endpoint de candidatos retorna somente pessoas que possuem jornada de Candidato ou Embaixador, aptidão vigente para a prova e elegibilidade etária.

## Escalação

Cada prova da competição possui uma `EscalacaoProva`. O máximo considera titulares e reservas conjuntamente; as reservas ainda respeitam seu limite específico. Participantes repetidos, inaptos ou inelegíveis são rejeitados. O mínimo e a quantidade exata de titulares são exigidos na finalização.

Uma escalação finalizada não pode ser editada. A reabertura exige motivo e Conselheiro ativo. Finalizações e reaberturas geram `AlteracaoEscalacao` imutável, além da auditoria técnica. Quando duas provas possuem horários sobrepostos, candidatos já escalados recebem um aviso de conflito sem bloqueio automático.

## Interfaces e autorização

A web permite manter catálogo, aptidões, competições, regras e escalações. O mobile consulta competições e escalações de forma simplificada. As permissões `competicoes.consultar` e `competicoes.gerenciar` são independentes de Posto e cargo; toda escrita também exige vínculo vigente de Conselheiro.
