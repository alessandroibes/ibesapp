# Domínio — Fases 1 e 2

Implementação original de `prompts/01-domain-foundation.md`. Regras consolidadas em `DECISIONS.md`, incluindo as confirmações sobre os 18 anos, Emérito e versão vinculada por Posto.

As decisões de 21/09/2026 alteram comportamentos que esta entrega original ainda não implementa. Até a execução dos prompts 14 a 17, continuam existindo no código o vínculo datado de responsável, a liderança separada, a imutabilidade de versões/tarefas e as restrições atuais da Agenda. O comportamento alvo está documentado em `docs/product/USABILITY-FEEDBACK-DECISIONS.md` e não deve ser tratado como já entregue.

## Funcionalidades

- Cadastro institucional de Igreja e sua única Embaixada, nomes, endereços, Pastor, fundação e história.
- Pessoas com contatos, nascimento, naturalidade, batismo, carteira, Bíblia, observações e foto privada; consulta paginada por nome.
- Responsáveis extensíveis com parentesco e histórico no modelo original; sua substituição por registros livres foi aprovada para a Etapa 14.
- Conselheiros adultos vinculados a uma pessoa e, opcionalmente, à conta adulta da Igreja; o modelo original de liderança separada será removido na Etapa 14. Cargo não concede permissão.
- Candidatura, cinco Requisitos Mínimos com datas, admissão explícita, Postos, conclusões de tarefas em qualquer ordem e progressão oficial.
- Manuais com edição explicitamente informada e tarefas em dados. O catálogo auxiliar contém somente os nomes documentados; nenhum seed presume edição. Versões e tarefas são imutáveis na implementação original; a edição direta aprovada será implementada nas Etapas 15 e 16.
- Cerimônias/certificados têm registros independentes e não bloqueiam ingresso no próximo Posto.

Web oferece os cadastros e operações acima. Mobile oferece busca paginada, consulta da ficha/responsáveis/jornada e conclusões datadas de requisitos e tarefas; a gestão institucional, dos manuais e a admissão/conclusão oficial ficam disponíveis no web e na API.

## Datas e histórico

Datas de negócio usam `DateOnly`; lançamento/auditoria usa UTC. `Calendario:FusoHorario` define o calendário da validação (padrão `America/Sao_Paulo`). A consulta da jornada aceita `dataBase`, calculando condição e faixa etária sem persistir dados derivados. O histórico retornado inclui todos os fatos, com suas próprias datas.

Cada fato de progressão deve ocorrer entre o aniversário de 9 anos e a véspera dos 18, sem datas futuras. Pessoas hoje adultas podem ter a trajetória histórica cadastrada. A condição atual muda ao completar 18 anos; nada é apagado. Cerimônias posteriores aos 18 são permitidas.

Admissão antes dos 14 fixa 12 meses por Posto; a partir dos 14 fixa 6. A permanência é contada em meses de calendário desde o ingresso em cada Posto e não muda com aniversários posteriores. A conclusão exige todas as tarefas daquela versão concluídas até a data e permanência cumprida. Conclusão oficial e ingresso seguinte são atômicos e têm a mesma data. Sênior leva ao Emérito sem manual; suas tarefas/conclusão aguardam definição.

A data de nascimento de pessoa com jornada não é editável neste fluxo para não invalidar fatos históricos. A correção direta das datas de conclusão e das versões foi decidida depois desta entrega e pertence às Etapas 15 e 16; migração de uma Jornada entre versões continua fora do escopo. Para Conselheiros, uma alteração no nascimento deve preservar a idade adulta nos vínculos existentes.

## Persistência, segurança e contrato

Entidades e regras ficam nos módulos Pessoas, Embaixadas e Progressão. `Ibes.Infrastructure` reúne o DbContext e as migrações, evitando dependência circular entre módulos e persistência; o namespace original do DbContext foi preservado para compatibilidade. A migração inicial mantém seu identificador. `PessoasEJornada` acrescenta schemas/tabelas e campos sem remover os dados da fundação.

Entidades de domínio usam chave composta IgrejaId/Id e FKs compostas, filtro obrigatório do tenant e proteção de escrita. Sessão autenticada, vínculo e permissão são verificados em cada requisição; `X-Igreja-Id` não concede acesso. Permissões novas: `pessoas.consultar`, `pessoas.editar`, `embaixada.consultar`, `embaixada.editar`, `progressao.consultar`, `progressao.registrar` e `manuais.gerenciar`. Registros de progressão exigem também conta vinculada a Conselheiro atualmente ativo.

Tokens de versão GUID implementam concorrência otimista. Alterações de filhos atualizam a versão do agregado; conflitos/duplicações retornam 409, impedindo conclusões repetidas. Auditoria guarda Igreja, conta, chave, ação e instante, sem copiar dados pessoais. Na implementação original, registros de conclusão e versões de Manual não aceitam edição/exclusão pelo DbContext. As proteções deverão ser ajustadas nas Etapas 15 e 16 para permitir somente as correções aprovadas, preservando Postos concluídos.

Fotos são armazenadas privadamente no PostgreSQL, limitadas a 2 MB, com assinatura PNG/JPEG e MIME correspondente; não há URL pública. Leitura exige sessão/permissão/tenant e `no-store`. Conteúdo não é registrado em logs. Upload e demais mutações web exigem antiforgery; mobile usa bearer validado.

OpenAPI descreve DTOs em português e o cabeçalho da Igreja. Tipos compartilhados ficam em `packages/contracts/api.d.ts`. Forms têm validação no servidor, mensagens em português, estados de carregamento/vazio/erro, foco e rótulos acessíveis.

## Limite de escopo

Primeira reunião e frequência aguardam a Fase 3 e não são duplicadas na ficha. Agenda, Consulados, Diretoria, competições, provas e financeiro permanecem fora desta entrega. Lideranças institucionais de Conselheiros pertencem ao cadastro da Embaixada, sem implementar Diretoria de ER.

O bootstrap explicitamente habilitado de desenvolvimento acrescenta somente um Conselheiro adulto fictício à conta de demonstração, com permissões para exercitar os fluxos. Não provisiona dados reais ou login de meninos/responsáveis.
