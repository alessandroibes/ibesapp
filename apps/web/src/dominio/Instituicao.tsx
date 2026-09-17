import { useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import type { components } from "../../../../packages/contracts/api";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Timeline,
} from "../components/ui";
import { type Api, dataBr, hoje, useConsulta } from "./api";
import {
  Estado,
  Formulario,
  FormularioDialogo,
  SeletorPessoa,
} from "./componentes";
type E = components["schemas"];

export function Instituicao({
  api,
  editar,
  podeConsultarPessoas,
}: {
  api: Api;
  editar: boolean;
  podeConsultarPessoas: boolean;
}) {
  const [revisao, setRevisao] = useState(0);
  const atualizar = () => setRevisao((r) => r + 1);
  const instituicao = useConsulta<E["EmbaixadaResponse"]>(
    api,
    "/embaixada",
    revisao,
  );
  const conselheiros = useConsulta<E["ConselheiroResponse"][]>(
    api,
    "/embaixada/conselheiros",
    revisao,
  );
  const liderancas = useConsulta<E["LiderancaResponse"][]>(
    api,
    "/embaixada/liderancas",
    revisao,
  );
  const contas = useConsulta<E["ContaResponse"][]>(
    api,
    editar ? "/embaixada/contas" : null,
    revisao,
  );
  const salvar = async (c: string, d: object, m = "POST") => {
    await api(c, d, m);
    atualizar();
  };
  return (
    <div className="modulo-administrativo">
      <Estado {...instituicao} atualizar={atualizar} />
      {instituicao.dados && (
        <Routes>
          <Route
            index
            element={
              <Resumo
                i={instituicao.dados}
                conselheiros={conselheiros.dados ?? []}
                liderancas={liderancas.dados ?? []}
                editar={editar}
                podeConsultarPessoas={podeConsultarPessoas}
                api={api}
                contas={contas.dados ?? []}
                salvar={salvar}
              />
            }
          />
          <Route
            path="editar"
            element={
              editar ? (
                <Editar i={instituicao.dados} salvar={salvar} />
              ) : (
                <Navigate to="/instituicao" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/instituicao" replace />} />
        </Routes>
      )}
    </div>
  );
}

function Resumo({
  i,
  conselheiros,
  liderancas,
  editar,
  podeConsultarPessoas,
  api,
  contas,
  salvar,
}: {
  i: E["EmbaixadaResponse"];
  conselheiros: E["ConselheiroResponse"][];
  liderancas: E["LiderancaResponse"][];
  editar: boolean;
  podeConsultarPessoas: boolean;
  api: Api;
  contas: E["ContaResponse"][];
  salvar: (c: string, d: object, m?: string) => Promise<void>;
}) {
  const atuais = conselheiros.filter((c) => !c.dataFim);
  const liderancasAtuais = liderancas.filter((l) => !l.dataFim);
  return (
    <>
      <PageHeader
        title="Igreja e Embaixada"
        description="Dados institucionais, Conselheiros e lideranças adultas."
        breadcrumbs={[{ label: "Igreja e Embaixada" }]}
        actions={
          editar && (
            <Button asChild>
              <Link to="/instituicao/editar">Editar dados institucionais</Link>
            </Button>
          )
        }
      />
      <div className="grade-detalhe">
        <Card>
          <CardHeader>
            <CardTitle>Igreja</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="lista-definicoes">
              <div>
                <dt>Nome</dt>
                <dd>{i.nomeIgreja}</dd>
              </div>
              <div>
                <dt>Pastor</dt>
                <dd>{i.pastor || "Não informado"}</dd>
              </div>
              <div>
                <dt>Endereço</dt>
                <dd>{i.enderecoIgreja || "Não informado"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Embaixada</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="lista-definicoes">
              <div>
                <dt>Nome oficial</dt>
                <dd>{i.nomeOficial}</dd>
              </div>
              <div>
                <dt>Nome usual</dt>
                <dd>{i.nomeUsual || "Não informado"}</dd>
              </div>
              <div>
                <dt>Fundação</dt>
                <dd>
                  {i.dataFundacao ? dataBr(i.dataFundacao) : "Não informada"}
                </dd>
              </div>
              <div>
                <dt>Endereço</dt>
                <dd>{i.enderecoEmbaixada || "Não informado"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>História</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{i.historia || "História ainda não registrada."}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="linha-titulo">
            <div>
              <CardTitle>Conselheiros vigentes</CardTitle>
              <CardDescription>
                O vínculo não concede permissões automaticamente.
              </CardDescription>
            </div>
            {editar && podeConsultarPessoas && (
              <FormularioDialogo
                titulo="Cadastrar Conselheiro"
                descricao="Vincule uma pessoa adulta e, opcionalmente, uma conta de acesso."
                gatilho="Cadastrar Conselheiro"
              >
                <Formulario
                  titulo="Novo Conselheiro"
                  campos={[
                    { nome: "funcao", rotulo: "Função", obrigatorio: true },
                    {
                      nome: "dataInicio",
                      rotulo: "Data de início",
                      tipo: "date",
                      obrigatorio: true,
                    },
                    {
                      nome: "usuarioId",
                      rotulo: "Conta de acesso (opcional)",
                      tipo: "select",
                      opcoes: contas.map((c) => ({
                        valor: c.id,
                        rotulo: c.email,
                      })),
                    },
                  ]}
                  iniciais={{ dataInicio: hoje() }}
                  salvar={async (d) => {
                    const p = await api<E["PessoaResponse"]>(
                      `/pessoas/${d.pessoaId}`,
                    );
                    await salvar("/embaixada/conselheiros", {
                      ...d,
                      usuarioId: d.usuarioId || null,
                      versaoPessoa: p.versao,
                    });
                  }}
                >
                  <SeletorPessoa api={api} />
                </Formulario>
              </FormularioDialogo>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {atuais.length === 0 ? (
            <EmptyState title="Nenhum Conselheiro vigente" />
          ) : (
            <ul className="lista-registros">
              {atuais.map((c) => (
                <li key={c.id}>
                  <div>
                    <strong>{c.nome}</strong>
                    <span>
                      {c.funcao} · desde {dataBr(c.dataInicio)}
                    </span>
                  </div>
                  {editar && (
                    <FormularioDialogo
                      titulo="Encerrar Conselheiro"
                      descricao="O vínculo continuará disponível no histórico."
                      gatilho="Encerrar"
                    >
                      <Formulario
                        titulo={`Encerrar Conselheiro ${c.nome}`}
                        texto="Encerrar vínculo"
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
                          salvar(
                            `/embaixada/conselheiros/${c.id}/encerramento`,
                            { ...d, versao: c.versao },
                          )
                        }
                      />
                    </FormularioDialogo>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="linha-titulo">
            <div>
              <CardTitle>Lideranças vigentes</CardTitle>
              <CardDescription>
                Funções adultas da Embaixada, independentes da Diretoria dos
                meninos.
              </CardDescription>
            </div>
            {editar && (
              <FormularioDialogo
                titulo="Registrar liderança"
                descricao="Escolha um Conselheiro vigente e informe a função."
                gatilho="Registrar liderança"
              >
                <Formulario
                  titulo="Nova liderança"
                  campos={[
                    {
                      nome: "conselheiroId",
                      rotulo: "Conselheiro",
                      tipo: "select",
                      obrigatorio: true,
                      opcoes: atuais.map((c) => ({
                        valor: c.id,
                        rotulo: c.nome,
                      })),
                    },
                    {
                      nome: "funcao",
                      rotulo: "Função de liderança",
                      obrigatorio: true,
                    },
                    {
                      nome: "dataInicio",
                      rotulo: "Data de início",
                      tipo: "date",
                      obrigatorio: true,
                    },
                  ]}
                  iniciais={{ dataInicio: hoje() }}
                  salvar={(d) => {
                    const c = atuais.find((x) => x.id === d.conselheiroId)!;
                    return salvar("/embaixada/liderancas", {
                      ...d,
                      versaoConselheiro: c.versao,
                    });
                  }}
                />
              </FormularioDialogo>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {liderancasAtuais.length === 0 ? (
            <EmptyState title="Nenhuma liderança vigente" />
          ) : (
            <ul className="lista-registros">
              {liderancasAtuais.map((l) => (
                <li key={l.id}>
                  <div>
                    <strong>{l.funcao}</strong>
                    <span>
                      {l.nome} · desde {dataBr(l.dataInicio)}
                    </span>
                  </div>
                  {editar && (
                    <FormularioDialogo
                      titulo="Encerrar liderança"
                      descricao="O período permanecerá no histórico."
                      gatilho="Encerrar"
                    >
                      <Formulario
                        titulo={`Encerrar liderança ${l.funcao}`}
                        texto="Encerrar liderança"
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
                          salvar(`/embaixada/liderancas/${l.id}/encerramento`, {
                            ...d,
                            versao: l.versao,
                          })
                        }
                      />
                    </FormularioDialogo>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Histórico institucional</CardTitle>
        </CardHeader>
        <CardContent>
          {conselheiros.filter((c) => c.dataFim).length +
            liderancas.filter((l) => l.dataFim).length ===
          0 ? (
            <EmptyState title="Nenhum vínculo encerrado" />
          ) : (
            <Timeline
              items={[
                ...conselheiros
                  .filter((c) => c.dataFim)
                  .map((c) => ({
                    id: `c-${c.id}`,
                    title: `${c.nome} · Conselheiro`,
                    description: `${dataBr(c.dataInicio)} a ${dataBr(c.dataFim!)}`,
                  })),
                ...liderancas
                  .filter((l) => l.dataFim)
                  .map((l) => ({
                    id: `l-${l.id}`,
                    title: `${l.funcao} · ${l.nome}`,
                    description: `${dataBr(l.dataInicio)} a ${dataBr(l.dataFim!)}`,
                  })),
              ]}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Editar({
  i,
  salvar,
}: {
  i: E["EmbaixadaResponse"];
  salvar: (c: string, d: object, m?: string) => Promise<void>;
}) {
  return (
    <>
      <PageHeader
        title="Editar dados institucionais"
        description="Atualize os dados da Igreja e da Embaixada."
        breadcrumbs={[
          { label: "Igreja e Embaixada", href: "/instituicao" },
          { label: "Editar" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link to="/instituicao">Cancelar</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <Formulario
            key={i.versaoEmbaixada}
            titulo="Dados institucionais"
            iniciais={i}
            campos={[
              {
                nome: "nomeIgreja",
                rotulo: "Nome da Igreja",
                obrigatorio: true,
                grupo: "Igreja",
              },
              {
                nome: "enderecoIgreja",
                rotulo: "Endereço da Igreja",
                limite: 500,
                grupo: "Igreja",
              },
              { nome: "pastor", rotulo: "Pastor", grupo: "Igreja" },
              {
                nome: "nomeOficial",
                rotulo: "Nome oficial da Embaixada",
                obrigatorio: true,
                grupo: "Embaixada",
              },
              { nome: "nomeUsual", rotulo: "Nome usual", grupo: "Embaixada" },
              {
                nome: "dataFundacao",
                rotulo: "Data de fundação",
                tipo: "date",
                grupo: "Embaixada",
              },
              {
                nome: "enderecoEmbaixada",
                rotulo: "Endereço da Embaixada",
                limite: 500,
                grupo: "Embaixada",
              },
              {
                nome: "historia",
                rotulo: "História",
                tipo: "textarea",
                grupo: "Memória",
              },
            ]}
            salvar={(d) =>
              salvar(
                "/embaixada",
                {
                  ...d,
                  dataFundacao: d.dataFundacao || null,
                  versaoIgreja: i.versaoIgreja,
                  versaoEmbaixada: i.versaoEmbaixada,
                },
                "PUT",
              )
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
