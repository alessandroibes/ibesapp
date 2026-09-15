# Fundação executável — Fase 0

Registro da entrega original do bootstrap. O estado atual das Fases 1 e 2, incluindo a extração da persistência para `Ibes.Infrastructure`, está em [Domínio](DOMAIN-FOUNDATION.md).

Decisões confirmadas pelo usuário em 14/09/2026: Igreja é tenant; uma Embaixada por Igreja; conta adulta global com vínculos/permissões por Igreja; BFF web; Authorization Code + PKCE mobile; GitHub Actions.

## Organização do código

- `Ibes.Api`: composição ASP.NET Core, BFF no mesmo processo, login Razor Pages e vertical slices HTTP em `Features/`.
- `Ibes.Foundation`: infraestrutura inicial de Identidade, Organizações e Auditoria, com schemas separados no PostgreSQL. Identity/OpenIddict possuem armazenamento global de autenticação; registros de Igreja, Embaixada, vínculos e auditoria são filtrados por tenant.
- `src/Modules/`: assemblies reservados para os demais módulos documentados. Estão vazios intencionalmente; nenhuma funcionalidade de Fase 1 ou posterior foi implementada.
- `apps/web`: React/TypeScript/Vite, tokens de design próprios e componente Button no padrão shadcn/ui, usando Radix, Tailwind e CVA.
- `apps/mobile`: Expo/Router, navegador do sistema para autenticação e SecureStore para sessão.
- `packages/contracts/api.d.ts`: tipos gerados do OpenAPI; não editar manualmente.

A fundação compartilha um DbContext para garantir atomicidade de alteração e auditoria. Os futuros módulos terão fronteiras próprias e integração explícita; não devem consultar tabelas alheias diretamente. A infraestrutura de identidade não modela cargos ou postos do produto.

## Autenticação e autorização

Web e API são servidos pela mesma origem. O BFF está no próprio host: ASP.NET Core Identity autentica o adulto e mantém a sessão em cookie protegido por Data Protection, Secure, HttpOnly e SameSite=Lax. Por ser co-hospedado, não há uma chamada HTTP interna nem necessidade de emitir tokens OAuth para o web. O JavaScript não recebe access/refresh tokens. Logout é POST com antiforgery; login Razor Pages também exige antiforgery. O cookie expira em 30 minutos com renovação por atividade.

O cliente mobile público `ibes-mobile` usa Authorization Code + PKCE, callback exato `ibes://oauth/callback`, escopos `openid fundacao` e audiência `ibes-api`. Código é de uso único. Access token dura 10 minutos, sem refresh token nesta fundação. O aplicativo remove sua sessão local ao sair; isso não encerra a sessão do navegador do sistema. Chaves OAuth de desenvolvimento são efêmeras, portanto reiniciar a API invalida tokens mobile. Produção exige certificados de assinatura e criptografia externos.

Os endpoints de contexto e auditoria exigem autenticação, `X-Igreja-Id`, vínculo atual e permissão granular. Header não concede acesso. A consulta `/bff/sessao` atravessa tenants apenas para listar vínculos do adulto autenticado. Alterações de vínculo/permissão têm efeito na próxima requisição. Security stamp é revalidado para cookie e bearer; bearer também valida escopo/audiência.

Não há registro público, login de meninos, contas de responsáveis, convites ou recuperação de conta. Não foi criado tenant real: falta identificar a Igreja da Embaixada J. J. Taylor. O seed explicitamente habilitado em Development cria apenas uma Igreja/Embaixada fictícia e um adulto fictício.

## Persistência e isolamento

`IgrejaId` é a chave do tenant. Igreja e Embaixada possuem PK compartilhada, e o bootstrap cria ambas na mesma transação. Isso garante uma Embaixada no provisionamento e impede duplicação no banco. A futura operação de provisionamento deve preservar o par.

Filtros globais retornam zero registros sem tenant. `SaveChanges`/`SaveChangesAsync` rejeitam escrita cruzada ou sem contexto. Auditoria é gravada na mesma transação, contém tipo de entidade, ação, ator, Igreja, horário UTC e trace id; não copia campos pessoais nem senhas. A auditoria não pode ser editada/excluída via DbContext.

`IgnoreQueryFilters` fica restrito à resolução de vínculos do usuário autenticado e à listagem das próprias Igrejas. Não usar SQL bruto, `ExecuteUpdate`/`ExecuteDelete` nem bypass de filtros para alterações normais: esses caminhos contornam os guards/auditoria. Não há cache, jobs ou uploads nesta fase; quando criados deverão receber IgrejaId explicitamente e seguir o mesmo isolamento.

Migração inicial versionada; aplicar com comando separado `--migrate`. O host normal não migra no startup. O Compose executa o migrador antes da API. UUIDs e horários técnicos UTC seguem o modelo documentado.

## Observabilidade e segurança

Logs JSON sem bodies de requisição, tokens ou campos pessoais. Logs verbosos de ASP.NET Core/OpenIddict/EF desabilitados. Trace id em ProblemDetails e `X-Trace-Id`. OpenTelemetry instrumenta métricas HTTP e tracing; autenticação é excluída do tracing para evitar códigos em URLs. Exportador OTLP é ativado por `OTEL_EXPORTER_OTLP_ENDPOINT`.

`/health/live` verifica processo; `/health/ready` verifica PostgreSQL e migrações pendentes. CSP, ausência de cache nas respostas de sessão/dados, TLS obrigatório, lockout do Identity e rate limit de autenticação fazem parte da fundação. Configurações locais não são uma configuração de produção: definir hosts, certificados, proteção persistente das chaves, terminação TLS/proxies confiáveis, backups e segredos no ambiente de implantação.

Referências técnicas consultadas: [integração ASP.NET Core do OpenIddict](https://documentation.openiddict.com/integrations/aspnet-core), [PKCE](https://documentation.openiddict.com/configuration/proof-key-for-code-exchange), [Expo SDK 55](https://docs.expo.dev/versions/v55.0.0/) e [Vite](https://vite.dev/guide/).
