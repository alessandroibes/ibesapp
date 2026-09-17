import { useState } from "react";
import { Check, Circle, GraduationCap } from "lucide-react";
import type { components } from "../../../../packages/contracts/api";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  Toolbar,
} from "../components/ui";
import { type Api, dataBr, hoje, useConsulta } from "./api";
import { Estado, Formulario, type Campo } from "./componentes";

type JornadaResponse = components["schemas"]["JornadaResponse"];
type Manual = components["schemas"]["ManualResponse"];

export function Jornada({
  api,
  pessoaId,
  versaoPessoa,
  podeRegistrar,
  atualizarPessoa,
}: {
  api: Api;
  pessoaId: string;
  versaoPessoa: string;
  podeRegistrar: boolean;
  atualizarPessoa: () => void;
}) {
  const [revisao, setRevisao] = useState(0);
  const [dataBase, setDataBase] = useState(hoje());
  const consulta = useConsulta<JornadaResponse>(
    api,
    `/pessoas/${pessoaId}/jornada?dataBase=${dataBase}`,
    revisao,
  );
  const manuais = useConsulta<Manual[]>(api, "/manuais", revisao);
  const atualizar = () => setRevisao((valor) => valor + 1);
  const jornada = consulta.dados;

  async function registrar(caminho: string, dados: Record<string, unknown>) {
    await api(`/pessoas/${pessoaId}/jornada/${caminho}`, {
      ...dados,
      versao: jornada!.versao,
    });
    atualizar();
  }

  const campoData: Campo = {
    nome: "dataConclusao",
    rotulo: "Data da conclusão",
    tipo: "date",
    obrigatorio: true,
  };
  const opcoesManual = (posto: number) =>
    manuais.dados
      ?.filter((manual) => Number(manual.posto) === posto)
      .map((manual) => ({
        valor: manual.id,
        rotulo: manual.identificacao,
      })) ?? [];

  if (consulta.erro === "Registro não encontrado na Igreja selecionada.")
    return (
      <Card>
        <EmptyState
          title="Trajetória ainda não iniciada"
          description="Esta pessoa ainda não possui uma Jornada ER registrada."
          icon={<GraduationCap aria-hidden="true" />}
          action={
            podeRegistrar ? (
              <Formulario
                titulo="Registrar como Candidato"
                campos={[]}
                texto="Iniciar trajetória"
                salvar={async () => {
                  await api(`/pessoas/${pessoaId}/candidatura`, {
                    versao: versaoPessoa,
                  });
                  atualizar();
                  atualizarPessoa();
                }}
              />
            ) : undefined
          }
        />
      </Card>
    );

  const requisitosConcluidos =
    jornada?.requisitos.filter((requisito) => requisito.dataConclusao).length ??
    0;

  return (
    <div className="jornada-pessoa">
      <Toolbar className="cabecalho-jornada">
        <div>
          <h3>Jornada ER</h3>
          <p>Progresso educacional, fatos oficiais e reconhecimentos.</p>
        </div>
        <Label htmlFor="data-base-jornada">
          Situação na data
          <Input
            id="data-base-jornada"
            type="date"
            value={dataBase}
            max={hoje()}
            onChange={(evento) =>
              evento.target.value && setDataBase(evento.target.value)
            }
          />
        </Label>
      </Toolbar>
      <Estado {...consulta} atualizar={atualizar} />
      {jornada && (
        <>
          <Alert variant="info">
            <AlertDescription>
              <strong>{jornada.situacao}</strong> ·{" "}
              {jornada.faixaEtaria ?? "Fora da faixa etária ER"} · referência{" "}
              {dataBr(jornada.dataBase)}. O menino permanece Embaixador até a
              véspera dos 18 anos; cada fato histórico usa a data em que
              ocorreu.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Requisitos Mínimos</CardTitle>
              <CardDescription>
                {requisitosConcluidos} de {jornada.requisitos.length}{" "}
                concluídos. Podem ser registrados em qualquer ordem.
              </CardDescription>
              <div
                className="progresso-jornada"
                role="progressbar"
                aria-label="Progresso dos Requisitos Mínimos"
                aria-valuemin={0}
                aria-valuemax={jornada.requisitos.length}
                aria-valuenow={requisitosConcluidos}
              >
                <span
                  style={{
                    width: `${jornada.requisitos.length ? (requisitosConcluidos / jornada.requisitos.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="lista-etapas-jornada">
                {jornada.requisitos.map((requisito) => (
                  <li key={requisito.requisito}>
                    <span className="marcador-etapa" aria-hidden="true">
                      {requisito.dataConclusao ? <Check /> : <Circle />}
                    </span>
                    <div>
                      <strong>{requisito.nome}</strong>
                      <span>
                        {requisito.dataConclusao
                          ? `Concluído em ${dataBr(requisito.dataConclusao)}`
                          : "Pendente"}
                      </span>
                    </div>
                    {!requisito.dataConclusao && podeRegistrar && (
                      <details>
                        <summary>Registrar conclusão</summary>
                        <Formulario
                          titulo={`Concluir ${requisito.nome}`}
                          campos={[campoData]}
                          iniciais={{ dataConclusao: hoje() }}
                          salvar={(dados) =>
                            registrar("requisitos", {
                              requisito: requisito.requisito,
                              ...dados,
                            })
                          }
                        />
                      </details>
                    )}
                  </li>
                ))}
              </ul>
              {jornada.postos.length === 0 && (
                <div className="admissao-jornada">
                  <Alert
                    variant={jornada.elegivelAdmissao ? "success" : "warning"}
                  >
                    <AlertDescription>
                      {jornada.elegivelAdmissao
                        ? "Requisitos concluídos: admissão disponível nesta data-base."
                        : "A admissão exige os cinco requisitos concluídos até a data informada."}
                    </AlertDescription>
                  </Alert>
                  {podeRegistrar && (
                    <Formulario
                      titulo="Registrar admissão oficial"
                      campos={[
                        {
                          nome: "dataAdmissao",
                          rotulo: "Data da admissão",
                          tipo: "date",
                          obrigatorio: true,
                        },
                        {
                          nome: "versaoManualId",
                          rotulo: "Versão do manual do Escudeiro",
                          tipo: "select",
                          obrigatorio: true,
                          opcoes: opcoesManual(1),
                        },
                      ]}
                      iniciais={{ dataAdmissao: hoje() }}
                      salvar={(dados) => registrar("admissao", dados)}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {jornada.mesesPermanencia && (
            <Alert variant="info">
              <AlertDescription>
                Permanência mínima fixada no ingresso como Escudeiro:{" "}
                <strong>{jornada.mesesPermanencia} meses por posto.</strong>
              </AlertDescription>
            </Alert>
          )}

          {jornada.postos.length > 0 && (
            <section
              className="trajetoria-postos"
              aria-labelledby="titulo-postos"
            >
              <h3 id="titulo-postos">Trajetória nos Postos</h3>
              <p>Postos representam formação educacional e não autoridade.</p>
              <div className="linha-postos">
                {jornada.postos.map((posto) => {
                  const tarefasConcluidas = posto.tarefas.filter(
                    (tarefa) => tarefa.dataConclusao,
                  ).length;
                  return (
                    <Card key={posto.id} className="posto-jornada">
                      <CardHeader>
                        <div className="titulo-posto-jornada">
                          <CardTitle>{posto.nome}</CardTitle>
                          <Badge
                            variant={
                              posto.dataConclusao ? "success" : "primary"
                            }
                          >
                            {posto.dataConclusao ? "Concluído" : "Em andamento"}
                          </Badge>
                        </div>
                        <CardDescription>
                          Ingresso: {dataBr(posto.dataIngresso)}
                          {posto.dataConclusao &&
                            ` · Conclusão: ${dataBr(posto.dataConclusao)}`}
                        </CardDescription>
                        <CardDescription>
                          {posto.identificacaoManual
                            ? `Manual: ${posto.identificacaoManual} · permanência até ${dataBr(posto.permanenciaAte)}`
                            : "Manual do Emérito ainda não definido. Nenhuma tarefa foi criada."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {posto.tarefas.length > 0 && (
                          <>
                            <p className="resumo-tarefas">
                              {tarefasConcluidas} de {posto.tarefas.length}{" "}
                              tarefas concluídas em qualquer ordem
                            </p>
                            <ul className="lista-etapas-jornada">
                              {posto.tarefas.map((tarefa) => (
                                <li key={tarefa.id}>
                                  <span
                                    className="marcador-etapa"
                                    aria-hidden="true"
                                  >
                                    {tarefa.dataConclusao ? (
                                      <Check />
                                    ) : (
                                      <Circle />
                                    )}
                                  </span>
                                  <div>
                                    <strong>{tarefa.nome}</strong>
                                    <span>
                                      {tarefa.dataConclusao
                                        ? `Concluída em ${dataBr(tarefa.dataConclusao)}`
                                        : "Pendente"}
                                    </span>
                                  </div>
                                  {!tarefa.dataConclusao &&
                                    !posto.dataConclusao &&
                                    podeRegistrar && (
                                      <details>
                                        <summary>Registrar tarefa</summary>
                                        <Formulario
                                          titulo={`Concluir ${tarefa.nome}`}
                                          campos={[campoData]}
                                          iniciais={{ dataConclusao: hoje() }}
                                          salvar={(dados) =>
                                            registrar("tarefas", {
                                              tarefaManualId: tarefa.id,
                                              ...dados,
                                            })
                                          }
                                        />
                                      </details>
                                    )}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        {!posto.dataConclusao &&
                          Number(posto.posto) < 4 &&
                          podeRegistrar && (
                            <Formulario
                              titulo={`Concluir oficialmente ${posto.nome}`}
                              campos={[
                                campoData,
                                ...(Number(posto.posto) < 3
                                  ? [
                                      {
                                        nome: "proximaVersaoManualId",
                                        rotulo:
                                          "Versão do manual do próximo posto",
                                        tipo: "select" as const,
                                        obrigatorio: true,
                                        opcoes: opcoesManual(
                                          Number(posto.posto) + 1,
                                        ),
                                      },
                                    ]
                                  : []),
                              ]}
                              iniciais={{ dataConclusao: hoje() }}
                              salvar={(dados) =>
                                registrar("conclusao-posto", {
                                  ...dados,
                                  proximaVersaoManualId:
                                    dados.proximaVersaoManualId || null,
                                })
                              }
                            />
                          )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {jornada.postos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cerimônias e certificados</CardTitle>
                <CardDescription>
                  Reconhecimentos são históricos independentes e não bloqueiam a
                  progressão.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jornada.cerimonias.length === 0 && (
                  <EmptyState
                    title="Nenhuma cerimônia registrada"
                    description="A ausência de cerimônia não bloqueia a progressão."
                  />
                )}
                <ul className="lista-cerimonias">
                  {jornada.cerimonias.map((cerimonia) => (
                    <li key={cerimonia.id}>
                      <strong>{dataBr(cerimonia.data)}</strong>
                      <span>{cerimonia.descricao}</span>
                    </li>
                  ))}
                </ul>
                {podeRegistrar && (
                  <details>
                    <summary>Registrar cerimônia ou certificado</summary>
                    <Formulario
                      titulo="Registrar cerimônia ou entrega de certificado"
                      campos={[
                        {
                          nome: "jornadaPostoId",
                          rotulo: "Posto reconhecido",
                          tipo: "select",
                          obrigatorio: true,
                          opcoes: jornada.postos.map((posto) => ({
                            valor: posto.id,
                            rotulo: posto.nome,
                          })),
                        },
                        {
                          nome: "data",
                          rotulo: "Data da cerimônia",
                          tipo: "date",
                          obrigatorio: true,
                        },
                        {
                          nome: "descricao",
                          rotulo: "Descrição",
                          obrigatorio: true,
                          limite: 1000,
                        },
                      ]}
                      iniciais={{ data: hoje() }}
                      salvar={(dados) => registrar("cerimonias", dados)}
                    />
                  </details>
                )}
              </CardContent>
            </Card>
          )}
          {manuais.erro && <Estado {...manuais} atualizar={atualizar} />}
          {manuais.dados?.length === 0 && (
            <Alert variant="warning">
              <AlertDescription>
                Cadastre uma versão identificada do manual na seção Manuais para
                registrar admissões e progressões.
              </AlertDescription>
            </Alert>
          )}
          <Button variant="outline" onClick={atualizar}>
            Atualizar jornada
          </Button>
        </>
      )}
    </div>
  );
}
