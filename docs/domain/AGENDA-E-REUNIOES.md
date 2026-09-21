# Agenda, cronograma e reuniões

## Objetivo
Representar o cronograma anual que hoje é mantido em listas mensais, além de compromissos recorrentes, prazos e roteiros de reuniões.

## Atividade de agenda
Campos recomendados:
- título
- tipo
- início/fim (data e horário)
- dia inteiro
- recorrência opcional
- local
- descrição/observações
- entidade promotora
- valor opcional
- status: Planejada, Confirmada, Concluída, Cancelada, Adiada
- destaque
- atividade pai/relacionada
- anexos/links internos
- responsável
- tenant/Embaixada

Suportar eventos de vários dias, por exemplo Acampamento de 2 a 5 de julho.

## Origem/promotor
Atividade pode ser:
- da própria Embaixada;
- da Igreja;
- Departamento Estadual de ER;
- Departamento Nacional de ER;
- outra entidade cadastrada.
Não usar enum fechado: manter cadastro de entidades promotoras.

## Tipos comuns de reunião
- Reunião Recreativa
- Reunião de Trabalho nos Postos
- Reunião de Estudo Bíblico
- Reunião de Programa
- Reunião de Treinamento Bíblico
- Reunião Devocional
Outros tipos devem ser configuráveis.

## Modelos de roteiro
Reuniões podem usar um modelo reutilizável, sem obrigar execução rígida.
Exemplo de blocos:
1. Convivência (camaradagem)
2. Oração
3. Chamada (Foto)
4. Avisos
5. Ritual
6. Oração
7. Estudo Bíblico
8. Esgrima Bíblico

Cada modelo pode ter itens ordenados, duração estimada e observações. Ao criar reunião a partir de modelo, copiar uma versão do roteiro para que mudanças futuras no modelo não alterem reuniões históricas.

Modelo nunca usado pode ser excluído. Depois do primeiro uso, pode ser corrigido para novas preparações ou arquivado, mantendo intactas as cópias já gravadas nas reuniões.

## Recorrências
Exemplos suportados:
- toda quarta às 19h — Culto de Oração
- todo domingo às 9h — EBD
- todo domingo às 18h30 — Culto de Louvor e Adoração
- todo sábado 14h–15h30 — reunião ER
- todo sábado 16h–17h30 — treino de futsal

Usar regra de recorrência e permitir exceções/cancelamentos sem apagar a série.

Excluir a atividade recorrente alcança a série inteira e só é permitido quando ela não possui dependências. Uma ocorrência isolada é cancelada por exceção, não excluída.

## Remoção e preservação

Atividade sem reunião, exceção, relação, lançamento financeiro ou marco histórico pode ser excluída mediante confirmação. Qualquer uma dessas dependências impede a exclusão e deve ser apresentada ao Conselheiro com orientação para cancelar quando aplicável.

Reunião preparada sem frequência pode ser desfeita; a atividade continua na Agenda. Reunião com frequência não pode ser excluída, e seu cancelamento preserva os registros e o cálculo da primeira reunião.

## Prazos
Prazo de inscrição, pagamento, escolha ou entrega é item de agenda, podendo estar relacionado a uma atividade futura.

## Visualizações
- Hoje/próximos compromissos
- Semana
- Mês
- Ano/cronograma
- Lista por entidade promotora
- Filtros por tipo/status
- Mobile com agenda simplificada

## Importação inicial
O cronograma textual fornecido pelo usuário deve servir como referência de UX e pode futuramente ser importado, mas não assumir ano quando não explicitamente informado.
