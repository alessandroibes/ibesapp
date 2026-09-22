import { useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
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
            element={<Detalhe manuais={manuais.dados} editar={editar} />}
          />
          <Route
            path=":manualId/editar"
            element={
              editar ? (
                <Editar
                  api={api}
                  manuais={manuais.dados}
                  atualizar={() => setRevisao((r) => r + 1)}
                />
              ) : (
                <Navigate to="/manuais" />
              )
            }
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
                <p>{m.tarefas.length} tarefas aplicáveis</p>
                {m.emUso ? (
                  <p className="descricao-secundaria">
                    Em uso: {m.postosEmAndamento} posto(s) em andamento e{" "}
                    {m.postosConcluidos} concluído(s).
                  </p>
                ) : (
                  <p className="descricao-secundaria">
                    Ainda não utilizada em jornadas.
                  </p>
                )}
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
function Detalhe({ manuais, editar }: { manuais: Manual[]; editar: boolean }) {
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
          <>
            <Button asChild variant="outline">
              <Link to="/manuais">Voltar</Link>
            </Button>
            {editar && (
              <Button asChild>
                <Link to={`/manuais/${m.id}/editar`}>Editar versão</Link>
              </Button>
            )}
          </>
        }
        meta={
          <Badge variant={m.emUso ? "primary" : "neutral"}>
            {m.emUso ? "Versão usada em jornadas" : "Versão ainda não usada"}
          </Badge>
        }
      />
      <Card>
        <CardContent>
          <p>
            <strong>Manual do Posto:</strong> define a titulação educacional{" "}
            {m.nomePosto}. <strong>Versão identificada:</strong> é esta edição
            específica, “{m.identificacao}”. Corrigir a versão não troca a
            versão já vinculada à jornada.
          </p>
          {m.emUso && (
            <p className="descricao-secundaria">
              As alterações de tarefas alcançam {m.postosEmAndamento} posto(s)
              em andamento. Postos concluídos preservam suas tarefas e
              conclusões.
            </p>
          )}
        </CardContent>
      </Card>
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
            {m.tarefas.map((t) => (
              <li key={t.id}>
                <span>{t.numero}</span>
                Tarefa {t.numero}: {t.nome}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </>
  );
}
function Editar({
  api,
  manuais,
  atualizar,
}: {
  api: Api;
  manuais: Manual[];
  atualizar: () => void;
}) {
  const { manualId } = useParams();
  const navegar = useNavigate();
  const manual = manuais.find((item) => item.id === manualId);
  const [identificacao, setIdentificacao] = useState(
    manual?.identificacao ?? "",
  );
  const [tarefas, setTarefas] = useState<{ id?: string; nome: string }[]>(
    () => manual?.tarefas.map((t) => ({ id: t.id, nome: t.nome })) ?? [],
  );
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  if (!manual) return <EmptyState title="Manual não encontrado" />;
  const mover = (indice: number, direcao: -1 | 1) =>
    setTarefas((atuais) => {
      const destino = indice + direcao;
      if (destino < 0 || destino >= atuais.length) return atuais;
      const proxima = [...atuais];
      [proxima[indice], proxima[destino]] = [proxima[destino], proxima[indice]];
      return proxima;
    });
  return (
    <>
      <PageHeader
        title={`Editar versão: ${manual.nomePosto}`}
        description="Corrija a identificação, os textos e a ordem. A versão continua a mesma nas jornadas."
        breadcrumbs={[
          { label: "Manuais", href: "/manuais" },
          { label: manual.identificacao, href: `/manuais/${manual.id}` },
          { label: "Editar" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link to={`/manuais/${manual.id}`}>Cancelar</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Manual do Posto: {manual.nomePosto}</CardTitle>
          <CardDescription>
            O posto não pode ser alterado. A versão identificada pode ser
            corrigida diretamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            aria-label="Editar versão do manual"
            className="formulario"
            onSubmit={async (evento) => {
              evento.preventDefault();
              setErro("");
              setSalvando(true);
              try {
                await api(`/manuais/versoes/${manual.id}`, {
                  versao: manual.versao,
                  identificacao,
                  tarefas,
                });
                atualizar();
                navegar(`/manuais/${manual.id}`);
              } catch (falha) {
                setErro((falha as Error).message);
              } finally {
                setSalvando(false);
              }
            }}
          >
            <label>
              Identificação da versão
              <input
                required
                maxLength={150}
                value={identificacao}
                onChange={(e) => setIdentificacao(e.target.value)}
              />
            </label>
            <fieldset>
              <legend>Tarefas aplicáveis aos postos em andamento</legend>
              <p className="descricao-secundaria">
                Remover uma tarefa também remove sua conclusão somente dos
                postos em andamento. Postos concluídos não são recalculados.
              </p>
              <ol className="lista-tarefas lista-edicao-tarefas">
                {tarefas.map((tarefa, indice) => (
                  <li key={tarefa.id ?? `nova-${indice}`}>
                    <span>{indice + 1}</span>
                    <input
                      aria-label={`Tarefa ${indice + 1}`}
                      required
                      maxLength={500}
                      value={tarefa.nome}
                      onChange={(e) =>
                        setTarefas((atuais) =>
                          atuais.map((item, posicao) =>
                            posicao === indice
                              ? { ...item, nome: e.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => mover(indice, -1)}
                      disabled={indice === 0}
                    >
                      Subir
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => mover(indice, 1)}
                      disabled={indice === tarefas.length - 1}
                    >
                      Descer
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() =>
                        setTarefas((atuais) =>
                          atuais.filter((_, posicao) => posicao !== indice),
                        )
                      }
                      disabled={tarefas.length === 1}
                    >
                      Remover
                    </Button>
                  </li>
                ))}
              </ol>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setTarefas((atuais) => [...atuais, { nome: "" }])
                }
              >
                Adicionar tarefa
              </Button>
            </fieldset>
            {erro && <p role="alert">{erro}</p>}
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar correções"}
            </Button>
          </form>
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
