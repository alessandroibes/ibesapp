# Prompt 18 — Consolidação das melhorias orientadas pelo uso

## Pré-condição

Execute somente depois dos prompts 12 a 17 estarem concluídos, validados e registrados em commits próprios.

## Leitura obrigatória

Leia integralmente `AGENTS.md`, `DECISIONS.md`, `README.md`, `docs/`, os roadmaps em `plans/`, as validações das etapas 13 a 17 e o diff acumulado do ciclo.

## Objetivo

Executar somente a Etapa 18: consolidar e revisar as melhorias entregues neste ciclo, sem adicionar novas funcionalidades.

## Escopo obrigatório

- Revisar login, Pessoas, Conselheiros, responsáveis, Igreja/Embaixada, Jornada, Manuais e Agenda como fluxo contínuo.
- Confirmar que não restaram botões, formulários, contratos, DTOs, estilos ou rotas obsoletos do comportamento substituído.
- Confirmar linguagem clara para Conselheiro, Jornada, Manual, versão, modelo, reunião, cancelamento e exclusão, sem referências residuais à liderança separada removida.
- Verificar que ações semelhantes usam os mesmos componentes e padrões de confirmação.
- Revisar navegação direta, voltar/avançar, recarga, foco, loading, vazio, erro, conflito e sucesso.
- Revisar responsividade de 320 a 1440 px e acessibilidade WCAG 2.2 AA.
- Executar revisão de segurança focada em dados de menores, responsáveis livres, correções diretas, uploads, exclusões, CSRF, XSS, SQLi, logs e tenant; confirmar auditoria funcional somente nos acontecimentos que a regra de negócio exige preservar.
- Atualizar documentação final e remover afirmações que não correspondam mais ao sistema.

## Restrições

- Não criar Dashboard, relatórios, aniversariantes, novas regras de progressão ou identidade visual oficial.
- Não aproveitar a revisão para ampliar escopo.
- Se surgir nova decisão de negócio, registrar como questão aberta e parar a parte dependente.

## Critérios de aceite

- Todos os pedidos originais do ciclo têm evidência de entrega ou limitação explicitamente aceita.
- Não existe mistura operacional entre Conselheiros e meninos.
- Não restam entidade, endpoint, contrato, rota ou formulário público do conceito separado de liderança da Embaixada.
- Jornada aparece somente onde se aplica.
- Históricos e referências continuam íntegros após correções e remoções permitidas.
- Contratos web/mobile e documentação representam o comportamento final.

## Validação obrigatória

- build Release e todos os testes .NET;
- format check, lint, typecheck, testes e build web/mobile;
- suíte E2E integral e Axe nas telas alteradas;
- migrations desde banco vazio e upgrade desde snapshot anterior representativo;
- modelo EF sem alteração pendente e OpenAPI sem divergência;
- auditoria NuGet/npm nos níveis definidos pela CI;
- inspeção de segredos e logs sem PII;
- `git diff --check` e revisão final de escopo;
- registrar matriz de requisitos, resultados e limitações em `docs/quality/USABILITY-FEEDBACK-VALIDATION.md`.

Ao final, apresente funcionalidades consolidadas, decisões técnicas, migrations, contratos, problemas, riscos, resultados completos e comandos locais.
