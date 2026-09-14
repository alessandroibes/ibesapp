# ER — Starter completo para Codex

Fundação executável da **Fase 0** disponível. As demais fases não foram implementadas.

```powershell
./scripts/dev-setup.ps1
dotnet dev-certs https --trust
docker compose up --build -d
```

Acesse `https://localhost:7443`. Conta fictícia: `adulto@example.test`; senha em `BOOTSTRAP_PASSWORD` no `.env` gerado.

Consulte [execução local e validações](docs/operations/LOCAL-DEVELOPMENT.md), [arquitetura do bootstrap](docs/architecture/BOOTSTRAP.md) e [resultado das validações](docs/quality/BOOTSTRAP-VALIDATION.md).

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
