# Dependências — bootstrap

Verificação de 14/09/2026. Pacotes npm e NuGet possuem lockfiles versionados. Restore NuGet trata alertas como erro; CI web bloqueia vulnerabilidades moderadas ou superiores. CI mobile bloqueia altas/críticas e mantém alertas moderados visíveis.

Correções aplicadas durante a fundação:

- OpenTelemetry atualizado para 1.18; Microsoft.OpenApi fixado em 2.7.5, compatível com ASP.NET Core 10.
- Vitest atualizado para 4.1.11.
- Testcontainers atualizado e SSH.NET fixado em 2026.0.0 para remover vulnerabilidade transitiva.
- Override restrito a `xcode -> uuid` em 11.1.1, com API CommonJS compatível; Expo Doctor e exportação Android/iOS verificam a integração.

Pendência: npm mobile reporta oito entradas moderadas, propagadas pela cadeia Expo Router / React Navigation / query-string / decode-uri-component. O advisory de origem é [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr), sobre consumo excessivo de CPU ao decodificar entrada malformada. A correção de decode-uri-component está em uma versão ESM incompatível com o consumidor CommonJS atual. `npm audit fix --force` sugere downgrades incompatíveis do Expo/Router; não foi aplicado.

Essa pendência não está resolvida e deve ser revisitada antes de distribuição do aplicativo. Não é uma autorização de release nem deve ser ocultada por desabilitar a auditoria. Builds nativos em dispositivos e hardening de release pertencem às validações seguintes, não foram declarados como concluídos pelo bootstrap.
