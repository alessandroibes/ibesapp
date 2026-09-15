import { useState } from "react";
import type { components } from "../../../../packages/contracts/api";
import { type Api, useConsulta, hoje, dataBr } from "./api";
import { Estado, Formulario, type Campo } from "./componentes";
import { Button } from "../components/ui/button";
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
  const atualizar = () => setRevisao((r) => r + 1);
  const j = consulta.dados;
  async function registrar(caminho: string, dados: Record<string, unknown>) {
    await api(`/pessoas/${pessoaId}/jornada/${caminho}`, {
      ...dados,
      versao: j!.versao,
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
      ?.filter((m) => Number(m.posto) === posto)
      .map((m) => ({ valor: m.id, rotulo: m.identificacao })) ?? [];
  if (consulta.erro === "Registro não encontrado na Igreja selecionada.")
    return (
      <section>
        <h3>Jornada ER</h3>
        <p>Esta pessoa ainda não possui trajetória registrada.</p>
        {podeRegistrar && (
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
        )}
      </section>
    );
  return (
    <section>
      <h3>Jornada ER</h3>
      <label>
        Consultar situação na data
        <input
          type="date"
          value={dataBase}
          max={hoje()}
          onChange={(e) => e.target.value && setDataBase(e.target.value)}
        />
      </label>
      <Estado {...consulta} atualizar={atualizar} />
      {j && (
        <>
          <p>
            <strong>{j.situacao}</strong> ·{" "}
            {j.faixaEtaria ?? "Fora da faixa etária ER"} · referência{" "}
            {dataBr(j.dataBase)}
          </p>
          <p>
            O menino permanece Embaixador até a véspera dos 18 anos. Registros
            históricos usam a data em que cada fato aconteceu.
          </p>
          <h4>Requisitos Mínimos</h4>
          <ul className="lista-dominio">
            {j.requisitos.map((r) => (
              <li key={r.requisito}>
                <strong>{r.nome}</strong>
                <span>
                  {r.dataConclusao
                    ? `Concluído em ${dataBr(r.dataConclusao)}`
                    : "Pendente"}
                </span>
                {!r.dataConclusao && podeRegistrar && (
                  <details>
                    <summary>Registrar conclusão</summary>
                    <Formulario
                      titulo={`Concluir ${r.nome}`}
                      campos={[campoData]}
                      iniciais={{ dataConclusao: hoje() }}
                      salvar={(d) =>
                        registrar("requisitos", {
                          requisito: r.requisito,
                          ...d,
                        })
                      }
                    />
                  </details>
                )}
              </li>
            ))}
          </ul>
          {j.postos.length === 0 && (
            <>
              <p>
                {j.elegivelAdmissao
                  ? "Requisitos concluídos: admissão disponível nesta data-base."
                  : "A admissão exige os cinco requisitos concluídos até a data informada."}
              </p>
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
                  salvar={(d) => registrar("admissao", d)}
                />
              )}
            </>
          )}
          {j.mesesPermanencia && (
            <p>
              Permanência mínima fixada no ingresso como Escudeiro:{" "}
              <strong>{j.mesesPermanencia} meses por posto.</strong>
            </p>
          )}
          {j.postos.map((p) => (
            <article key={p.id} className="posto-dominio">
              <h4>{p.nome}</h4>
              <p>
                Ingresso: {dataBr(p.dataIngresso)}
                {p.dataConclusao && ` · Conclusão: ${dataBr(p.dataConclusao)}`}
              </p>
              <p>
                {p.identificacaoManual
                  ? `Manual: ${p.identificacaoManual} · Permanência até ${dataBr(p.permanenciaAte)}`
                  : "Manual do Emérito ainda não definido. Nenhuma tarefa foi criada."}
              </p>
              <ul className="lista-dominio">
                {p.tarefas.map((t) => (
                  <li key={t.id}>
                    <strong>{t.nome}</strong>
                    <span>
                      {t.dataConclusao
                        ? `Concluída em ${dataBr(t.dataConclusao)}`
                        : "Pendente"}
                    </span>
                    {!t.dataConclusao && !p.dataConclusao && podeRegistrar && (
                      <details>
                        <summary>Registrar tarefa</summary>
                        <Formulario
                          titulo={`Concluir ${t.nome}`}
                          campos={[campoData]}
                          iniciais={{ dataConclusao: hoje() }}
                          salvar={(d) =>
                            registrar("tarefas", { tarefaManualId: t.id, ...d })
                          }
                        />
                      </details>
                    )}
                  </li>
                ))}
              </ul>
              {!p.dataConclusao && Number(p.posto) < 4 && podeRegistrar && (
                <Formulario
                  titulo={`Concluir oficialmente ${p.nome}`}
                  campos={[
                    campoData,
                    ...(Number(p.posto) < 3
                      ? [
                          {
                            nome: "proximaVersaoManualId",
                            rotulo: "Versão do manual do próximo posto",
                            tipo: "select" as const,
                            obrigatorio: true,
                            opcoes: opcoesManual(Number(p.posto) + 1),
                          },
                        ]
                      : []),
                  ]}
                  iniciais={{ dataConclusao: hoje() }}
                  salvar={(d) =>
                    registrar("conclusao-posto", {
                      ...d,
                      proximaVersaoManualId: d.proximaVersaoManualId || null,
                    })
                  }
                />
              )}
            </article>
          ))}
          {!!j.postos.length && (
            <>
              <h4>Cerimônias e certificados</h4>
              {j.cerimonias.length === 0 && (
                <p>
                  Nenhuma cerimônia registrada. Isso não bloqueia a progressão.
                </p>
              )}
              <ul>
                {j.cerimonias.map((c) => (
                  <li key={c.id}>
                    {dataBr(c.data)} — {c.descricao}
                  </li>
                ))}
              </ul>
              {podeRegistrar && (
                <Formulario
                  titulo="Registrar cerimônia ou entrega de certificado"
                  campos={[
                    {
                      nome: "jornadaPostoId",
                      rotulo: "Posto reconhecido",
                      tipo: "select",
                      obrigatorio: true,
                      opcoes: j.postos.map((p) => ({
                        valor: p.id,
                        rotulo: p.nome,
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
                  salvar={(d) => registrar("cerimonias", d)}
                />
              )}
            </>
          )}
          {manuais.erro && <Estado {...manuais} atualizar={atualizar} />}
          {manuais.dados?.length === 0 && (
            <p>
              Cadastre uma versão identificada do manual na seção Manuais para
              registrar admissões e progressões.
            </p>
          )}
          <Button variant="outline" onClick={atualizar}>
            Atualizar jornada
          </Button>
        </>
      )}
    </section>
  );
}
