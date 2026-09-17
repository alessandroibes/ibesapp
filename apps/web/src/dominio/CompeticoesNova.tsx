import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowLeft, CheckCircle2, Plus, Trophy } from "lucide-react";
import type { components } from "../../../../packages/contracts/api";
import {
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
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
} from "./componentes";

type Modalidade = components["schemas"]["ModalidadeResponse"];
type Resumo = components["schemas"]["CompeticaoResumoResponse"];
type Detalhe = components["schemas"]["CompeticaoDetalheResponse"];
type ProvaCompeticao = components["schemas"]["ProvaCompeticaoResponse"];
type Candidato = components["schemas"]["CandidatoEscalacaoResponse"];
type Aptidao = components["schemas"]["AptidaoResponse"];
const naturezas = ["", "Individual", "Coletiva"];
const referencias = ["", "Nenhuma", "Missionário", "Livro bíblico"];
const categorias = ["", "Junior", "Adolescente", "Juvenil", "Livre"];

export function CompeticoesNova({
  api,
  gerenciar,
}: {
  api: Api;
  gerenciar: boolean;
}) {
  const [revisao, setRevisao] = useState(0);
  const atualizar = () => setRevisao((valor) => valor + 1);
  const salvar = async (caminho: string, dados: object, metodo = "POST") => {
    await api(caminho, dados, metodo);
    atualizar();
  };
  return (
    <div className="modulo-competicoes">
      <Routes>
        <Route
          index
          element={
            <ListaCompeticoes
              api={api}
              gerenciar={gerenciar}
              revisao={revisao}
              salvar={salvar}
            />
          }
        />
        <Route path="nova" element={<NovaCompeticao salvar={salvar} />} />
        <Route
          path="catalogo"
          element={
            <Catalogo
              api={api}
              gerenciar={gerenciar}
              revisao={revisao}
              salvar={salvar}
            />
          }
        />
        <Route
          path="aptidoes"
          element={
            <Aptidoes
              api={api}
              gerenciar={gerenciar}
              revisao={revisao}
              salvar={salvar}
            />
          }
        />
        <Route
          path=":competicaoId"
          element={
            <DetalheCompeticao
              api={api}
              gerenciar={gerenciar}
              revisao={revisao}
              atualizar={atualizar}
              salvar={salvar}
            />
          }
        />
        <Route path="*" element={<Navigate to="/competicoes" replace />} />
      </Routes>
    </div>
  );
}

function NavegacaoCompeticoes() {
  return (
    <nav className="navegacao-contextual" aria-label="Competições">
      <NavLink end to="/competicoes">
        Competições
      </NavLink>
      <NavLink to="/competicoes/catalogo">Catálogo de provas</NavLink>
      <NavLink to="/competicoes/aptidoes">Aptidões</NavLink>
    </nav>
  );
}

function ListaCompeticoes({
  api,
  gerenciar,
  revisao,
}: {
  api: Api;
  gerenciar: boolean;
  revisao: number;
  salvar: (c: string, d: object, m?: string) => Promise<void>;
}) {
  const consulta = useConsulta<Resumo[]>(api, "/competicoes", revisao);
  return (
    <>
      <PageHeader
        title="Competições"
        description="Planeje cada competição com data-base, provas e escalações próprias."
        breadcrumbs={[{ label: "Competições" }]}
        actions={
          gerenciar && (
            <Button asChild>
              <Link to="/competicoes/nova">
                <Plus aria-hidden="true" /> Nova competição
              </Link>
            </Button>
          )
        }
      />
      <NavegacaoCompeticoes />
      <Estado {...consulta} atualizar={() => undefined} />
      {!consulta.loading && consulta.dados?.length === 0 ? (
        <EmptyState
          title="Nenhuma competição cadastrada"
          description="Cadastre uma competição para configurar suas provas e escalações."
        />
      ) : (
        <div className="grade-listagem">
          {consulta.dados?.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{c.nome}</CardTitle>
                <CardDescription>
                  {dataBr(c.dataInicio)} a {dataBr(c.dataFim)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  <Trophy aria-hidden="true" /> {c.quantidadeProvas}{" "}
                  {Number(c.quantidadeProvas) === 1
                    ? "prova configurada"
                    : "provas configuradas"}
                </p>
                <p>Data-base: {dataBr(c.dataBaseCategoria)}</p>
                {c.local && <p>{c.local}</p>}
                <Button asChild variant="outline">
                  <Link to={`/competicoes/${c.id}`}>Ver competição</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function NovaCompeticao({
  salvar,
}: {
  salvar: (c: string, d: object) => Promise<void>;
}) {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title="Nova competição"
        description="Cadastre as informações do regulamento. As provas serão adicionadas depois."
        breadcrumbs={[
          { label: "Competições", href: "/competicoes" },
          { label: "Nova competição" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link to="/competicoes">
              <ArrowLeft aria-hidden="true" /> Cancelar
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <Formulario
            titulo="Nova competição"
            campos={[
              {
                nome: "nome",
                rotulo: "Nome da competição",
                obrigatorio: true,
                limite: 200,
                grupo: "Identificação",
              },
              {
                nome: "local",
                rotulo: "Local",
                limite: 500,
                grupo: "Identificação",
              },
              {
                nome: "dataInicio",
                rotulo: "Data inicial",
                tipo: "date",
                obrigatorio: true,
                grupo: "Período e regulamento",
              },
              {
                nome: "dataFim",
                rotulo: "Data final",
                tipo: "date",
                obrigatorio: true,
                grupo: "Período e regulamento",
              },
              {
                nome: "dataBaseCategoria",
                rotulo: "Data-base das categorias",
                tipo: "date",
                obrigatorio: true,
                grupo: "Período e regulamento",
              },
              {
                nome: "observacoes",
                rotulo: "Observações",
                tipo: "textarea",
                limite: 4000,
                grupo: "Observações",
              },
            ]}
            iniciais={{
              dataInicio: hoje(),
              dataFim: hoje(),
              dataBaseCategoria: hoje(),
            }}
            salvar={async (d) => {
              await salvar("/competicoes", {
                ...d,
                local: d.local || null,
                observacoes: d.observacoes || null,
              });
              navigate("/competicoes");
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}

function Catalogo({
  api,
  gerenciar,
  revisao,
  salvar,
}: {
  api: Api;
  gerenciar: boolean;
  revisao: number;
  salvar: (c: string, d: object) => Promise<void>;
}) {
  const consulta = useConsulta<Modalidade[]>(
    api,
    "/competicoes/catalogo",
    revisao,
  );
  return (
    <>
      <PageHeader
        title="Catálogo de provas"
        description="Modalidades e provas reutilizáveis, separadas da operação de cada competição."
        breadcrumbs={[
          { label: "Competições", href: "/competicoes" },
          { label: "Catálogo" },
        ]}
        actions={
          gerenciar && (
            <div className="acoes-cabecalho">
              <FormularioDialogo
                titulo="Nova modalidade"
                descricao="Crie um agrupamento para as provas."
                gatilho="Nova modalidade"
              >
                <Formulario
                  titulo="Nova modalidade"
                  campos={[
                    {
                      nome: "nome",
                      rotulo: "Nome da modalidade",
                      obrigatorio: true,
                      limite: 100,
                    },
                  ]}
                  salvar={(d) => salvar("/competicoes/catalogo/modalidades", d)}
                />
              </FormularioDialogo>
              <FormularioDialogo
                titulo="Nova prova"
                descricao="A natureza e a referência serão reutilizadas nas competições."
                gatilho="Nova prova"
              >
                <Formulario
                  titulo="Nova prova"
                  campos={[
                    {
                      nome: "modalidadeId",
                      rotulo: "Modalidade",
                      tipo: "select",
                      obrigatorio: true,
                      opcoes:
                        consulta.dados
                          ?.filter((m) => m.ativa)
                          .map((m) => ({ valor: m.id, rotulo: m.nome })) ?? [],
                    },
                    {
                      nome: "nome",
                      rotulo: "Nome da prova",
                      obrigatorio: true,
                      limite: 150,
                    },
                    {
                      nome: "natureza",
                      rotulo: "Natureza",
                      tipo: "select",
                      obrigatorio: true,
                      opcoes: [
                        { valor: "1", rotulo: "Individual" },
                        { valor: "2", rotulo: "Coletiva" },
                      ],
                    },
                    {
                      nome: "tipoReferencia",
                      rotulo: "Referência variável",
                      tipo: "select",
                      obrigatorio: true,
                      opcoes: [
                        { valor: "1", rotulo: "Nenhuma" },
                        { valor: "2", rotulo: "Missionário" },
                        { valor: "3", rotulo: "Livro bíblico" },
                      ],
                    },
                  ]}
                  salvar={(d) =>
                    salvar("/competicoes/catalogo/provas", {
                      ...d,
                      natureza: Number(d.natureza),
                      tipoReferencia: Number(d.tipoReferencia),
                    })
                  }
                />
              </FormularioDialogo>
            </div>
          )
        }
      />
      <NavegacaoCompeticoes />
      <Estado {...consulta} atualizar={() => undefined} />
      {consulta.dados?.length === 0 ? (
        <EmptyState title="Nenhuma modalidade cadastrada" />
      ) : (
        <div className="grade-listagem">
          {consulta.dados?.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <div className="linha-titulo">
                  <CardTitle>{m.nome}</CardTitle>
                  <Badge variant={m.ativa ? "success" : "neutral"}>
                    {m.ativa ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {m.provas.length === 0 ? (
                  <EmptyState title="Nenhuma prova" />
                ) : (
                  <ul className="lista-registros">
                    {m.provas.map((p) => (
                      <li key={p.id}>
                        <div>
                          <strong>{p.nome}</strong>
                          <span>
                            {naturezas[Number(p.natureza)]} · referência:{" "}
                            {referencias[Number(p.tipoReferencia)]}
                          </span>
                        </div>
                        <Badge variant={p.ativa ? "success" : "neutral"}>
                          {p.ativa ? "Ativa" : "Inativa"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function Aptidoes({
  api,
  gerenciar,
  revisao,
  salvar,
}: {
  api: Api;
  gerenciar: boolean;
  revisao: number;
  salvar: (c: string, d: object) => Promise<void>;
}) {
  const aptidoes = useConsulta<Aptidao[]>(
    api,
    "/competicoes/aptidoes",
    revisao,
  );
  const catalogo = useConsulta<Modalidade[]>(
    api,
    "/competicoes/catalogo",
    revisao,
  );
  const provas =
    catalogo.dados?.flatMap((m) =>
      m.provas
        .filter((p) => p.ativa)
        .map((p) => ({ valor: p.id, rotulo: `${m.nome} · ${p.nome}` })),
    ) ?? [];
  return (
    <>
      <PageHeader
        title="Aptidões"
        description="Decisões humanas registradas por Conselheiros. Elegibilidade é calculada somente na competição."
        breadcrumbs={[
          { label: "Competições", href: "/competicoes" },
          { label: "Aptidões" },
        ]}
        actions={
          gerenciar && (
            <FormularioDialogo
              titulo="Registrar aptidão"
              descricao="Escolha a pessoa, a prova e a data da decisão."
              gatilho="Registrar aptidão"
            >
              <Formulario
                titulo="Registrar aptidão"
                campos={[
                  {
                    nome: "provaId",
                    rotulo: "Prova",
                    tipo: "select",
                    obrigatorio: true,
                    opcoes: provas,
                  },
                  {
                    nome: "dataInicio",
                    rotulo: "Data da decisão",
                    tipo: "date",
                    obrigatorio: true,
                  },
                ]}
                iniciais={{ dataInicio: hoje() }}
                salvar={(d) => salvar("/competicoes/aptidoes", d)}
              >
                <SeletorPessoa api={api} rotulo="Candidato ou Embaixador" />
              </Formulario>
            </FormularioDialogo>
          )
        }
      />
      <NavegacaoCompeticoes />
      <Estado {...aptidoes} atualizar={() => undefined} />
      {aptidoes.dados?.length === 0 ? (
        <EmptyState title="Nenhuma aptidão registrada" />
      ) : (
        <Card>
          <CardContent>
            <ul className="lista-registros">
              {aptidoes.dados?.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>{a.pessoa}</strong>
                    <span>{a.prova}</span>
                    <small>
                      {dataBr(a.dataInicio)} a{" "}
                      {a.dataFim ? dataBr(a.dataFim) : "vigente"}
                      {a.motivoFim ? ` · ${a.motivoFim}` : ""}
                    </small>
                  </div>
                  <Badge variant={a.dataFim ? "neutral" : "success"}>
                    {a.dataFim ? "Histórico" : "Vigente"}
                  </Badge>
                  {gerenciar && !a.dataFim && (
                    <FormularioDialogo
                      titulo="Encerrar aptidão"
                      descricao="A decisão encerrada permanecerá no histórico."
                      gatilho="Encerrar"
                    >
                      <Formulario
                        titulo={`Encerrar aptidão de ${a.pessoa} em ${a.prova}`}
                        texto="Encerrar aptidão"
                        campos={[
                          {
                            nome: "dataFim",
                            rotulo: "Data de encerramento",
                            tipo: "date",
                            obrigatorio: true,
                          },
                          {
                            nome: "motivo",
                            rotulo: "Motivo",
                            obrigatorio: true,
                            limite: 500,
                          },
                        ]}
                        iniciais={{ dataFim: hoje() }}
                        salvar={(d) =>
                          salvar(`/competicoes/aptidoes/${a.id}/encerramento`, {
                            versao: a.versao,
                            ...d,
                          })
                        }
                      />
                    </FormularioDialogo>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function DetalheCompeticao({
  api,
  gerenciar,
  revisao,
  atualizar,
  salvar,
}: {
  api: Api;
  gerenciar: boolean;
  revisao: number;
  atualizar: () => void;
  salvar: (c: string, d: object, m?: string) => Promise<void>;
}) {
  const { competicaoId = "" } = useParams();
  const detalhe = useConsulta<Detalhe>(
    api,
    `/competicoes/${competicaoId}`,
    revisao,
  );
  const catalogo = useConsulta<Modalidade[]>(
    api,
    "/competicoes/catalogo",
    revisao,
  );
  const provas =
    catalogo.dados?.flatMap((m) =>
      m.provas
        .filter((p) => p.ativa)
        .map((p) => ({ valor: p.id, rotulo: `${m.nome} · ${p.nome}` })),
    ) ?? [];
  if (detalhe.loading || detalhe.erro)
    return <Estado {...detalhe} atualizar={atualizar} />;
  const c = detalhe.dados;
  if (!c) return <EmptyState title="Competição não encontrada" />;
  return (
    <>
      <PageHeader
        title={c.nome}
        description={`${dataBr(c.dataInicio)} a ${dataBr(c.dataFim)}${c.local ? ` · ${c.local}` : ""}`}
        breadcrumbs={[
          { label: "Competições", href: "/competicoes" },
          { label: c.nome },
        ]}
        actions={
          <div className="acoes-cabecalho">
            <Button asChild variant="outline">
              <Link to="/competicoes">
                <ArrowLeft aria-hidden="true" /> Voltar
              </Link>
            </Button>
            {gerenciar && (
              <FormularioDialogo
                titulo="Adicionar prova"
                descricao="Configure limites, categorias e horário conforme o regulamento."
                gatilho="Adicionar prova"
              >
                <Formulario
                  titulo="Adicionar prova à competição"
                  campos={[
                    {
                      nome: "provaId",
                      rotulo: "Prova do catálogo",
                      tipo: "select",
                      obrigatorio: true,
                      opcoes: provas,
                    },
                    {
                      nome: "categorias",
                      rotulo: "Categorias",
                      tipo: "select",
                      obrigatorio: true,
                      opcoes: [
                        { valor: "4", rotulo: "Livre" },
                        { valor: "1", rotulo: "Junior" },
                        { valor: "2", rotulo: "Adolescente" },
                        { valor: "3", rotulo: "Juvenil" },
                        {
                          valor: "1,2,3",
                          rotulo: "Junior, Adolescente e Juvenil",
                        },
                      ],
                    },
                    {
                      nome: "minimoTitulares",
                      rotulo: "Mínimo de titulares",
                      tipo: "number",
                      obrigatorio: true,
                    },
                    {
                      nome: "maximoParticipantes",
                      rotulo: "Máximo total, incluindo reservas",
                      tipo: "number",
                      obrigatorio: true,
                    },
                    {
                      nome: "maximoReservas",
                      rotulo: "Máximo de reservas",
                      tipo: "number",
                      obrigatorio: true,
                    },
                    {
                      nome: "quantidadeExataTitulares",
                      rotulo: "Quantidade exata de titulares (opcional)",
                      tipo: "number",
                    },
                    {
                      nome: "referencia",
                      rotulo: "Missionário, livro ou referência",
                      limite: 500,
                    },
                    {
                      nome: "data",
                      rotulo: "Data da prova (opcional)",
                      tipo: "date",
                    },
                    { nome: "horaInicio", rotulo: "Início", tipo: "time" },
                    { nome: "horaFim", rotulo: "Fim", tipo: "time" },
                  ]}
                  iniciais={{
                    minimoTitulares: 1,
                    maximoParticipantes: 1,
                    maximoReservas: 0,
                  }}
                  salvar={(d) =>
                    salvar(`/competicoes/${c.id}/provas`, {
                      provaId: d.provaId,
                      categorias: d.categorias.split(",").map(Number),
                      minimoTitulares: Number(d.minimoTitulares),
                      maximoParticipantes: Number(d.maximoParticipantes),
                      maximoReservas: Number(d.maximoReservas),
                      quantidadeExataTitulares: d.quantidadeExataTitulares
                        ? Number(d.quantidadeExataTitulares)
                        : null,
                      referencia: d.referencia || null,
                      data: d.data || null,
                      horaInicio: d.horaInicio ? `${d.horaInicio}:00` : null,
                      horaFim: d.horaFim ? `${d.horaFim}:00` : null,
                    })
                  }
                />
              </FormularioDialogo>
            )}
          </div>
        }
        meta={
          <span>
            Data-base das categorias:{" "}
            <strong>{dataBr(c.dataBaseCategoria)}</strong>
          </span>
        }
      />
      {c.observacoes && <p className="texto-contexto">{c.observacoes}</p>}
      <nav className="atalhos-detalhe" aria-label="Áreas da competição">
        <a href="#provas">Provas e escalações</a>
        <a href="#historico">Histórico</a>
      </nav>
      <section id="provas">
        <h2>Provas e escalações</h2>
        {c.provas.length === 0 ? (
          <EmptyState
            title="Nenhuma prova configurada"
            description="Adicione as provas previstas no regulamento desta competição."
          />
        ) : (
          <div className="pilha-provas">
            {c.provas.map((p) => (
              <Prova
                key={p.id}
                competicaoId={c.id}
                prova={p}
                api={api}
                gerenciar={gerenciar}
                salvar={salvar}
              />
            ))}
          </div>
        )}
      </section>
      <section id="historico">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de escalações</CardTitle>
            <CardDescription>
              Finalizações e reaberturas permanecem registradas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {c.provas.flatMap((p) => p.escalacao.alteracoes).length === 0 ? (
              <EmptyState title="Nenhuma alteração registrada" />
            ) : (
              <Timeline
                items={c.provas.flatMap((p) =>
                  p.escalacao.alteracoes.map((a, i) => ({
                    id: `${p.id}-${a.registradoEm}-${i}`,
                    title: `${p.prova} · ${Number(a.tipo) === 1 ? "Finalizada" : "Reaberta"}`,
                    description: `${new Date(a.registradoEm).toLocaleString("pt-BR")}${a.motivo ? ` · ${a.motivo}` : ""}`,
                  })),
                )}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function Prova({
  competicaoId,
  prova: p,
  api,
  gerenciar,
  salvar,
}: {
  competicaoId: string;
  prova: ProvaCompeticao;
  api: Api;
  gerenciar: boolean;
  salvar: (c: string, d: object, m?: string) => Promise<void>;
}) {
  const titulares = p.escalacao.participantes.filter(
    (x) => Number(x.funcao) === 1,
  );
  const reservas = p.escalacao.participantes.filter(
    (x) => Number(x.funcao) === 2,
  );
  const finalizada = Number(p.escalacao.situacao) === 2;
  return (
    <Card>
      <CardHeader>
        <div className="linha-titulo">
          <div>
            <CardTitle>
              {p.modalidade} · {p.prova}
            </CardTitle>
            <CardDescription>
              {naturezas[Number(p.natureza)]} ·{" "}
              {p.categorias.map((x) => categorias[Number(x)]).join(", ")}
            </CardDescription>
          </div>
          <Badge variant={finalizada ? "success" : "warning"}>
            {finalizada ? "Finalizada" : "Rascunho"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="limites-escalacao">
          <span>
            Titulares: mínimo {p.minimoTitulares}
            {p.quantidadeExataTitulares
              ? `, exatamente ${p.quantidadeExataTitulares}`
              : ""}
          </span>
          <span>Máximo total: {p.maximoParticipantes}</span>
          <span>Reservas: até {p.maximoReservas}</span>
        </div>
        {p.tipoReferencia !== 1 && (
          <p>
            {referencias[Number(p.tipoReferencia)]}: {p.referencia}
          </p>
        )}
        {p.data && (
          <p>
            Horário: {dataBr(p.data)}, {p.horaInicio?.slice(0, 5)}–
            {p.horaFim?.slice(0, 5)}
          </p>
        )}
        {p.escalacao.avisos.map((aviso) => (
          <Alert key={aviso} variant="warning">
            {aviso}
          </Alert>
        ))}
        <div className="grade-detalhe">
          <section>
            <h3>Titulares ({titulares.length})</h3>
            {titulares.length ? (
              <ul>
                {titulares.map((x) => (
                  <li key={x.pessoaId}>{x.nome}</li>
                ))}
              </ul>
            ) : (
              <p>Nenhum titular.</p>
            )}
          </section>
          <section>
            <h3>Reservas ({reservas.length})</h3>
            {reservas.length ? (
              <ul>
                {reservas.map((x) => (
                  <li key={x.pessoaId}>{x.nome}</li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma reserva.</p>
            )}
          </section>
        </div>
        {gerenciar && (
          <EditorEscalacao
            api={api}
            competicaoId={competicaoId}
            prova={p}
            salvar={salvar}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EditorEscalacao({
  api,
  competicaoId,
  prova: p,
  salvar,
}: {
  api: Api;
  competicaoId: string;
  prova: ProvaCompeticao;
  salvar: (c: string, d: object, m?: string) => Promise<void>;
}) {
  const candidatos = useConsulta<Candidato[]>(
    api,
    `/competicoes/${competicaoId}/provas/${p.id}/candidatos`,
  );
  const [selecionados, setSelecionados] = useState<Record<string, number>>({});
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  useEffect(
    () =>
      setSelecionados(
        Object.fromEntries(
          p.escalacao.participantes.map((x) => [x.pessoaId, x.funcao]),
        ),
      ),
    [p.escalacao.participantes],
  );
  async function executar(acao: () => Promise<void>) {
    if (salvando) return;
    setErro("");
    setSalvando(true);
    try {
      await acao();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }
  if (Number(p.escalacao.situacao) === 2)
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Reabrir escalação</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Reabrir escalação?</AlertDialogTitle>
          <AlertDialogDescription>
            A escalação voltará ao estado Rascunho. O acontecimento será
            preservado no histórico e exige motivo.
          </AlertDialogDescription>
          <Formulario
            titulo="Reabrir escalação"
            texto="Confirmar reabertura"
            campos={[
              {
                nome: "motivo",
                rotulo: "Motivo da reabertura",
                obrigatorio: true,
                limite: 500,
              },
            ]}
            salvar={(d) =>
              salvar(`/competicoes/escalacoes/${p.escalacao.id}/reabertura`, {
                versao: p.escalacao.versao,
                motivo: d.motivo,
              })
            }
          />
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancelar</Button>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  const total = Object.keys(selecionados).length;
  const reservas = Object.values(selecionados).filter((x) => x === 2).length;
  return (
    <div className="editor-escalacao">
      <h3>Candidatos aptos e elegíveis</h3>
      <p>
        O servidor já aplicou aptidão, idade e data-base. {total}/
        {p.maximoParticipantes} participantes · {reservas}/{p.maximoReservas}{" "}
        reservas.
      </p>
      <Estado {...candidatos} atualizar={() => undefined} />
      {!candidatos.loading && candidatos.dados?.length === 0 ? (
        <EmptyState title="Nenhum candidato apto e elegível" />
      ) : (
        <ul className="lista-registros">
          {candidatos.dados?.map((c) => (
            <li key={c.pessoaId}>
              <div>
                <strong>{c.nome}</strong>
                <span>{c.faixaEtaria}</span>
                {c.conflitos.map((conflito) => (
                  <small className="aviso-conflito" key={conflito}>
                    {conflito}
                  </small>
                ))}
              </div>
              <label>
                Função
                <select
                  aria-label={`Função de ${c.nome}`}
                  value={selecionados[c.pessoaId] ?? ""}
                  disabled={salvando}
                  onChange={(e) =>
                    setSelecionados((atual) => {
                      const novo = { ...atual };
                      if (!e.target.value) delete novo[c.pessoaId];
                      else novo[c.pessoaId] = Number(e.target.value);
                      return novo;
                    })
                  }
                >
                  <option value="">Não escalado</option>
                  <option value="1">Titular</option>
                  <option value="2">Reserva</option>
                </select>
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="acoes-dominio">
        <Button
          disabled={salvando}
          onClick={() =>
            executar(() =>
              salvar(
                `/competicoes/escalacoes/${p.escalacao.id}`,
                {
                  versao: p.escalacao.versao,
                  participantes: Object.entries(selecionados).map(
                    ([pessoaId, funcao]) => ({ pessoaId, funcao }),
                  ),
                },
                "PUT",
              ),
            )
          }
        >
          Salvar escalação
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={salvando} variant="outline">
              Finalizar escalação
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Finalizar escalação?</AlertDialogTitle>
            <AlertDialogDescription>
              Depois de finalizada, a escalação não poderá ser alterada até uma
              reabertura explícita. Limites e elegibilidade serão validados pelo
              servidor.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="outline">Cancelar</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  onClick={() =>
                    executar(() =>
                      salvar(
                        `/competicoes/escalacoes/${p.escalacao.id}/finalizacao`,
                        { versao: p.escalacao.versao },
                      ),
                    )
                  }
                >
                  <CheckCircle2 aria-hidden="true" /> Confirmar finalização
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {erro && <Alert variant="danger">{erro}</Alert>}
    </div>
  );
}
