# Validação de Pessoas, Conselheiros e responsáveis

Validação da Etapa 14 executada em 21/09/2026.

## Escopo entregue

- `/pessoas` concentra Candidatos, Embaixadores, Visitantes e Inativos. Um vínculo vigente de Conselheiro tem precedência e impede que a Pessoa seja classificada como Visitante.
- `/conselheiros` e `/conselheiros/{id}` oferecem listagem própria, cadastro do vínculo adulto, detalhe, edição dos dados pessoais aplicáveis e encerramento do vínculo.
- A eventual trajetória ER de um Conselheiro permanece consultável como histórico; não apresenta frequência, vínculos do menino nem ações de progressão adulta.
- Um Visitante sem Jornada não recebe aba Jornada. A ação explícita para registrá-lo como Candidato preserva o fluxo existente e só então torna a Jornada aplicável.
- Responsáveis agora são registros livres com relação, nome, telefone/WhatsApp e moradia opcional; podem ser incluídos, corrigidos ou removidos diretamente.
- A tela institucional não possui mais operações de Conselheiros ou liderança separada. Não há entidade, rota, contrato ou formulário público de liderança da Embaixada.
- O mobile passou a consumir o novo contrato de responsáveis e só consulta/apresenta Jornada quando ela existe.

## Decisões técnicas

- `Pessoa` continua sendo a base compartilhada. A separação ocorre por consulta, rota e apresentação, sem duplicação de dados.
- A API determina a precedência de Conselheiro pelo vínculo vigente na data atual e mantém o filtro de Inativos para consulta histórica.
- A migração copia `Nome` e `WhatsApp` da Pessoa antes de remover a antiga referência e as datas de vigência do responsável. `MoraComOEmbaixador` inicia como não informado.
- A migração usa comandos condicionais do PostgreSQL para também completar com segurança uma base local que já tenha recebido a versão inicial desta etapa durante o desenvolvimento.
- O vínculo de Conselheiro não possui função ou papel neste ciclo. A autorização continua dependente das permissões do vínculo da Igreja, nunca do cadastro de Conselheiro.

## Resultados

| Validação | Resultado |
| --- | --- |
| Build .NET Release | aprovado, sem avisos ou erros |
| Testes .NET | 94 aprovados; inclui tenant, permissões, classificação, responsáveis e migração de dados legados |
| Migração vazia e legada | aprovada pelo teste de migração com PostgreSQL temporário |
| Modelo EF | sem mudanças pendentes desde a migration |
| Docker Compose, migration e readiness | aprovados; API pronta em `https://localhost:7443` |
| Contrato OpenAPI | regenerado e idêntico a `packages/contracts/api.d.ts` |
| Web Vitest | 10 arquivos, 28 testes aprovados |
| Mobile Jest | 6 suítes, 9 testes aprovados |
| Playwright | 8 jornadas aprovadas, incluindo Conselheiro, Visitante, Inativo e responsável |
| Axe WCAG 2.2 AA e teclado | aprovados nas telas de Conselheiros e Pessoas verificadas pelo E2E |
| Responsividade | listas de Conselheiros e Pessoas sem rolagem horizontal em 320 px |
| Auditoria de dependências | web sem vulnerabilidades; mobile possui 4 vulnerabilidades moderadas transitivas do Expo Router, sem atualização não disruptiva disponível |

## Limitações e riscos

- Papéis entre Conselheiros, frequência de Conselheiros e qualquer forma de liderança adulta continuam fora do escopo e exigem nova decisão antes de implementação.
- O bundle principal web permanece acima de 500 kB compactado; o Vite emite aviso de divisão de código, sem impacto funcional nesta etapa.
- A atualização sugerida pelo `npm audit` do mobile exigiria mudança incompatível do Expo Router; não foi aplicada fora do escopo.

## Comandos principais

```powershell
docker compose up -d --build

dotnet build Ibes.slnx --no-restore -c Release
dotnet test Ibes.slnx --no-restore

cd apps/web
npm run lint
npm run typecheck
npm test
npm run build
npx playwright test --workers=1

cd ../mobile
npm run lint
npm run typecheck
npm test
```
