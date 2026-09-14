# Modelo de dados — visão inicial

Entidades/tabelas sugeridas (nomes de negócio em português sem acentos no banco):
`organizacoes`, `igrejas`, `embaixadas`, `pessoas`, `enderecos`, `responsaveis_pessoa`, `vinculos_igreja`,
`candidatos`, `embaixadores`, `conselheiros`, `requisitos_minimos`, `conclusoes_requisitos`,
`postos`, `manuais`, `versoes_manuais`, `tarefas_manual`, `jornadas_posto`, `conclusoes_tarefas`,
`consulados`, `membros_consulado`, `liderancas_consulado`,
`cargos_embaixada`, `diretorias`, `ocupacoes_cargo`,
`reunioes`, `frequencias`, `visitantes`,
`entidades_promotoras`, `tipos_atividade`, `atividades_agenda`, `recorrencias`, `modelos_reuniao`, `itens_modelo_reuniao`,
`modalidades`, `provas`, `aptidoes_prova`, `competicoes`, `provas_competicao`, `representacoes_prova`,
`contas_financeiras`, `categorias_financeiras`, `lancamentos_financeiros`,
`marcos_historicos`, `anexos`, `usuarios`, `papeis`, `permissoes`, `auditoria`.

Usar UUID/Guid, timestamps UTC técnicos e datas de negócio apropriadas (`date`) quando horário não tiver significado.
