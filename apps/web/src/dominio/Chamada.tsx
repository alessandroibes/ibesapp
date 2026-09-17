import { useState } from "react";
import type { components } from "../../../../packages/contracts/api";
import { ClipboardCheck, UserPlus, UsersRound } from "lucide-react";
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
  PageSkeleton,
  Pagination,
} from "../components/ui";
import { type Api, dataBr, useConsulta } from "./api";
import { Formulario } from "./componentes";

export const estadosFrequencia = [
  "Presença com Pontualidade",
  "Presença com Atraso",
  "Falta",
  "Falta Justificada",
];
export function lerRoteiro(texto: string) {
  return texto
    .split("\n")
    .filter((linha) => linha.trim())
    .map((linha) => {
      const [titulo, minutos, ...observacoes] = linha.split("|");
      return {
        titulo: titulo.trim(),
        duracaoMinutos: minutos?.trim() ? Number(minutos) : null,
        observacoes: observacoes.join("|").trim() || null,
      };
    });
}
export function Chamada({
  api,
  reuniaoId,
  registrar,
  editarRoteiro,
}: {
  api: Api;
  reuniaoId: string;
  registrar: boolean;
  editarRoteiro: boolean;
}) {
  const [revisao, setRevisao] = useState(0);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [historicoPessoa, setHistoricoPessoa] = useState("");
  const [aviso, setAviso] = useState("");
  const atualizar = () => setRevisao((valor) => valor + 1);
  const reuniao = useConsulta<components["schemas"]["ReuniaoResponse"]>(
    api,
    "/reunioes/" + reuniaoId,
    revisao,
  );
  const chamada = useConsulta<components["schemas"]["ChamadaResponse"]>(
    api,
    "/reunioes/" +
      reuniaoId +
      "/chamada?busca=" +
      encodeURIComponent(busca) +
      "&pagina=" +
      pagina,
    revisao,
  );
  const historico = useConsulta<
    components["schemas"]["AlteracaoFrequenciaResponse"][]
  >(
    api,
    historicoPessoa
      ? "/reunioes/" +
          reuniaoId +
          "/frequencia/" +
          historicoPessoa +
          "/historico"
      : null,
    revisao,
  );
  async function marcar(
    pessoa: components["schemas"]["PessoaChamada"],
    situacao: number,
  ) {
    if (salvando) return;
    setErro("");
    setAviso("");
    setSalvando(true);
    try {
      await api(
        "/reunioes/" + reuniaoId + "/frequencia/" + pessoa.pessoaId,
        { versao: pessoa.versao, situacao, observacoes: pessoa.observacoes },
        "PUT",
      );
      setAviso(pessoa.nome + ": " + estadosFrequencia[situacao - 1] + ".");
      atualizar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar.");
    } finally {
      setSalvando(false);
    }
  }
  return (
    <section className="chamada-reuniao" aria-label="Chamada da reunião">
      {reuniao.loading && <PageSkeleton label="Carregando reunião" />}
      {reuniao.erro && (
        <Alert variant="danger">
          <AlertDescription>{reuniao.erro}</AlertDescription>
          <Button size="sm" onClick={atualizar}>
            Tentar novamente
          </Button>
        </Alert>
      )}
      {reuniao.dados && (
        <>
          <header className="cabecalho-chamada">
            <div>
              <p className="caminho-interno">Reunião / Chamada</p>
              <h2>{reuniao.dados.titulo}</h2>
              <p>
                {dataBr(reuniao.dados.data)} ·{" "}
                {Number(reuniao.dados.situacao) === 4
                  ? "Cancelada"
                  : "Em operação"}
              </p>
            </div>
            <Badge
              variant={
                Number(reuniao.dados.situacao) === 4 ? "danger" : "success"
              }
            >
              {Number(reuniao.dados.situacao) === 4
                ? "Reunião cancelada"
                : "Chamada aberta"}
            </Badge>
          </header>
          {Number(reuniao.dados.situacao) === 4 && (
            <Alert variant="warning">
              <AlertDescription>
                As frequências permanecem disponíveis como histórico e as
                presenças continuam contando para a primeira reunião.
              </AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Roteiro da reunião</CardTitle>
              <CardDescription>
                O modelo orienta a reunião sem exigir execução rígida.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="roteiro-reuniao">
                {reuniao.dados.roteiro.map((item, indice) => (
                  <li key={indice}>
                    <strong>{item.titulo}</strong>
                    {item.duracaoMinutos != null && (
                      <span>{item.duracaoMinutos} min</span>
                    )}
                    {item.observacoes && <p>{item.observacoes}</p>}
                  </li>
                ))}
              </ol>
              {reuniao.dados.roteiro.length === 0 && (
                <EmptyState
                  title="Reunião sem roteiro"
                  description="A chamada pode ser realizada normalmente."
                />
              )}
              {editarRoteiro && (
                <details>
                  <summary>Editar roteiro desta reunião</summary>
                  <Formulario
                    key={reuniao.dados.versao}
                    titulo="Editar roteiro desta reunião"
                    campos={[
                      {
                        nome: "itens",
                        rotulo:
                          "Um bloco por linha: título | minutos | observações",
                        tipo: "textarea",
                      },
                    ]}
                    iniciais={{
                      itens: reuniao.dados.roteiro
                        .map(
                          (item) =>
                            item.titulo +
                            " | " +
                            (item.duracaoMinutos ?? "") +
                            " | " +
                            (item.observacoes ?? ""),
                        )
                        .join("\n"),
                    }}
                    salvar={async (dados) => {
                      await api(
                        "/reunioes/" + reuniaoId + "/roteiro",
                        {
                          versao: reuniao.dados!.versao,
                          itens: lerRoteiro(dados.itens),
                        },
                        "PUT",
                      );
                      atualizar();
                    }}
                  />
                </details>
              )}
            </CardContent>
          </Card>
        </>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Frequência</CardTitle>
          <CardDescription>
            Sem lançamento não significa falta. Busque um cadastro existente ou
            adicione um visitante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="busca-chamada">
            Buscar pessoa na chamada
            <Input
              id="busca-chamada"
              value={busca}
              onChange={(evento) => {
                setBusca(evento.target.value);
                setPagina(1);
              }}
              maxLength={100}
            />
          </Label>
        </CardContent>
      </Card>
      {chamada.loading && <PageSkeleton label="Carregando chamada" />}
      {chamada.erro && (
        <Alert variant="danger">
          <AlertDescription>{chamada.erro}</AlertDescription>
          <Button size="sm" onClick={atualizar}>
            Tentar novamente
          </Button>
        </Alert>
      )}
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      {aviso && (
        <Alert variant="success">
          <AlertDescription>{aviso}</AlertDescription>
        </Alert>
      )}
      {chamada.dados && (
        <>
          <div className="resumo-chamada">
            {estadosFrequencia.map((estado, indice) => {
              const contagem = chamada.dados!.contagens.find(
                (item) => Number(item.situacao) === indice + 1,
              );
              return (
                <Badge key={estado} variant="neutral">
                  {estado}: {Number(contagem?.quantidade ?? 0)}
                </Badge>
              );
            })}
          </div>
          {chamada.dados.pessoas.length === 0 ? (
            <EmptyState
              icon={<UsersRound aria-hidden="true" />}
              title="Nenhuma pessoa nesta lista"
              description="Ajuste a busca ou cadastre um visitante."
            />
          ) : (
            <div className="grade-pessoas-chamada">
              {chamada.dados.pessoas.map((pessoa) => (
                <article
                  className="cartao-pessoa-chamada"
                  key={pessoa.pessoaId}
                >
                  <div>
                    <h3>{pessoa.nome}</h3>
                    <p>{pessoa.condicao}</p>
                  </div>
                  <Badge variant={pessoa.situacao ? "primary" : "neutral"}>
                    {pessoa.situacao
                      ? estadosFrequencia[Number(pessoa.situacao) - 1]
                      : "Sem lançamento"}
                  </Badge>
                  {registrar && (
                    <div
                      className="botoes-chamada"
                      role="group"
                      aria-label={"Frequência de " + pessoa.nome}
                    >
                      {estadosFrequencia.map((estado, indice) => (
                        <Button
                          key={estado}
                          disabled={salvando}
                          aria-pressed={Number(pessoa.situacao) === indice + 1}
                          variant={
                            Number(pessoa.situacao) === indice + 1
                              ? "default"
                              : "outline"
                          }
                          onClick={() => void marcar(pessoa, indice + 1)}
                        >
                          {estado}
                        </Button>
                      ))}
                    </div>
                  )}
                  {pessoa.frequenciaId && (
                    <div className="acoes-pessoa-chamada">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoricoPessoa(pessoa.pessoaId)}
                      >
                        Ver histórico
                      </Button>
                      {registrar && (
                        <details>
                          <summary>Observação ou justificativa</summary>
                          <Formulario
                            titulo={"Observação de " + pessoa.nome}
                            campos={[
                              {
                                nome: "observacoes",
                                rotulo: "Observação",
                                tipo: "textarea",
                                limite: 1000,
                              },
                            ]}
                            iniciais={{ observacoes: pessoa.observacoes }}
                            salvar={async (dados) => {
                              await api(
                                "/reunioes/" +
                                  reuniaoId +
                                  "/frequencia/" +
                                  pessoa.pessoaId,
                                {
                                  versao: pessoa.versao,
                                  situacao: pessoa.situacao,
                                  observacoes: dados.observacoes || null,
                                },
                                "PUT",
                              );
                              atualizar();
                            }}
                          />
                        </details>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
          <Pagination
            page={pagina}
            canPrevious={pagina > 1}
            canNext={pagina * 30 < Number(chamada.dados.total)}
            onPrevious={() => setPagina((valor) => valor - 1)}
            onNext={() => setPagina((valor) => valor + 1)}
          />
        </>
      )}
      {registrar && (
        <Card>
          <CardHeader>
            <CardTitle>
              <UserPlus aria-hidden="true" /> Cadastrar visitante
            </CardTitle>
            <CardDescription>
              Pesquise antes para evitar duplicidade. O cadastro não cria
              candidatura nem presume presença.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Formulario
              titulo="Novo visitante"
              campos={[
                {
                  nome: "nome",
                  rotulo: "Nome do visitante",
                  obrigatorio: true,
                },
              ]}
              salvar={async (dados) => {
                await api("/reunioes/" + reuniaoId + "/visitantes", dados);
                setBusca(dados.nome);
                setPagina(1);
                atualizar();
              }}
            />
          </CardContent>
        </Card>
      )}
      {historicoPessoa && (
        <section className="historico-chamada">
          <h3>
            <ClipboardCheck aria-hidden="true" /> Histórico da frequência
          </h3>
          {historico.loading && <PageSkeleton label="Carregando histórico" />}
          {historico.erro && (
            <Alert variant="danger">
              <AlertDescription>{historico.erro}</AlertDescription>
            </Alert>
          )}
          <ol>
            {historico.dados?.map((item) => (
              <li key={item.id}>
                {new Date(item.createdAt).toLocaleString("pt-BR")} ·{" "}
                {item.situacaoAnterior
                  ? estadosFrequencia[Number(item.situacaoAnterior) - 1]
                  : "Sem lançamento"}{" "}
                → {estadosFrequencia[Number(item.situacao) - 1]}{" "}
                {item.observacoes}
              </li>
            ))}
          </ol>
          <Button variant="outline" onClick={() => setHistoricoPessoa("")}>
            Fechar histórico
          </Button>
        </section>
      )}
    </section>
  );
}
