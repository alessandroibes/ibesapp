# Contrato HTTP v1

`api.d.ts` é gerado por openapi-typescript a partir de `/openapi/v1.json` e consumido por web/mobile. O workflow compara o arquivo gerado com o versionado. Veja `docs/operations/LOCAL-DEVELOPMENT.md` para regeneração.

Sessão web: cookie HttpOnly e antiforgery no logout. Mobile: bearer emitido pelo OpenIddict com PKCE. Contexto e auditoria exigem o header `X-Igreja-Id` além de vínculo e permissão atuais. O protocolo OAuth é descrito no discovery OpenID Connect, não duplicado neste contrato de recursos.
