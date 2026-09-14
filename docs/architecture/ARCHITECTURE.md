# Arquitetura

Monólito modular em .NET com módulos independentes e integração explícita. Evitar microserviços prematuros.

Módulos iniciais:
Identidade, Organizações, Pessoas, Embaixadas, Progressão, ConsuladosDiretoria, Frequência, AgendaAtividades, Competições, Financeiro, AcervoHistorico, Auditoria.

API REST/OpenAPI. Web e Mobile consomem contratos versionados.
Multi-tenancy obrigatório em persistência, autorização, cache, jobs e arquivos.
