# Prompt 13 — Login alinhado ao design system

## Pré-condição

Execute somente depois do prompt 12 estar concluído, validado e registrado em commit próprio.

## Leitura obrigatória

Leia integralmente `AGENTS.md`, `DECISIONS.md`, `README.md`, `docs/ux/`, `docs/security/SECURITY-BASELINE.md`, `docs/architecture/BOOTSTRAP.md`, `docs/quality/DEFINITION-OF-DONE.md` e `plans/USABILITY-FEEDBACK-ROADMAP.md`.

Revise os tokens/componentes do web, a página Razor `Entrar`, seu CSS, autenticação, CSP, antiforgery, rate limit e testes.

## Objetivo

Executar somente a Etapa 13: aproximar visualmente a tela de login do design system e do shell autenticado, mantendo intacto o protocolo de autenticação.

## Escopo obrigatório

- Recriar a composição visual do login com os mesmos tokens de cor, tipografia, raio, sombra, espaçamento e foco do sistema.
- Usar uma superfície de acesso clara, responsiva e adequada a 320–1440 px.
- Manter identidade provisória e textos em português; não inventar logotipo, brasão ou identidade oficial.
- Manter rótulos persistentes, autocomplete correto, foco visível, mensagens acessíveis e envio em estado claro.
- Evitar duplicação frágil de valores entre CSS Razor e tokens do web; documentar a estratégia possível dentro da arquitetura atual.
- Preservar mensagem neutra contra enumeração de contas.
- Adicionar testes de renderização, antiforgery, retorno local seguro, headers e acessibilidade.

## Restrições

- Não alterar Identity, OpenIddict, cookie, duração de sessão, lockout, rate limit ou recuperação de senha.
- Não transformar o login em React nem entregar tokens ao JavaScript.
- Não adicionar cadastro público, “lembrar-me”, login social ou recuperação de conta.
- Não avançar para Pessoas, Jornada, Manuais ou Agenda.

## Critérios de aceite

- Login parece parte do mesmo produto antes e depois da autenticação.
- Fluxo funciona por teclado e leitor de tela, sem rolagem horizontal.
- Erro não revela existência da conta.
- `ReturnUrl` continua restrito a destino local.
- CSP permanece sem `unsafe-inline` e nenhum segredo aparece no HTML/log.

## Validação obrigatória

- testes .NET de login, antiforgery, enumeração, retorno e rate limit;
- E2E de login válido, inválido, logout e navegação por teclado;
- Axe e contraste da página;
- build/testes .NET e web; typecheck/lint/formatação web;
- auditoria de dependências e `git diff --check`;
- registrar evidências em `docs/quality/LOGIN-DESIGN-VALIDATION.md`.

Ao final, apresente entregas, decisões técnicas, problemas, riscos, resultados e comandos locais.

