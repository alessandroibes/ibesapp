# Revisão de segurança — etapa 91

Revisão executada em 17/09/2026 sobre a API ASP.NET Core, os clientes web e mobile, a persistência PostgreSQL e os fluxos de arquivos. O modelo considera contas adultas autenticadas, pessoas menores sem login, uma Igreja por tenant selecionado e dados privados por padrão.

## Fronteiras e ameaças revisadas

| Área | Controles verificados | Resultado |
| --- | --- | --- |
| Isolamento de tenant | `X-Igreja-Id` apenas seleciona; vínculo da conta autoriza; filtros globais retornam zero sem tenant; escrita cruzada é rejeitada; FKs incluem Igreja | Coberto por testes de integração e por teste automatizado de autorização de todos os endpoints `/api/v1` |
| Autorização | permissões independentes por Igreja, política explícita em cada endpoint e validação adicional de Conselheiro quando exigida | Coberto; endpoint sem política passa a falhar no teste de segurança |
| Dados de menores | menores não autenticam; dados e fotos exigem conta adulta, vínculo e permissão; respostas privadas usam `no-store` | Coberto dentro do escopo atual; retenção e exclusão seguem pendentes de decisão de produto |
| Uploads | tamanho limitado, assinatura real de PNG/JPEG/PDF, nome reduzido ao nome-base, download privado, `nosniff` e PDF como anexo | Reforçado com limite no servidor e 10 uploads por minuto por conta/IP |
| Autenticação | cookie `Secure`, `HttpOnly`, `SameSite=Lax`, expiração curta, lockout e security stamp; mobile com Authorization Code + PKCE, token curto e audiência | Coberto; certificados externos continuam obrigatórios em produção |
| Logs | sem bodies, tokens ou campos pessoais; níveis verbosos reduzidos; falha inesperada registra apenas tipo e trace id | Coberto; consultas podem chegar à telemetria da infraestrutura externa e devem ser filtradas na implantação |
| Rate limits | autenticação limitada por IP; uploads limitados por identidade autenticada, com fallback por IP | Reforçado; proxy reverso deve encaminhar IP somente por rede confiável antes de usar esse dado operacionalmente |
| CSRF, XSS e SQLi | antiforgery em mutações web, bearer fora do modelo CSRF, React escapa texto, CSP bloqueia script externo/inline, EF Core parametriza consultas e não há SQL bruto | Coberto por teste de CSRF, CSP e inspeção do acesso a dados |
| Segredos | somente exemplos de ambiente versionados; senhas e certificados vêm do ambiente; nenhum material de chave privada rastreado | Coberto no repositório; rotação e cofre dependem do ambiente de produção |
| Auditoria | alterações sensíveis registram ator, Igreja, ação, entidade, chave e trace, sem copiar PII; históricos críticos são imutáveis | Coberto. Financeiro e acervo permanecem sem auditoria funcional conforme decisão explícita do produto |

## Correções aplicadas

- A especificação OpenAPI anônima passou a existir apenas em `Development` e `Testing`, reduzindo exposição de metadados em produção.
- Uploads de foto e anexos receberam limite de corpo no servidor e política própria de rate limit. A autenticação agora ocorre antes do rate limiter para permitir partição por conta.
- Todas as respostas receberam `Permissions-Policy`, `Cross-Origin-Opener-Policy` e `Cross-Origin-Resource-Policy`, além dos controles já existentes de CSP, MIME sniffing, referrer e cache.
- Testes de regressão verificam políticas explícitas de autorização, CSRF, headers, metadados dos limites e rejeição de arquivo cujo MIME declarado não corresponde a um formato permitido.

## Riscos e limites remanescentes

- Política de retenção, anonimização e exclusão de dados pessoais ainda depende de decisão documentada; nenhuma regra foi inventada nesta etapa.
- Backup, restauração, certificados persistentes, cofre/rotação de segredos e configuração de proxy confiável são controles do ambiente e precisam de ensaio antes da produção.
- A cadeia Expo Router mantém os alertas moderados já registrados em `DEPENDENCIES-BOOTSTRAP.md`; uma atualização forçada incompatível não foi aplicada.
- Os anexos ficam no PostgreSQL. Os limites atuais reduzem abuso por requisição e frequência, mas crescimento de armazenamento exige quota por tenant e política de retenção quando esses requisitos forem definidos.
- A exceção de auditoria funcional para financeiro e acervo é uma decisão de produto. Logs técnicos e trilhas do provedor de banco devem ser tratados no plano operacional caso haja exigência futura de investigação forense.

## Evidências de validação

As validações desta etapa abrangem build e testes .NET, testes e build web/mobile, lint, tipos, formatação, auditoria de dependências, migrations sem pendência, modelo EF sem alteração e comparação do OpenAPI gerado. Os comandos e resultados finais são registrados no resumo da execução do prompt.
