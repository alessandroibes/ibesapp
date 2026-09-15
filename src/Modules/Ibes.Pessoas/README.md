# Pessoas

Fase 1: Pessoa, Responsável, vínculo eclesiástico e foto privada. O cadastro é compartilhado pelos papéis de uma pessoa dentro da Igreja, sem criar login para meninos ou responsáveis.

Entidades neste módulo; persistência em `Ibes.Infrastructure`; casos de uso HTTP em `Ibes.Api/Features/Dominio/PessoasEndpoints.cs`. Integrações com Conselheiros e jornada são compostas na API. Permissões e isolamento são verificados independentemente dos papéis de negócio.
