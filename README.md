# ER — Starter completo para Codex

Fundação executável, **Fases 1 a 6** e ciclo de evolução visual web disponíveis: cadastros, jornada ER, operação semanal, organização interna, competições, financeiro simples e acervo histórico em uma experiência responsiva e acessível. O escopo implementado termina no prompt `11-ux-consolidacao.md`.

```powershell
./scripts/dev-setup.ps1
dotnet dev-certs https --trust
docker compose up --build -d
```

Acesse `https://localhost:7443`. Conta fictícia: `adulto@example.test`; senha em `BOOTSTRAP_PASSWORD` no `.env` gerado.

Consulte [execução local e validações](docs/operations/LOCAL-DEVELOPMENT.md), [arquitetura do bootstrap](docs/architecture/BOOTSTRAP.md) e [resultado das validações](docs/quality/BOOTSTRAP-VALIDATION.md).

Para as Fases 1 e 2, consulte [funcionalidades e decisões técnicas](docs/architecture/DOMAIN-FOUNDATION.md) e [validações do domínio](docs/quality/DOMAIN-FOUNDATION-VALIDATION.md). O ambiente de demonstração não cria edições de manuais: informe a identificação real da edição na seção **Manuais** antes de registrar uma admissão.

Fonte de verdade consolidada para o sistema de gestão da Organização Embaixadores do Rei.

Na Fase 3, use **Agenda e reuniões** no web para cadastrar tipos/promotoras, atividades e modelos; prepare uma ocorrência como reunião para abrir a chamada no web ou mobile. Consulte [operação e agenda](docs/architecture/OPERACAO-AGENDA.md) e [validações](docs/quality/OPERACAO-AGENDA-VALIDATION.md).

Na Fase 6, use **Financeiro** para controlar entradas e saídas gerais ou por evento/iniciativa e **Acervo histórico** para manter a linha do tempo, fotos e documentos da Embaixada. Consulte [financeiro e acervo](docs/architecture/FINANCEIRO-E-ACERVO-HISTORICO.md) e [validações](docs/quality/FINANCEIRO-ACERVO-VALIDATION.md).

## Evolução visual web

A reorganização visual das funcionalidades existentes está planejada em [UX-REDESIGN-ROADMAP.md](plans/UX-REDESIGN-ROADMAP.md). Execute os prompts abaixo em ordem e registre cada etapa em commit próprio:

1. `prompts/06-design-system-shell.md`;
2. `prompts/07-pessoas-jornada-ux.md`;
3. `prompts/08-agenda-operacao-ux.md`;
4. `prompts/09-organizacao-competicoes-ux.md`;
5. `prompts/10-modulos-administrativos-ux.md`;
6. `prompts/11-ux-consolidacao.md`.

As etapas foram concluídas e reorganizam rotas, componentes e apresentação sem criar regras de negócio. Consulte o [mapa de telas](docs/ux/SCREEN-MAP.md), o [sistema de UX](docs/ux/UX-SYSTEM.md) e a [validação final](docs/quality/UX-REDESIGN-VALIDATION.md). Dashboard, Relatórios, identidade visual oficial e reformulação do aplicativo React Native permanecem fora desse ciclo até que seus requisitos sejam definidos.

## Produto inicial
Sistema multi-organização para gestão de Embaixadas de Embaixadores do Rei, começando pela Embaixada James Jackson Taylor (Embaixada J. J. Taylor).

## Stack decidida
- Backend: .NET 10, ASP.NET Core, monólito modular, vertical slices
- Banco: PostgreSQL
- Web: React + TypeScript + Vite + Tailwind CSS + shadcn/ui, com design system próprio
- Mobile: React Native + Expo + Expo Router
- Identidade: ASP.NET Core Identity + OpenIddict
- Infra: containers + PostgreSQL gerenciado, independente de provedor
- Arquitetura: multi-tenant desde o início

Leia primeiro `AGENTS.md`, depois `DECISIONS.md`, `docs/domain/` e `plans/IMPLEMENTATION-ROADMAP.md`.

## Regra fundamental
A linguagem ubíqua do negócio é português brasileiro. Não traduza conceitos de Embaixadores do Rei para inglês.
