import { useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import type { components } from "../../../../packages/contracts/api";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
} from "../components/ui";
import { type Api, dataBr, useConsulta } from "./api";
import { Estado, Formulario } from "./componentes";

type E = components["schemas"];

export function Instituicao({ api, editar }: { api: Api; editar: boolean }) {
  const [revisao, setRevisao] = useState(0);
  const atualizar = () => setRevisao((valor) => valor + 1);
  const instituicao = useConsulta<E["EmbaixadaResponse"]>(
    api,
    "/embaixada",
    revisao,
  );
  const salvar = async (caminho: string, dados: object, metodo = "POST") => {
    await api(caminho, dados, metodo);
    atualizar();
  };
  return (
    <div className="modulo-administrativo">
      <Estado {...instituicao} atualizar={atualizar} />
      {instituicao.dados && (
        <Routes>
          <Route
            index
            element={<Resumo i={instituicao.dados} editar={editar} />}
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

function Resumo({ i, editar }: { i: E["EmbaixadaResponse"]; editar: boolean }) {
  return (
    <>
      <PageHeader
        title="Igreja e Embaixada"
        description="Dados institucionais da Igreja e de sua Embaixada."
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
            salvar={(dados) =>
              salvar(
                "/embaixada",
                {
                  ...dados,
                  dataFundacao: dados.dataFundacao || null,
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
