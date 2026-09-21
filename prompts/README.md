# Guia de execução dos prompts

## Protocolo

1. Comece cada prompt com a árvore de trabalho limpa.
2. Execute um único prompt por vez.
3. Não antecipe entregas do prompt seguinte.
4. Quando faltar decisão relevante, pare e pergunte conforme `AGENTS.md`.
5. Conclua todas as validações exigidas pelo prompt.
6. Revise o diff e registre a etapa em commit próprio.
7. Só então avance para o próximo prompt.

As autorizações e decisões confirmadas pelo usuário devem ser registradas em `DECISIONS.md` antes de concluir a etapa correspondente.

## Sequência funcional existente

1. `00-bootstrap.md`
2. `01-domain-foundation.md`
3. `02-operacao-agenda.md`
4. `03-organizacao.md`
5. `04-competicoes.md`
6. `05-financeiro-historia.md`

## Sequência de evolução visual web

1. `06-design-system-shell.md`
2. `07-pessoas-jornada-ux.md`
3. `08-agenda-operacao-ux.md`
4. `09-organizacao-competicoes-ux.md`
5. `10-modulos-administrativos-ux.md`
6. `11-ux-consolidacao.md`

Essa sequência está detalhada em `plans/UX-REDESIGN-ROADMAP.md`. Ela reorganiza a experiência das funcionalidades já implementadas e não autoriza novas regras de negócio.

## Revisões posteriores

- `90-ux-review.md`: revisão de UX independente, útil após novos ciclos funcionais.
- `91-security-review.md`: revisão de segurança.
- `99-release.md`: validação e preparação de release.

## Ciclo após avaliação de uso

Executar somente depois das sequências funcional e visual existentes:

1. `12-feedback-decisoes.md`
2. `13-login-design-system.md`
3. `14-pessoas-conselheiros-responsaveis.md`
4. `15-jornada-correcoes.md`
5. `16-manuais-gestao.md`
6. `17-agenda-gestao.md`
7. `18-feedback-consolidacao.md`

O ciclo está detalhado em `plans/USABILITY-FEEDBACK-ROADMAP.md`. O prompt 12 é uma barreira obrigatória: decisões ainda abertas devem ser confirmadas e registradas antes de qualquer implementação.
