# Prompt 14 — Pessoas, Conselheiros e responsáveis

## Pré-condição

Execute somente depois dos prompts 12 e 13 estarem concluídos, validados e registrados em commits próprios. Use exatamente as decisões confirmadas na Etapa 12.

## Leitura obrigatória

Leia integralmente `AGENTS.md`, `DECISIONS.md`, `README.md`, `docs/domain/`, `docs/architecture/DOMAIN-FOUNDATION.md`, `docs/architecture/PERMISSIONS.md`, `docs/ux/`, `docs/security/`, as migrations e validações atuais de Pessoas/Embaixada, e `plans/USABILITY-FEEDBACK-ROADMAP.md`.

Analise web, mobile, endpoints, OpenAPI, entidades, FKs, filtros e testes antes de editar.

## Objetivo

Executar somente a Etapa 14: separar a experiência de Conselheiros da experiência de meninos e simplificar o cadastro de pais/responsáveis, sem duplicar a entidade Pessoa.

## Escopo obrigatório

- Implementar as categorias confirmadas para Conselheiros, Embaixadores, Candidatos, Visitantes e Inativos.
- Manter `Pessoa` como base compartilhada e aplicar precedência/classificação exatamente como decidida.
- Criar listagem/rota própria de Conselheiros se essa for a decisão, com visualizar, cadastrar vínculo, editar dados aplicáveis e encerrar vínculo.
- Garantir que `/pessoas` represente o público confirmado e que filtros, contagens, estados vazios e URLs não misturem fluxos incompatíveis.
- Exibir Jornada somente para quem possui trajetória ER; não mostrar Jornada, vínculos próprios do menino ou ações de progressão a Conselheiro/Visitante sem trajetória aplicável.
- Manter inativos fora de listas operacionais por padrão e permitir consulta histórica.
- Substituir responsáveis pelo modelo confirmado de campos livres: relação, nome, telefone/WhatsApp e informação de moradia, com edição/remoção direta conforme a decisão confirmada.
- Migrar dados existentes sem perder nome, contato ou parentesco e sem cruzar tenant.
- Reorganizar Igreja e Embaixada para explicar, em linguagem direta, a diferença entre cadastro/vínculo de Conselheiro e liderança adicional, ou remover essa distinção se assim decidido.
- Usar páginas para cadastros extensos e diálogos para ações curtas.
- Atualizar mobile apenas no necessário para o novo contrato e para não apresentar Jornada indevida.

## Restrições

- Não criar entidades separadas que dupliquem Pessoa.
- Não criar login para meninos ou responsáveis.
- Não inventar funções de liderança.
- Não transformar categoria de tela em permissão, Cargo ou Posto.
- Não implementar relatórios ou aniversariantes.
- Não avançar para correções da Jornada, Manuais ou Agenda.

## Critérios de aceite

- Um Conselheiro vigente é localizado em seu fluxo próprio e não aparece como Visitante por ausência de Jornada.
- Candidatos e Embaixadores continuam derivados da Jornada e idade/data-base.
- Inativos ficam fora das operações futuras por padrão.
- Responsável pode ser informado sem cadastrar outra Pessoa e sem data de início.
- Migração é segura para base vazia e base com responsáveis existentes.
- Toda listagem e mutação respeita tenant, permissão, concorrência e dados de menores.

## Validação obrigatória

- testes de domínio/API para classificação, precedência, responsáveis, migração, permissão e tenant;
- testes web de filtros, rotas, formulários, estados e permissões;
- E2E de Candidato/Embaixador/Visitante/Conselheiro/Inativo e responsável;
- Axe, teclado e responsividade das telas alteradas;
- build, lint, typecheck, formatação e testes web/mobile/.NET;
- migration em banco vazio e cópia de banco anterior com dados representativos;
- OpenAPI regenerado e comparado;
- auditorias de dependência e `git diff --check`;
- documentação em `docs/quality/PESSOAS-CONSELHEIROS-VALIDATION.md`.

Ao final, apresente funcionalidades, decisões técnicas, migração, riscos, resultados e comandos locais.
