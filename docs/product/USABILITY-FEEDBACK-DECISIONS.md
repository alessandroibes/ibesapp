# Decisões da evolução orientada pelo uso

Decisões confirmadas em 21/09/2026 para orientar os prompts 13 a 18. Este documento descreve o comportamento aprovado para as próximas etapas; ele não afirma que banco, API ou interfaces já foram alterados.

## Pessoas, meninos e Conselheiros

`Pessoa` permanece como cadastro geral da Igreja. A separação acontece nos vínculos, consultas e telas da Embaixada:

- `/pessoas` atende Candidatos, Embaixadores, Visitantes e Inativos;
- Conselheiros possuem área própria e cadastro simples;
- Jornada, categoria, Postos, tarefas, aptidões, provas e competições são fluxos dos meninos;
- uma trajetória ER histórica continua consultável quando a Pessoa se torna Conselheiro, mas não representa uma Jornada adulta atual;
- vínculo vigente de Conselheiro tem precedência na apresentação: a Pessoa aparece na área de Conselheiros e não como Visitante.

O conceito separado de liderança da Embaixada será removido neste ciclo. Existem, na prática, Conselheiro-chefe, segundo Conselheiro-chefe e Conselheiros auxiliares, mas sua modelagem foi adiada. Também não foi decidido controlar frequência de Conselheiros.

Foram rejeitadas uma lista única com mera diferenciação visual, porque mistura fluxos distintos, e entidades de pessoa separadas, porque duplicariam dados da mesma pessoa.

## Responsáveis livres

Cada responsável terá relação, nome, telefone/WhatsApp e a informação opcional `MoraComOEmbaixador`. O registro poderá ser criado, corrigido e removido diretamente, sem período de vigência e sem exigir que o responsável seja outra `Pessoa` cadastrada.

A migração deve ocorrer dentro de cada Igreja: copiar nome e WhatsApp da Pessoa hoje relacionada, preservar parentesco e iniciar a informação de moradia como não informada. Somente depois da cópia validada podem ser removidas a obrigatoriedade da Pessoa relacionada e as datas de início e fim.

Foram rejeitadas a inativação no lugar da remoção e a manutenção de histórico datado, pois o cadastro solicitado é simples e livre para correções.

## Manuais e tarefas

Identificação da versão, texto e ordem das tarefas podem ser corrigidos mesmo quando a versão já estiver vinculada a Jornadas. O Posto do Manual permanece fixo e a correção não troca a versão associada ao Posto.

Adicionar ou retirar tarefas altera o conjunto exigido apenas dos Postos em andamento que usam aquela versão. Ao retirar uma tarefa, eventual conclusão correspondente em um Posto em andamento é removida. Postos concluídos preservam a tarefa e sua conclusão como fatos oficiais, sem reabertura ou recálculo.

Foram rejeitadas a proibição de alterar tarefas após o primeiro uso, por impedir correções úteis, e a reavaliação de Postos concluídos, por modificar fatos oficiais já registrados.

## Agenda, modelos e reuniões

- modelo de roteiro nunca usado pode ser excluído;
- modelo já usado pode ser editado para preparações futuras ou arquivado, preservando o roteiro copiado nas reuniões existentes;
- atividade sem reunião, exceção, relação, lançamento financeiro ou marco histórico pode ser excluída mediante confirmação;
- em atividade recorrente, a exclusão da atividade alcança toda a série; uma ocorrência isolada deve ser cancelada;
- atividade ou reunião com frequência ou outra dependência histórica não pode ser excluída; a interface deve identificar o impedimento e orientar o cancelamento;
- reunião preparada sem frequência pode ser desfeita, mantendo a atividade na Agenda.

Exclusão e cancelamento são ações distintas. Nenhuma remoção pode apagar frequência, alterar a primeira reunião derivada ou excluir em cascata dados financeiros, acervo, exceções ou atividades relacionadas.

## Impacto esperado

As decisões exigem mudanças futuras em entidades, migration de responsáveis, consultas, contratos OpenAPI, rotas web/mobile e testes. A implementação deve manter isolamento por Igreja, autorização, concorrência e proteção dos dados de menores.

Os prompts 14, 16 e 17 contêm a implementação correspondente. Frequência e hierarquia detalhada de Conselheiros permanecem em `OPEN-QUESTIONS.md` e não fazem parte deste ciclo.
