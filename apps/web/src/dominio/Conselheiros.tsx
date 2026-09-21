import { useState } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
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
} from "../components/ui";
import { type Api, dataBr, hoje, useConsulta } from "./api";
import {
  Estado,
  Formulario,
  FormularioDialogo,
  SeletorPessoa,
} from "./componentes";

type E = components["schemas"];
type Conselheiro = E["ConselheiroResponse"];

export function Conselheiros({
  api,
  editar,
  podeConsultarPessoas,
}: {
  api: Api;
  editar: boolean;
  podeConsultarPessoas: boolean;
}) {
  const [revisao, setRevisao] = useState(0);
  return (
    <Routes>
      <Route
        index
        element={
          <Lista
            api={api}
            editar={editar && podeConsultarPessoas}
            revisao={revisao}
            atualizar={() => setRevisao((v) => v + 1)}
          />
        }
      />
      <Route
        path=":id"
        element={
          <Detalhe
            api={api}
            editar={editar}
            podeConsultarPessoas={podeConsultarPessoas}
            atualizar={() => setRevisao((v) => v + 1)}
          />
        }
      />
      <Route path="*" element={<Navigate to="/conselheiros" replace />} />
    </Routes>
  );
}

function Lista({
  api,
  editar,
  revisao,
  atualizar,
}: {
  api: Api;
  editar: boolean;
  revisao: number;
  atualizar: () => void;
}) {
  const consulta = useConsulta<Conselheiro[]>(
    api,
    "/embaixada/conselheiros",
    revisao,
  );
  const vigentes =
    consulta.dados?.filter((item) => !item.dataFim && item.pessoaAtiva) ?? [];
  const historicos =
    consulta.dados?.filter((item) => item.dataFim || !item.pessoaAtiva) ?? [];
  const contas = useConsulta<E["ContaResponse"][]>(
    api,
    editar ? "/embaixada/contas" : null,
    revisao,
  );
  const cadastrar = async (dados: Record<string, string>) => {
    const pessoa = await api<E["PessoaResponse"]>(`/pessoas/${dados.pessoaId}`);
    await api("/embaixada/conselheiros", {
      pessoaId: dados.pessoaId,
      versaoPessoa: pessoa.versao,
      usuarioId: dados.usuarioId || null,
      dataInicio: dados.dataInicio,
    });
    atualizar();
  };
  return (
    <>
      <PageHeader
        title="Conselheiros"
        description="Adultos responsáveis pela Embaixada, em um fluxo separado dos meninos."
        breadcrumbs={[{ label: "Conselheiros" }]}
        actions={
          editar && (
            <FormularioDialogo
              titulo="Cadastrar Conselheiro"
              descricao="Vincule uma Pessoa adulta à Embaixada."
              gatilho="Cadastrar Conselheiro"
            >
              <Formulario
                titulo="Novo Conselheiro"
                iniciais={{ dataInicio: hoje() }}
                campos={[
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
                    opcoes: (contas.dados ?? []).map((c) => ({
                      valor: c.id,
                      rotulo: c.email,
                    })),
                  },
                ]}
                salvar={cadastrar}
              >
                <SeletorPessoa api={api} />
              </Formulario>
            </FormularioDialogo>
          )
        }
      />
      <Estado {...consulta} atualizar={atualizar} />
      {consulta.dados && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Conselheiros vigentes</CardTitle>
              <CardDescription>
                O vínculo não concede permissões automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vigentes.length === 0 ? (
                <EmptyState
                  title="Nenhum Conselheiro vigente"
                  description="Cadastre o vínculo de uma Pessoa adulta para começar."
                />
              ) : (
                <ul className="lista-registros">
                  {vigentes.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.nome}</strong>
                        <span>Desde {dataBr(item.dataInicio)}</span>
                      </div>
                      <Button asChild variant="outline">
                        <Link to={`/conselheiros/${item.id}`}>Visualizar</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          {historicos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="lista-registros">
                  {historicos.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.nome}</strong>
                        <span>
                          {item.dataFim
                            ? `${dataBr(item.dataInicio)} a ${dataBr(item.dataFim)}`
                            : "Pessoa inativa"}
                        </span>
                      </div>
                      <Button asChild variant="outline">
                        <Link to={`/conselheiros/${item.id}`}>Visualizar</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}

function Detalhe({
  api,
  editar,
  podeConsultarPessoas,
  atualizar,
}: {
  api: Api;
  editar: boolean;
  podeConsultarPessoas: boolean;
  atualizar: () => void;
}) {
  const { id } = useParams();
  const [revisao, setRevisao] = useState(0);
  const consulta = useConsulta<Conselheiro>(
    api,
    id ? `/embaixada/conselheiros/${id}` : null,
    revisao,
  );
  const item = consulta.dados;
  const recarregar = () => {
    setRevisao((v) => v + 1);
    atualizar();
  };
  return (
    <>
      <Estado {...consulta} atualizar={recarregar} />
      {item && (
        <>
          <PageHeader
            title={item.nome}
            description="Cadastro simples de Conselheiro da Embaixada."
            breadcrumbs={[
              { label: "Conselheiros", href: "/conselheiros" },
              { label: item.nome },
            ]}
            actions={
              <div className="acoes-pagina">
                {editar && podeConsultarPessoas && (
                  <Button asChild variant="outline">
                    <Link
                      to={`/pessoas/${item.pessoaId}/editar?origem=conselheiros`}
                    >
                      Editar dados pessoais
                    </Link>
                  </Button>
                )}
                {editar && !item.dataFim && (
                  <FormularioDialogo
                    titulo="Encerrar vínculo"
                    descricao="O vínculo continuará disponível no histórico."
                    gatilho="Encerrar vínculo"
                  >
                    <Formulario
                      titulo={`Encerrar vínculo de ${item.nome}`}
                      texto="Encerrar vínculo"
                      iniciais={{ dataFim: hoje() }}
                      campos={[
                        {
                          nome: "dataFim",
                          rotulo: "Data de encerramento",
                          tipo: "date",
                          obrigatorio: true,
                        },
                      ]}
                      salvar={async (dados) => {
                        await api(
                          `/embaixada/conselheiros/${item.id}/encerramento`,
                          { ...dados, versao: item.versao },
                        );
                        recarregar();
                      }}
                    />
                  </FormularioDialogo>
                )}
              </div>
            }
          />
          <Card>
            <CardHeader>
              <CardTitle>Vínculo com a Embaixada</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="lista-definicoes">
                <div>
                  <dt>Situação</dt>
                  <dd>
                    <Badge
                      variant={
                        item.dataFim || !item.pessoaAtiva
                          ? "neutral"
                          : "success"
                      }
                    >
                      {item.dataFim
                        ? "Encerrado"
                        : item.pessoaAtiva
                          ? "Vigente"
                          : "Pessoa inativa"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt>Início</dt>
                  <dd>{dataBr(item.dataInicio)}</dd>
                </div>
                <div>
                  <dt>Encerramento</dt>
                  <dd>{dataBr(item.dataFim)}</dd>
                </div>
                <div>
                  <dt>Conta de acesso</dt>
                  <dd>{item.usuarioId ? "Vinculada" : "Não vinculada"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          {item.possuiJornada && podeConsultarPessoas && (
            <Card>
              <CardHeader>
                <CardTitle>Trajetória ER histórica</CardTitle>
                <CardDescription>
                  A trajetória anterior permanece somente para consulta e não
                  habilita progressão adulta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link
                    to={`/pessoas/${item.pessoaId}?aba=jornada&origem=conselheiros`}
                  >
                    Consultar trajetória histórica
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}
