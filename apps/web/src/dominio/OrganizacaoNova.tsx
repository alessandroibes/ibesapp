import { useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { ArrowLeft, Building2, Crown, UsersRound } from "lucide-react";
import type { components } from "../../../../packages/contracts/api";
import {
  Badge,
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
  type Campo,
} from "./componentes";

type Dados = components["schemas"]["OrganizacaoResponse"];
type Mandato = components["schemas"]["MandatoResponse"];

const camposFim: Campo[] = [
  {
    nome: "dataFim",
    rotulo: "Data de encerramento",
    tipo: "date",
    obrigatorio: true,
  },
  { nome: "motivo", rotulo: "Motivo", obrigatorio: true, limite: 500 },
];

export function OrganizacaoNova({
  api,
  gerenciar,
}: {
  api: Api;
  gerenciar: boolean;
}) {
  const [revisao, setRevisao] = useState(0);
  const consulta = useConsulta<Dados>(api, "/organizacao", revisao);
  const atualizar = () => setRevisao((valor) => valor + 1);
  const salvar = async (caminho: string, dados: object, metodo = "POST") => {
    await api(caminho, dados, metodo);
    atualizar();
  };
  return (
    <div className="modulo-organizacao">
      <Estado {...consulta} atualizar={atualizar} />
      {!consulta.loading && !consulta.erro && consulta.dados && (
        <Routes>
          <Route index element={<Navigate to="consulados" replace />} />
          <Route
            path="consulados"
            element={
              <ListaConsulados
                dados={consulta.dados}
                gerenciar={gerenciar}
                salvar={salvar}
              />
            }
          />
          <Route
            path="consulados/:consuladoId"
            element={
              <DetalheConsulado
                dados={consulta.dados}
                api={api}
                gerenciar={gerenciar}
                salvar={salvar}
              />
            }
          />
          <Route
            path="diretoria"
            element={
              <Diretoria
                dados={consulta.dados}
                gerenciar={gerenciar}
                salvar={salvar}
              />
            }
          />
          <Route
            path="mandatos/:mandatoId"
            element={
              <DetalheMandato
                dados={consulta.dados}
                api={api}
                gerenciar={gerenciar}
                salvar={salvar}
              />
            }
          />
          <Route path="*" element={<Navigate to="consulados" replace />} />
        </Routes>
      )}
    </div>
  );
}

function NavegacaoOrganizacao() {
  return (
    <nav className="navegacao-contextual" aria-label="Organização interna">
      <NavLink to="/organizacao/consulados">Consulados</NavLink>
      <NavLink to="/organizacao/diretoria">Diretoria e mandatos</NavLink>
    </nav>
  );
}

function ListaConsulados({
  dados,
  gerenciar,
  salvar,
}: {
  dados: Dados;
  gerenciar: boolean;
  salvar: (c: string, d: object, m?: string) => Promise<void>;
}) {
  const vigentes = dados.consulados.filter((item) => !item.dataFim);
  return (
    <>
      <PageHeader
        title="Consulados"
        description="Pequenos grupos de Candidatos e Embaixadores, com vínculos e liderança preservados no histórico."
        breadcrumbs={[{ label: "Organização" }, { label: "Consulados" }]}
        actions={
          gerenciar && (
            <FormularioDialogo
              titulo="Novo Consulado"
              descricao="Informe o nome e a data em que o Consulado iniciou."
              gatilho="Novo Consulado"
            >
              <Formulario
                titulo="Novo Consulado"
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
            </FormularioDialogo>
          )
        }
      />
      <NavegacaoOrganizacao />
      <div className="resumo-operacional">
        <Card>
          <CardHeader>
            <CardDescription>Consulados vigentes</CardDescription>
            <CardTitle>{vigentes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Membros vigentes</CardDescription>
            <CardTitle>
              {vigentes.reduce(
                (t, c) => t + c.membros.filter((m) => !m.dataFim).length,
                0,
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      {dados.consulados.length === 0 ? (
        <EmptyState
          title="Nenhum Consulado cadastrado"
          description="Crie o primeiro Consulado para organizar seus membros."
        />
      ) : (
        <div className="grade-listagem">
          {dados.consulados.map((c) => {
            const membros = c.membros.filter((m) => !m.dataFim);
            const consul = c.consules.find((x) => !x.dataFim);
            return (
              <Card key={c.id}>
                <CardHeader>
                  <div className="linha-titulo">
                    <CardTitle>{c.nome}</CardTitle>
                    <Badge variant={c.dataFim ? "neutral" : "success"}>
                      {c.dataFim ? "Histórico" : "Vigente"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {dataBr(c.dataInicio)} a{" "}
                    {c.dataFim ? dataBr(c.dataFim) : "vigente"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    <UsersRound aria-hidden="true" /> {membros.length}{" "}
                    {membros.length === 1
                      ? "membro vigente"
                      : "membros vigentes"}
                  </p>
                  <p>
                    <Crown aria-hidden="true" /> Cônsul:{" "}
                    {consul?.nome ?? "Não definido"}
                  </p>
                  <Button asChild variant="outline">
                    <Link to={`/organizacao/consulados/${c.id}`}>
                      Ver detalhes
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function DetalheConsulado({
  dados,
  api,
  gerenciar,
  salvar,
}: {
  dados: Dados;
  api: Api;
  gerenciar: boolean;
  salvar: (c: string, d: object, m?: string) => Promise<void>;
}) {
  const { consuladoId } = useParams();
  const c = dados.consulados.find((item) => item.id === consuladoId);
  if (!c)
    return (
      <EmptyState
        title="Consulado não encontrado"
        action={
          <Button asChild>
            <Link to="/organizacao/consulados">Voltar aos Consulados</Link>
          </Button>
        }
      />
    );
  const membrosAtuais = c.membros.filter((m) => !m.dataFim);
  const membrosHistoricos = c.membros.filter((m) => m.dataFim);
  const consulAtual = c.consules.find((item) => !item.dataFim);
  return (
    <>
      <PageHeader
        title={`Consulado ${c.nome}`}
        description={`${dataBr(c.dataInicio)} a ${c.dataFim ? dataBr(c.dataFim) : "vigente"}`}
        breadcrumbs={[
          { label: "Organização", href: "/organizacao/consulados" },
          { label: "Consulados", href: "/organizacao/consulados" },
          { label: c.nome },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link to="/organizacao/consulados">
              <ArrowLeft aria-hidden="true" /> Voltar
            </Link>
          </Button>
        }
        meta={
          <Badge variant={c.dataFim ? "neutral" : "success"}>
            {c.dataFim ? "Encerrado" : "Vigente"}
          </Badge>
        }
      />
      <NavegacaoOrganizacao />
      <div className="grade-detalhe">
        <Card>
          <CardHeader>
            <CardTitle>Membros vigentes</CardTitle>
            <CardDescription>
              Um menino pode possuir somente um vínculo vigente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {membrosAtuais.length === 0 ? (
              <EmptyState title="Nenhum membro vigente" />
            ) : (
              <ul className="lista-registros">
                {membrosAtuais.map((m) => (
                  <li key={m.id}>
                    <div>
                      <strong>{m.nome}</strong>
                      <span>Desde {dataBr(m.dataInicio)}</span>
                    </div>
                    {gerenciar && !c.dataFim && (
                      <div className="acoes-linha">
                        <FormularioDialogo
                          titulo={`Transferir ${m.nome}`}
                          descricao="O vínculo atual será encerrado e o novo será iniciado na mesma data."
                          gatilho="Transferir"
                        >
                          <Formulario
                            titulo={`Transferir ${m.nome}`}
                            texto="Confirmar transferência"
                            campos={[
                              {
                                nome: "consuladoDestinoId",
                                rotulo: "Consulado de destino",
                                tipo: "select",
                                obrigatorio: true,
                                opcoes: dados.consulados
                                  .filter((x) => x.id !== c.id && !x.dataFim)
                                  .map((x) => ({
                                    valor: x.id,
                                    rotulo: x.nome,
                                  })),
                              },
                              {
                                nome: "data",
                                rotulo: "Data da transferência",
                                tipo: "date",
                                obrigatorio: true,
                              },
                            ]}
                            iniciais={{ data: hoje() }}
                            salvar={(d) =>
                              salvar(
                                `/organizacao/membros/${m.id}/transferencia`,
                                { versao: m.versao, ...d },
                              )
                            }
                          />
                        </FormularioDialogo>
                        <FormularioDialogo
                          titulo={`Encerrar vínculo de ${m.nome}`}
                          descricao="O registro continuará disponível no histórico."
                          gatilho="Encerrar"
                        >
                          <Formulario
                            titulo={`Encerrar vínculo de ${m.nome}`}
                            texto="Encerrar vínculo"
                            campos={camposFim}
                            iniciais={{ dataFim: hoje() }}
                            salvar={(d) =>
                              salvar(
                                `/organizacao/membros/${m.id}/encerramento`,
                                { versao: m.versao, ...d },
                              )
                            }
                          />
                        </FormularioDialogo>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {gerenciar && !c.dataFim && (
              <FormularioDialogo
                titulo="Incluir membro"
                descricao="Candidatos e Embaixadores podem integrar o Consulado."
                gatilho="Incluir membro"
              >
                <Formulario
                  titulo={`Incluir membro em ${c.nome}`}
                  campos={[
                    {
                      nome: "dataInicio",
                      rotulo: "Início",
                      tipo: "date",
                      obrigatorio: true,
                    },
                  ]}
                  iniciais={{ dataInicio: hoje() }}
                  salvar={(d) =>
                    salvar(`/organizacao/consulados/${c.id}/membros`, d)
                  }
                >
                  <SeletorPessoa api={api} rotulo="Candidato ou Embaixador" />
                </Formulario>
              </FormularioDialogo>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cônsul vigente</CardTitle>
            <CardDescription>
              A liderança decorre do Consulado e não concede permissão no
              sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consulAtual ? (
              <div className="destaque-pessoa">
                <Crown aria-hidden="true" />
                <div>
                  <strong>{consulAtual.nome}</strong>
                  <span>Desde {dataBr(consulAtual.dataInicio)}</span>
                </div>
              </div>
            ) : (
              <EmptyState title="Nenhum Cônsul vigente" />
            )}
            {gerenciar &&
              !c.dataFim &&
              (consulAtual ? (
                <FormularioDialogo
                  titulo="Encerrar liderança"
                  descricao="A liderança encerrada permanecerá no histórico."
                  gatilho="Encerrar liderança"
                >
                  <Formulario
                    titulo={`Encerrar liderança de ${consulAtual.nome}`}
                    texto="Encerrar liderança"
                    campos={camposFim}
                    iniciais={{ dataFim: hoje() }}
                    salvar={(d) =>
                      salvar(
                        `/organizacao/consules/${consulAtual.id}/encerramento`,
                        { versao: consulAtual.versao, ...d },
                      )
                    }
                  />
                </FormularioDialogo>
              ) : (
                <FormularioDialogo
                  titulo="Definir Cônsul"
                  descricao="Escolha entre os membros vigentes deste Consulado."
                  gatilho="Definir Cônsul"
                >
                  <Formulario
                    titulo={`Definir Cônsul de ${c.nome}`}
                    campos={[
                      {
                        nome: "membroConsuladoId",
                        rotulo: "Membro vigente",
                        tipo: "select",
                        obrigatorio: true,
                        opcoes: membrosAtuais.map((m) => ({
                          valor: m.id,
                          rotulo: m.nome,
                        })),
                      },
                      {
                        nome: "dataInicio",
                        rotulo: "Início",
                        tipo: "date",
                        obrigatorio: true,
                      },
                    ]}
                    iniciais={{ dataInicio: hoje() }}
                    salvar={(d) =>
                      salvar(`/organizacao/consulados/${c.id}/consul`, d)
                    }
                  />
                </FormularioDialogo>
              ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico do Consulado</CardTitle>
          <CardDescription>
            Vínculos e lideranças encerrados permanecem consultáveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membrosHistoricos.length +
            c.consules.filter((x) => x.dataFim).length ===
          0 ? (
            <EmptyState title="Nenhum registro histórico" />
          ) : (
            <Timeline
              items={[
                ...membrosHistoricos.map((m) => ({
                  id: m.id,
                  title: `${m.nome} · membro`,
                  description: `${dataBr(m.dataInicio)} a ${dataBr(m.dataFim!)}${m.motivoFim ? ` · ${m.motivoFim}` : ""}`,
                })),
                ...c.consules
                  .filter((x) => x.dataFim)
                  .map((x) => ({
                    id: x.id,
                    title: `${x.nome} · Cônsul`,
                    description: `${dataBr(x.dataInicio)} a ${dataBr(x.dataFim!)}${x.motivoFim ? ` · ${x.motivoFim}` : ""}`,
                  })),
              ]}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Diretoria({
  dados,
  gerenciar,
  salvar,
}: {
  dados: Dados;
  gerenciar: boolean;
  salvar: (c: string, d: object, m?: string) => Promise<void>;
}) {
  return (
    <>
      <PageHeader
        title="Diretoria e mandatos"
        description="Cargos organizacionais, ocupações e eleições com períodos e históricos próprios."
        breadcrumbs={[{ label: "Organização" }, { label: "Diretoria" }]}
        actions={
          gerenciar && (
            <div className="acoes-cabecalho">
              <FormularioDialogo
                titulo="Novo cargo"
                descricao="Configure o nome e a quantidade de vagas."
                gatilho="Novo cargo"
              >
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
              </FormularioDialogo>
              <FormularioDialogo
                titulo="Novo mandato"
                descricao="Mandatos possuem início e fim definidos."
                gatilho="Novo mandato"
              >
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
              </FormularioDialogo>
            </div>
          )
        }
      />
      <NavegacaoOrganizacao />
      <Card>
        <CardHeader>
          <CardTitle>Cargos configurados</CardTitle>
          <CardDescription>
            Cargo, Posto e permissão do sistema são conceitos independentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dados.cargos.length === 0 ? (
            <EmptyState title="Nenhum cargo configurado" />
          ) : (
            <div className="grade-cargos">
              {dados.cargos.map((c) => (
                <div className="item-cargo" key={c.id}>
                  <Building2 aria-hidden="true" />
                  <div>
                    <strong>{c.nome}</strong>
                    <span>
                      {c.quantidadeVagas}{" "}
                      {Number(c.quantidadeVagas) === 1 ? "vaga" : "vagas"}
                    </span>
                  </div>
                  <Badge variant={c.ativo ? "success" : "neutral"}>
                    {c.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  {gerenciar && (
                    <FormularioDialogo
                      titulo={`Alterar ${c.nome}`}
                      descricao="Atualize nome, vagas ou situação do cargo."
                      gatilho="Editar"
                    >
                      <Formulario
                        titulo={`Alterar ${c.nome}`}
                        texto="Atualizar cargo"
                        campos={[
                          { nome: "nome", rotulo: "Nome", obrigatorio: true },
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
                    </FormularioDialogo>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <section>
        <h2>Mandatos</h2>
        {dados.mandatos.length === 0 ? (
          <EmptyState title="Nenhum mandato cadastrado" />
        ) : (
          <div className="grade-listagem">
            {dados.mandatos.map((m) => (
              <Card key={m.id}>
                <CardHeader>
                  <div className="linha-titulo">
                    <CardTitle>{m.nome}</CardTitle>
                    <Badge
                      variant={
                        periodoAtual(m, dados.hoje) ? "success" : "neutral"
                      }
                    >
                      {periodoAtual(m, dados.hoje) ? "Atual" : "Histórico"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {dataBr(m.dataInicio)} a {dataBr(m.dataFim)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    {m.ocupacoes.filter((o) => !o.dataFim).length} ocupações
                    vigentes
                  </p>
                  <Button asChild variant="outline">
                    <Link to={`/organizacao/mandatos/${m.id}`}>
                      Ver mandato
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function periodoAtual(m: Mandato, data: string) {
  return m.dataInicio <= data && m.dataFim >= data;
}

function DetalheMandato({
  dados,
  api,
  gerenciar,
  salvar,
}: {
  dados: Dados;
  api: Api;
  gerenciar: boolean;
  salvar: (c: string, d: object, m?: string) => Promise<void>;
}) {
  const { mandatoId } = useParams();
  const m = dados.mandatos.find((item) => item.id === mandatoId);
  if (!m)
    return (
      <EmptyState
        title="Mandato não encontrado"
        action={
          <Button asChild>
            <Link to="/organizacao/diretoria">Voltar à Diretoria</Link>
          </Button>
        }
      />
    );
  const cargos = dados.cargos
    .filter((c) => c.ativo)
    .map((c) => ({ valor: c.id, rotulo: c.nome }));
  const atuais = m.ocupacoes.filter((o) => !o.dataFim);
  const historicas = m.ocupacoes.filter((o) => o.dataFim);
  return (
    <>
      <PageHeader
        title={m.nome}
        description={`${dataBr(m.dataInicio)} a ${dataBr(m.dataFim)}`}
        breadcrumbs={[
          { label: "Organização", href: "/organizacao/consulados" },
          { label: "Diretoria", href: "/organizacao/diretoria" },
          { label: m.nome },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link to="/organizacao/diretoria">
              <ArrowLeft aria-hidden="true" /> Voltar
            </Link>
          </Button>
        }
        meta={
          <Badge variant={periodoAtual(m, dados.hoje) ? "success" : "neutral"}>
            {periodoAtual(m, dados.hoje)
              ? "Mandato atual"
              : "Mandato histórico"}
          </Badge>
        }
      />
      {m.observacoes && <p className="texto-contexto">{m.observacoes}</p>}
      <div className="grade-detalhe">
        <Card>
          <CardHeader>
            <CardTitle>Ocupações atuais</CardTitle>
            <CardDescription>
              Uma pessoa pode acumular cargos e também exercer a função de
              Cônsul.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {atuais.length === 0 ? (
              <EmptyState title="Nenhuma ocupação vigente" />
            ) : (
              <ul className="lista-registros">
                {atuais.map((o) => (
                  <li key={o.id}>
                    <div>
                      <strong>
                        {o.cargo} · {o.nome}
                      </strong>
                      <span>Desde {dataBr(o.dataInicio)}</span>
                      <small>
                        {o.membroIgreja
                          ? "Membro desta Igreja na data da designação"
                          : "Sem vínculo de Membro vigente na data da designação"}{" "}
                        — informação, sem bloqueio.
                      </small>
                    </div>
                    {gerenciar && (
                      <FormularioDialogo
                        titulo="Encerrar ocupação"
                        descricao="Informe a data e o motivo. O histórico será preservado."
                        gatilho="Encerrar"
                      >
                        <Formulario
                          titulo={`Encerrar ocupação de ${o.nome}`}
                          texto="Encerrar ocupação"
                          campos={camposFim}
                          iniciais={{ dataFim: hoje() }}
                          salvar={(d) =>
                            salvar(
                              `/organizacao/ocupacoes/${o.id}/encerramento`,
                              { versao: o.versao, ...d },
                            )
                          }
                        />
                      </FormularioDialogo>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {gerenciar && (
              <FormularioDialogo
                titulo="Registrar ocupação"
                descricao="Somente Embaixadores podem ocupar cargos da Diretoria."
                gatilho="Registrar ocupação"
              >
                <Formulario
                  titulo={`Designar no ${m.nome}`}
                  texto="Registrar ocupação"
                  campos={[
                    {
                      nome: "cargoEmbaixadaId",
                      rotulo: "Cargo",
                      tipo: "select",
                      obrigatorio: true,
                      opcoes: cargos,
                    },
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
                  <SeletorPessoa api={api} rotulo="Embaixador" />
                </Formulario>
              </FormularioDialogo>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resultados de eleições</CardTitle>
            <CardDescription>
              O resultado é imutável; trocas usam encerramento e nova ocupação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {m.eleicoes.length === 0 ? (
              <EmptyState title="Nenhum resultado registrado" />
            ) : (
              <Timeline
                items={m.eleicoes.map((e) => ({
                  id: e.id,
                  title: `${e.cargo} · ${e.nome}`,
                  description: `${dataBr(e.data)} · ${e.motivo}`,
                }))}
              />
            )}
            {gerenciar && (
              <FormularioDialogo
                titulo="Registrar eleição"
                descricao="Registre somente o resultado da eleição."
                gatilho="Registrar resultado"
              >
                <Formulario
                  titulo={`Registrar eleição no ${m.nome}`}
                  texto="Registrar resultado"
                  campos={[
                    {
                      nome: "cargoEmbaixadaId",
                      rotulo: "Cargo",
                      tipo: "select",
                      obrigatorio: true,
                      opcoes: cargos,
                    },
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
              </FormularioDialogo>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de ocupações</CardTitle>
        </CardHeader>
        <CardContent>
          {historicas.length === 0 ? (
            <EmptyState title="Nenhuma ocupação encerrada" />
          ) : (
            <Timeline
              items={historicas.map((o) => ({
                id: o.id,
                title: `${o.cargo} · ${o.nome}`,
                description: `${dataBr(o.dataInicio)} a ${dataBr(o.dataFim!)}${o.motivoFim ? ` · ${o.motivoFim}` : ""}`,
              }))}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
