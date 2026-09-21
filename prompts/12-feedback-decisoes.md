# Prompt 12 — Decisões para evolução após avaliação de uso

## Pré-condição

Execute com a árvore de trabalho limpa. Esta etapa é obrigatória antes dos prompts 13 a 18.

## Leitura obrigatória

Leia integralmente `AGENTS.md`, `DECISIONS.md`, `README.md`, `docs/domain/`, `docs/product/`, `docs/architecture/`, `docs/ux/`, `docs/security/`, `docs/quality/`, `plans/IMPLEMENTATION-ROADMAP.md`, `plans/UX-REDESIGN-ROADMAP.md` e `plans/USABILITY-FEEDBACK-ROADMAP.md`.

Analise também as entidades, migrations, endpoints, contratos, telas e testes atuais de Pessoas, Embaixada, Progressão, Manuais e Agenda.

## Objetivo

Consolidar as decisões de negócio necessárias para executar as observações do usuário sem inventar comportamento. Nesta etapa, altere somente documentação.

## Decisões obrigatórias a obter

Apresente as opções abaixo ao usuário, com recomendação e efeitos. Registre em `DECISIONS.md` apenas as respostas confirmadas.

1. **Separação de Conselheiros e meninos**
   - A — manter `Pessoa` como base única, criar área/listagem própria de Conselheiros e deixar `/pessoas` dedicado a Candidatos, Embaixadores, Visitantes e Inativos (**recomendado**);
   - B — manter uma única lista com filtros e prioridade visual;
   - C — separar cadastros e entidades, aceitando risco de duplicação, opção não recomendada por contrariar o modelo atual.

   Confirme a classificação de uma Pessoa que possua simultaneamente trajetória histórica e vínculo vigente de Conselheiro. Recomendação: Conselheiro vigente aparece na área de Conselheiros; a trajetória permanece consultável como histórico, sem transformar o fluxo adulto em Jornada atual.

2. **Responsáveis em campos livres**
   - A — cada registro contém relação, nome, telefone/WhatsApp e `MoraComOEmbaixador`, podendo ser incluído, editado e removido diretamente (**recomendado**);
   - B — os mesmos campos, mas remoção vira inativação;
   - C — manter histórico datado além dos novos campos.

   Confirme a migração: recomendação é copiar nome e WhatsApp da Pessoa hoje relacionada, preservar parentesco, definir `MoraComOEmbaixador` como não informado e remover a obrigatoriedade de Pessoa/DataInicio/DataFim somente depois da migração segura.

3. **Conselheiro e liderança da Embaixada**
   - A — Conselheiro é o vínculo adulto; liderança é uma função adicional e opcional, apresentada dentro do detalhe do Conselheiro com nomes e ajuda claros (**recomendado se existem funções como Conselheiro-chefe**);
   - B — eliminar o conceito separado de liderança e manter apenas a função do Conselheiro;
   - C — manter ambos sem mudança de domínio e apenas redesenhar os formulários.

   Solicite exemplos reais das funções de liderança se a opção A for escolhida; não crie catálogo presumido.

4. **Adicionar ou remover tarefas de uma versão já usada**
   - A — permitir texto e ordem livremente; permitir adicionar/remover em Postos em andamento, mas manter Postos já concluídos como fatos oficiais (**recomendado**);
   - B — permitir texto e ordem em versão usada, mas adicionar/remover tarefas somente quando a versão ainda não foi vinculada;
   - C — permitir qualquer alteração e recalcular inclusive Postos já concluídos.

   Já está decidido que identificação, texto e ordem podem ser corrigidos diretamente em versão usada, sem motivo ou histórico funcional. O Posto do Manual continua fixo. Confirme também o que fazer com uma conclusão ligada a uma tarefa removida; recomendação: removê-la junto, sem reabrir Posto já concluído.

5. **Agenda, modelo e reunião**
   - Modelos: recomendar exclusão física somente quando nunca usados; quando usados, arquivar para novos usos e preservar reuniões copiadas.
   - Atividade sem reunião/dependência: recomendar exclusão com confirmação.
   - Atividade recorrente: confirmar se a remoção afeta toda a série ou uma ocorrência específica.
   - Atividade/reunião com frequência, exceções, financeiro, acervo ou relação: recomendar impedir exclusão e orientar cancelamento, preservando histórico.
   - Reunião preparada sem frequência: confirmar se pode ser desfeita e se o item da Agenda deve permanecer.

## Entregas

- atualizar `DECISIONS.md` com data e decisões confirmadas;
- atualizar a documentação de domínio/arquitetura afetada, sem descrever código ainda inexistente como entregue;
- criar `docs/product/USABILITY-FEEDBACK-DECISIONS.md` com contexto, alternativas rejeitadas e impacto esperado;
- ajustar os prompts 13 a 18 se as respostas mudarem suas premissas;
- registrar questões que permanecerem abertas em `docs/product/OPEN-QUESTIONS.md`.

## Restrições

- Não alterar código, API, banco, migrations, contratos, telas ou testes.
- Não escolher silenciosamente uma opção.
- Não avançar para o prompt 13.
- Não registrar decisão ainda não confirmada.

## Validação obrigatória

- conferir consistência entre `DECISIONS.md`, documentação atual e roadmap;
- procurar regras conflitantes ou termos de negócio em inglês;
- executar `git diff --check`;
- revisar que o diff contém somente documentação e prompts eventualmente ajustados.

Ao final, apresente decisões registradas, pendências, arquivos alterados e o próximo prompt autorizado.
