import { useState } from "react";
import type { components } from "../../../../packages/contracts/api";
import { type Api, dataBr, hoje, useConsulta } from "./api";
import { Estado, Formulario, SeletorPessoa, type Campo } from "./componentes";

type Dados = components["schemas"]["OrganizacaoResponse"];
type Consulado = components["schemas"]["ConsuladoResponse"];
type Mandato = components["schemas"]["MandatoResponse"];

const motivoFim: Campo[] = [
  {
    nome: "dataFim",
    rotulo: "Data de encerramento",
    tipo: "date",
    obrigatorio: true,
  },
  { nome: "motivo", rotulo: "Motivo", obrigatorio: true, limite: 500 },
];

export function Organizacao({
  api,
  gerenciar,
}: {
  api: Api;
  gerenciar: boolean;
}) {
  const [revisao, setRevisao] = useState(0);
  const consulta = useConsulta<Dados>(api, "/organizacao", revisao);
  const atualizar = () => setRevisao((r) => r + 1);
  async function salvar(caminho: string, dados: object, metodo = "POST") {
    await api(caminho, dados, metodo);
    atualizar();
  }
  const dados = consulta.dados;
  return (
    <section aria-labelledby="titulo-organizacao">
      <h2 id="titulo-organizacao">Consulados e Diretoria</h2>
      <p>
        Consulados, lideranças e ocupações permanecem no histórico pelos
        períodos informados. Postos e cargos não alteram permissões de acesso.
      </p>
      <Estado {...consulta} atualizar={atualizar} />
      {!consulta.loading && !consulta.erro && !dados && (
        <p>Nenhum dado de organização disponível.</p>
      )}
      {gerenciar && (
        <div className="grade-organizacao">
          <Formulario
            titulo="Criar Consulado"
            campos={[
              {
                nome: "nome",
                rotulo: "Nome do Consulado",
                obrigatorio: true,
                limite: 80,
              },
              {
                nome: "dataInicio",
                rotulo: "Início",
                tipo: "date",
                obrigatorio: true,
              },
            ]}
            iniciais={{ dataInicio: hoje() }}
            salvar={(d) => salvar("/organizacao/consulados", d)}
          />
          <Formulario
            titulo="Criar cargo da Diretoria"
            campos={[
              {
                nome: "nome",
                rotulo: "Nome do cargo",
                obrigatorio: true,
                limite: 100,
              },
              {
                nome: "quantidadeVagas",
                rotulo: "Quantidade de vagas",
                tipo: "number",
                obrigatorio: true,
              },
            ]}
            iniciais={{ quantidadeVagas: 1 }}
            salvar={(d) =>
              salvar("/organizacao/cargos", {
                ...d,
                quantidadeVagas: Number(d.quantidadeVagas),
              })
            }
          />
          <Formulario
            titulo="Criar mandato da Diretoria"
            campos={[
              {
                nome: "nome",
                rotulo: "Nome do mandato",
                obrigatorio: true,
                limite: 150,
              },
              {
                nome: "dataInicio",
                rotulo: "Início",
                tipo: "date",
                obrigatorio: true,
              },
              {
                nome: "dataFim",
                rotulo: "Fim",
                tipo: "date",
                obrigatorio: true,
              },
              {
                nome: "observacoes",
                rotulo: "Observações",
                tipo: "textarea",
                limite: 2000,
              },
            ]}
            salvar={(d) =>
              salvar("/organizacao/mandatos", {
                ...d,
                observacoes: d.observacoes || null,
              })
            }
          />
        </div>
      )}
      {dados && dados.consulados.length === 0 && (
        <p>Nenhum Consulado cadastrado.</p>
      )}
      {dados?.consulados.map((c) => (
        <ConsuladoCartao
          key={c.id}
          consulado={c}
          todos={dados.consulados}
          api={api}
          gerenciar={gerenciar}
          salvar={salvar}
        />
      ))}
      {dados && dados.cargos.length === 0 && (
        <p>Nenhum cargo da Diretoria configurado.</p>
      )}
      {!!dados?.cargos.length && (
        <article>
          <h3>Cargos configurados</h3>
          <ul className="lista-dominio">
            {dados.cargos.map((c) => (
              <li key={c.id}>
                <strong>{c.nome}</strong>
                <span>
                  {c.quantidadeVagas}{" "}
                  {c.quantidadeVagas === 1 ? "vaga" : "vagas"} ·{" "}
                  {c.ativo ? "Ativo" : "Inativo"}
                </span>
                {gerenciar && (
                  <Formulario
                    titulo={`Alterar ${c.nome}`}
                    texto="Atualizar cargo"
                    campos={[
                      {
                        nome: "nome",
                        rotulo: "Nome",
                        obrigatorio: true,
                        limite: 100,
                      },
                      {
                        nome: "quantidadeVagas",
                        rotulo: "Vagas",
                        tipo: "number",
                        obrigatorio: true,
                      },
                      {
                        nome: "ativo",
                        rotulo: "Situação",
                        tipo: "select",
                        obrigatorio: true,
                        opcoes: [
                          { valor: "true", rotulo: "Ativo" },
                          { valor: "false", rotulo: "Inativo" },
                        ],
                      },
                    ]}
                    iniciais={{
                      nome: c.nome,
                      quantidadeVagas: c.quantidadeVagas,
                      ativo: String(c.ativo),
                    }}
                    salvar={(d) =>
                      salvar(
                        `/organizacao/cargos/${c.id}`,
                        {
                          versao: c.versao,
                          nome: d.nome,
                          quantidadeVagas: Number(d.quantidadeVagas),
                          ativo: d.ativo === "true",
                        },
                        "PUT",
                      )
                    }
                  />
                )}
              </li>
            ))}
          </ul>
        </article>
      )}
      {dados && dados.mandatos.length === 0 && (
        <p>Nenhum mandato da Diretoria cadastrado.</p>
      )}
      {dados?.mandatos.map((m) => (
        <MandatoCartao
          key={m.id}
          mandato={m}
          dados={dados}
          api={api}
          gerenciar={gerenciar}
          salvar={salvar}
        />
      ))}
    </section>
  );
}

function ConsuladoCartao({
  consulado: c,
  todos,
  api,
  gerenciar,
  salvar,
}: {
  consulado: Consulado;
  todos: Consulado[];
  api: Api;
  gerenciar: boolean;
  salvar: (c: string, d: object, m?: string) => Promise<void>;
}) {
  const vigentes = c.membros.filter((m) => !m.dataFim);
  return (
    <article>
      <h3>Consulado {c.nome}</h3>
      <p>
        {dataBr(c.dataInicio)} a {c.dataFim ? dataBr(c.dataFim) : "vigente"}
      </p>
      <h4>Membros</h4>
      {c.membros.length === 0 ? (
        <p>Nenhum membro.</p>
      ) : (
        <ul className="lista-dominio">
          {c.membros.map((m) => (
            <li key={m.id}>
              <strong>{m.nome}</strong>
              <span>
                {dataBr(m.dataInicio)} a{" "}
                {m.dataFim ? dataBr(m.dataFim) : "vigente"}
                {m.motivoFim ? ` · ${m.motivoFim}` : ""}
              </span>
              {gerenciar && !m.dataFim && (
                <div className="grade-organizacao">
                  <Formulario
                    titulo={`Transferir ${m.nome}`}
                    texto="Transferir"
                    campos={[
                      {
                        nome: "consuladoDestinoId",
                        rotulo: "Consulado de destino",
                        tipo: "select",
                        obrigatorio: true,
                        opcoes: todos
                          .filter((x) => x.id !== c.id && !x.dataFim)
                          .map((x) => ({ valor: x.id, rotulo: x.nome })),
                      },
                      {
                        nome: "data",
                        rotulo: "Data",
                        tipo: "date",
                        obrigatorio: true,
                      },
                    ]}
                    iniciais={{ data: hoje() }}
                    salvar={(d) =>
                      salvar(`/organizacao/membros/${m.id}/transferencia`, {
                        versao: m.versao,
                        ...d,
                      })
                    }
                  />
                  <Formulario
                    titulo={`Encerrar vínculo de ${m.nome}`}
                    texto="Encerrar vínculo"
                    campos={motivoFim}
                    iniciais={{ dataFim: hoje() }}
                    salvar={(d) =>
                      salvar(`/organizacao/membros/${m.id}/encerramento`, {
                        versao: m.versao,
                        ...d,
                      })
                    }
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <h4>Cônsules</h4>
      {c.consules.length === 0 ? (
        <p>Nenhuma liderança registrada.</p>
      ) : (
        <ul className="lista-dominio">
          {c.consules.map((l) => (
            <li key={l.id}>
              <strong>{l.nome}</strong>
              <span>
                {dataBr(l.dataInicio)} a{" "}
                {l.dataFim ? dataBr(l.dataFim) : "vigente"}
                {l.motivoFim ? ` · ${l.motivoFim}` : ""}
              </span>
              {gerenciar && !l.dataFim && (
                <Formulario
                  titulo={`Encerrar liderança de ${l.nome}`}
                  texto="Encerrar liderança"
                  campos={motivoFim}
                  iniciais={{ dataFim: hoje() }}
                  salvar={(d) =>
                    salvar(`/organizacao/consules/${l.id}/encerramento`, {
                      versao: l.versao,
                      ...d,
                    })
                  }
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {gerenciar && !c.dataFim && (
        <div className="grade-organizacao">
          <Formulario
            titulo={`Incluir membro em ${c.nome}`}
            salvar={(d) => salvar(`/organizacao/consulados/${c.id}/membros`, d)}
            campos={[
              {
                nome: "dataInicio",
                rotulo: "Início",
                tipo: "date",
                obrigatorio: true,
              },
            ]}
            iniciais={{ dataInicio: hoje() }}
          >
            <SeletorPessoa api={api} />
          </Formulario>
          <Formulario
            titulo={`Definir Cônsul de ${c.nome}`}
            salvar={(d) => salvar(`/organizacao/consulados/${c.id}/consul`, d)}
            campos={[
              {
                nome: "membroConsuladoId",
                rotulo: "Membro vigente",
                tipo: "select",
                obrigatorio: true,
                opcoes: vigentes.map((m) => ({ valor: m.id, rotulo: m.nome })),
              },
              {
                nome: "dataInicio",
                rotulo: "Início",
                tipo: "date",
                obrigatorio: true,
              },
            ]}
            iniciais={{ dataInicio: hoje() }}
          />
          <Formulario
            titulo={`Renomear ${c.nome}`}
            texto="Atualizar nome"
            campos={[
              { nome: "nome", rotulo: "Nome", obrigatorio: true, limite: 80 },
            ]}
            iniciais={{ nome: c.nome }}
            salvar={(d) =>
              salvar(
                `/organizacao/consulados/${c.id}`,
                { versao: c.versao, nome: d.nome },
                "PUT",
              )
            }
          />
          <Formulario
            titulo={`Encerrar ${c.nome}`}
            texto="Encerrar Consulado"
            campos={[
              {
                nome: "dataFim",
                rotulo: "Data de encerramento",
                tipo: "date",
                obrigatorio: true,
              },
            ]}
            iniciais={{ dataFim: hoje() }}
            salvar={(d) =>
              salvar(`/organizacao/consulados/${c.id}/encerramento`, {
                versao: c.versao,
                dataFim: d.dataFim,
                motivo: "Encerramento do Consulado",
              })
            }
          />
        </div>
      )}
    </article>
  );
}

function MandatoCartao({
  mandato: m,
  dados,
  api,
  gerenciar,
  salvar,
}: {
  mandato: Mandato;
  dados: Dados;
  api: Api;
  gerenciar: boolean;
  salvar: (c: string, d: object, metodo?: string) => Promise<void>;
}) {
  const cargos = dados.cargos
    .filter((c) => c.ativo)
    .map((c) => ({ valor: c.id, rotulo: c.nome }));
  const camposCargo: Campo[] = [
    {
      nome: "cargoEmbaixadaId",
      rotulo: "Cargo",
      tipo: "select",
      obrigatorio: true,
      opcoes: cargos,
    },
  ];
  return (
    <article>
      <h3>{m.nome}</h3>
      <p>
        {dataBr(m.dataInicio)} a {dataBr(m.dataFim)}
        {m.observacoes ? ` · ${m.observacoes}` : ""}
      </p>
      <h4>Ocupações</h4>
      {m.ocupacoes.length === 0 ? (
        <p>Nenhuma ocupação registrada.</p>
      ) : (
        <ul className="lista-dominio">
          {m.ocupacoes.map((o) => (
            <li key={o.id}>
              <strong>
                {o.cargo}: {o.nome}
              </strong>
              <span>
                {dataBr(o.dataInicio)} a{" "}
                {o.dataFim ? dataBr(o.dataFim) : "vigente"} ·{" "}
                {o.membroIgreja
                  ? "Membro desta Igreja"
                  : "Sem vínculo de Membro vigente na data de início"}
                {o.motivoFim ? ` · ${o.motivoFim}` : ""}
              </span>
              {gerenciar && !o.dataFim && (
                <Formulario
                  titulo={`Encerrar ocupação de ${o.nome}`}
                  texto="Encerrar ocupação"
                  campos={motivoFim}
                  iniciais={{ dataFim: hoje() }}
                  salvar={(d) =>
                    salvar(`/organizacao/ocupacoes/${o.id}/encerramento`, {
                      versao: o.versao,
                      ...d,
                    })
                  }
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <h4>Resultados de eleições</h4>
      {m.eleicoes.length === 0 ? (
        <p>Nenhum resultado registrado.</p>
      ) : (
        <ul className="lista-dominio">
          {m.eleicoes.map((e) => (
            <li key={e.id}>
              <strong>
                {e.cargo}: {e.nome}
              </strong>
              <span>
                {dataBr(e.data)} · {e.motivo}
              </span>
            </li>
          ))}
        </ul>
      )}
      {gerenciar && (
        <div className="grade-organizacao">
          <Formulario
            titulo={`Designar no ${m.nome}`}
            texto="Registrar ocupação"
            campos={[
              ...camposCargo,
              {
                nome: "dataInicio",
                rotulo: "Início",
                tipo: "date",
                obrigatorio: true,
              },
            ]}
            iniciais={{ dataInicio: hoje() }}
            salvar={(d) =>
              salvar(`/organizacao/mandatos/${m.id}/ocupacoes`, {
                versaoMandato: m.versao,
                ...d,
              })
            }
          >
            <SeletorPessoa api={api} />
          </Formulario>
          <Formulario
            titulo={`Registrar eleição no ${m.nome}`}
            texto="Registrar resultado"
            campos={[
              ...camposCargo,
              {
                nome: "data",
                rotulo: "Data da eleição",
                tipo: "date",
                obrigatorio: true,
              },
              {
                nome: "motivo",
                rotulo: "Motivo ou identificação",
                obrigatorio: true,
                limite: 500,
              },
            ]}
            iniciais={{ data: hoje() }}
            salvar={(d) =>
              salvar(`/organizacao/mandatos/${m.id}/eleicoes`, {
                versaoMandato: m.versao,
                cargoEmbaixadaId: d.cargoEmbaixadaId,
                pessoaEscolhidaId: d.pessoaId,
                data: d.data,
                motivo: d.motivo,
              })
            }
          >
            <SeletorPessoa
              api={api}
              nome="pessoaId"
              rotulo="Embaixador escolhido"
            />
          </Formulario>
        </div>
      )}
    </article>
  );
}
