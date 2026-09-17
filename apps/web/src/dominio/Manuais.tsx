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
import { type Api, useConsulta } from "./api";
import { Estado, Formulario } from "./componentes";
type Manual = components["schemas"]["ManualResponse"];
export function Manuais({ api, editar }: { api: Api; editar: boolean }) {
  const [revisao, setRevisao] = useState(0);
  const manuais = useConsulta<Manual[]>(api, "/manuais", revisao);
  const conhecidas = useConsulta<Record<string, string[]>>(
    api,
    editar ? "/manuais/tarefas-conhecidas" : null,
    revisao,
  );
  return (
    <div className="modulo-administrativo">
      <Estado {...manuais} atualizar={() => setRevisao((r) => r + 1)} />
      {manuais.dados && (
        <Routes>
          <Route
            index
            element={<Lista manuais={manuais.dados} editar={editar} />}
          />
          <Route
            path="nova"
            element={
              editar ? (
                <Novo
                  api={api}
                  conhecidas={conhecidas.dados ?? {}}
                  atualizar={() => setRevisao((r) => r + 1)}
                />
              ) : (
                <Navigate to="/manuais" />
              )
            }
          />
          <Route
            path=":manualId"
            element={<Detalhe manuais={manuais.dados} />}
          />
        </Routes>
      )}
    </div>
  );
}
function Lista({ manuais, editar }: { manuais: Manual[]; editar: boolean }) {
  return (
    <>
      <PageHeader
        title="Manuais e versões"
        description="Edições identificadas e tarefas versionadas usadas na jornada educacional."
        breadcrumbs={[{ label: "Manuais" }]}
        actions={
          editar && (
            <Button asChild>
              <Link to="/manuais/nova">Cadastrar versão</Link>
            </Button>
          )
        }
      />
      {manuais.length === 0 ? (
        <EmptyState
          title="Nenhuma versão cadastrada"
          description="Nenhuma edição foi presumida para os manuais conhecidos."
        />
      ) : (
        <div className="grade-listagem">
          {manuais.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <div className="linha-titulo">
                  <CardTitle>{m.nomePosto}</CardTitle>
                  <Badge variant="primary">Versão registrada</Badge>
                </div>
                <CardDescription>{m.identificacao}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{m.tarefas.length} tarefas versionadas</p>
                <Button asChild variant="outline">
                  <Link to={`/manuais/${m.id}`}>Ver tarefas</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Embaixador Emérito</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            O ingresso é registrado após a conclusão do Sênior. Manual e tarefas
            aguardam definição e não foram presumidos.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
function Detalhe({ manuais }: { manuais: Manual[] }) {
  const { manualId } = useParams();
  const m = manuais.find((x) => x.id === manualId);
  if (!m) return <EmptyState title="Manual não encontrado" />;
  return (
    <>
      <PageHeader
        title={m.nomePosto}
        description={m.identificacao}
        breadcrumbs={[
          { label: "Manuais", href: "/manuais" },
          { label: m.identificacao },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link to="/manuais">Voltar</Link>
          </Button>
        }
        meta={<Badge variant="primary">Versão histórica fixa na jornada</Badge>}
      />
      <Card>
        <CardHeader>
          <CardTitle>Tarefas</CardTitle>
          <CardDescription>
            Podem ser concluídas em qualquer ordem. Não há páginas, checklist ou
            conteúdo detalhado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="lista-tarefas">
            {m.tarefas.map((t, i) => (
              <li key={t.id}>
                <span>{i + 1}</span>
                {t.nome}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </>
  );
}
function Novo({
  api,
  conhecidas,
  atualizar,
}: {
  api: Api;
  conhecidas: Record<string, string[]>;
  atualizar: () => void;
}) {
  const [posto, setPosto] = useState("1");
  const chave = { "1": "Escudeiro", "2": "Arauto", "3": "Senior" }[posto]!;
  return (
    <>
      <PageHeader
        title="Cadastrar versão do manual"
        description="Informe a identificação exata e as tarefas desta edição."
        breadcrumbs={[
          { label: "Manuais", href: "/manuais" },
          { label: "Nova versão" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link to="/manuais">Cancelar</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <label>
            Posto do manual
            <select value={posto} onChange={(e) => setPosto(e.target.value)}>
              <option value="1">Embaixador Escudeiro</option>
              <option value="2">Embaixador Arauto</option>
              <option value="3">Embaixador Sênior</option>
            </select>
          </label>
          <Formulario
            key={posto}
            titulo="Nova versão do manual"
            campos={[
              {
                nome: "identificacao",
                rotulo: "Identificação exata da edição",
                obrigatorio: true,
                limite: 150,
              },
              {
                nome: "tarefas",
                rotulo: "Tarefas, uma por linha",
                tipo: "textarea",
                obrigatorio: true,
                limite: 100000,
              },
            ]}
            iniciais={{ tarefas: conhecidas[chave]?.join("\n") }}
            salvar={async (d) => {
              await api("/manuais/versoes", {
                posto: Number(posto),
                identificacao: d.identificacao,
                tarefas: d.tarefas
                  .split("\n")
                  .map((t) => t.trim())
                  .filter(Boolean),
              });
              atualizar();
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
