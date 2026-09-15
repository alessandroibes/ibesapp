# ER — Starter completo para Codex

Fundação executável e **Fases 1 e 2** disponíveis: Pessoas, Igreja/Embaixada, Conselheiros, responsáveis, vínculos e jornada ER com manuais versionados e progressão histórica. O escopo implementado termina no prompt `01-domain-foundation.md`.

```powershell
./scripts/dev-setup.ps1
dotnet dev-certs https --trust
docker compose up --build -d
```

Acesse `https://localhost:7443`. Conta fictícia: `adulto@example.test`; senha em `BOOTSTRAP_PASSWORD` no `.env` gerado.

Consulte [execução local e validações](docs/operations/LOCAL-DEVELOPMENT.md), [arquitetura do bootstrap](docs/architecture/BOOTSTRAP.md) e [resultado das validações](docs/quality/BOOTSTRAP-VALIDATION.md).

Para as Fases 1 e 2, consulte [funcionalidades e decisões técnicas](docs/architecture/DOMAIN-FOUNDATION.md) e [validações do domínio](docs/quality/DOMAIN-FOUNDATION-VALIDATION.md). O ambiente de demonstração não cria edições de manuais: informe a identificação real da edição na seção **Manuais** antes de registrar uma admissão.

Fonte de verdade consolidada para o sistema de gestão da Organização Embaixadores do Rei.

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
