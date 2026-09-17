import { useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
} from "../components/ui";
import { type Api, dataBr, hoje, useConsulta } from "./api";
import { EstadoConsultas, Formulario } from "./componentes";

type Referencia = { id: string; nome: string };
type Referencias = { pessoas: Referencia[]; atividades: Referencia[] };
type Anexo = {
  id: string;
  versao: string;
  nomeArquivo: string;
  tipoConteudo: string;
  descricao?: string;
  tamanho: number;
};
type Marco = {
  id: string;
  versao: string;
  dataInicio: string;
  dataFim?: string;
  titulo: string;
  descricao: string;
  categoria: string;
  atividadeAgendaId?: string;
  atividade?: string;
  autor: string;
  pessoas: Referencia[];
  anexos: Anexo[];
};
const categorias = [
  "Fundação",
  "Diretoria",
  "Cerimônia",
  "Acampamento",
  "Competição",
  "Premiação",
  "Projeto",
  "Missões",
  "Aniversário",
  "Outro",
];

export function AcervoHistorico({
  api,
  igrejaId,
  gerenciar,
}: {
  api: Api;
  igrejaId: string;
  gerenciar: boolean;
}) {
  const [revisao, setRevisao] = useState(0);
  const [filtros, setFiltros] = useSearchParams();
  const ano = filtros.get("ano") ?? "";
  const categoria = filtros.get("categoria") ?? "";
  const alterarFiltro = (nome: string, valor: string) => {
    const seguintes = new URLSearchParams(filtros);
    if (valor) seguintes.set(nome, valor);
    else seguintes.delete(nome);
    setFiltros(seguintes, { replace: true });
  };
  const [anexando, setAnexando] = useState<{ marco: Marco; anexo?: Anexo }>();
  const [erroAnexo, setErroAnexo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucessoAnexo, setSucessoAnexo] = useState("");
  const [confirmacao, setConfirmacao] = useState<{
    marco: Marco;
    anexo?: Anexo;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const atualizar = () => setRevisao((x) => x + 1);
  const query = new URLSearchParams();
  if (ano) query.set("ano", ano);
  if (categoria) query.set("categoria", categoria);
  query.set("ordemCrescente", "true");
  const referencias = useConsulta<Referencias>(
    api,
    "/acervo-historico/referencias",
    revisao,
  );
  const marcos = useConsulta<Marco[]>(
    api,
    `/acervo-historico/marcos?${query}`,
    revisao,
  );
  async function excluir(marco: Marco) {
    await api(
      `/acervo-historico/marcos/${marco.id}?versao=${marco.versao}`,
      {},
      "DELETE",
    );
    setConfirmacao(undefined);
    atualizar();
    navigate("/acervo");
  }
  async function excluirAnexo(marco: Marco, anexo: Anexo) {
    await api(
      `/acervo-historico/marcos/${marco.id}/anexos/${anexo.id}?versao=${anexo.versao}`,
      {},
      "DELETE",
    );
    setConfirmacao(undefined);
    atualizar();
  }
  async function baixar(marco: Marco, anexo: Anexo) {
    const r = await fetch(
      `/api/v1/acervo-historico/marcos/${marco.id}/anexos/${anexo.id}`,
      { headers: { "X-Igreja-Id": igrejaId } },
    );
    if (!r.ok) throw new Error("Não foi possível baixar o anexo.");
    const url = URL.createObjectURL(await r.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = anexo.nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function enviarAnexo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!anexando) return;
    setErroAnexo("");
    setSucessoAnexo("");
    setEnviando(true);
    const form = new FormData(e.currentTarget);
    form.set("versao", anexando.anexo?.versao ?? anexando.marco.versao);
    const caminho = `/acervo-historico/marcos/${anexando.marco.id}/anexos${anexando.anexo ? `/${anexando.anexo.id}` : ""}`;
    try {
      await api(caminho, form, anexando.anexo ? "PUT" : "POST");
      setSucessoAnexo(
        anexando.anexo
          ? "Anexo substituído com sucesso."
          : "Anexo enviado com sucesso.",
      );
      setAnexando(undefined);
      atualizar();
    } catch (error) {
      setErroAnexo(
        error instanceof Error ? error.message : "Não foi possível anexar.",
      );
    } finally {
      setEnviando(false);
    }
  }
  const partes = location.pathname.split("/").filter(Boolean);
  const idRota = partes[1];
  const marcoRota = marcos.dados?.find((x) => x.id === idRota);
  const emFormulario = idRota === "novo" || partes[2] === "editar";
  if (marcos.dados && (emFormulario || marcoRota))
    return (
      <section className="modulo-administrativo">
        <PageHeader
          title={
            emFormulario
              ? marcoRota
                ? "Editar marco histórico"
                : "Novo marco histórico"
              : marcoRota!.titulo
          }
          description={
            emFormulario
              ? "Registre a memória institucional e seus vínculos."
              : `${dataBr(marcoRota!.dataInicio)} · ${marcoRota!.categoria}`
          }
          breadcrumbs={[
            { label: "Acervo histórico", href: "/acervo" },
            { label: emFormulario ? "Edição" : marcoRota!.titulo },
          ]}
          actions={
            <Button asChild variant="outline">
              <Link to="/acervo">Voltar</Link>
            </Button>
          }
        />
        {emFormulario ? (
          <Card>
            <CardContent>
              <FormularioMarco
                marco={marcoRota}
                referencias={referencias.dados}
                api={api}
                aoSalvar={() => {
                  atualizar();
                  navigate("/acervo");
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <DetalheMarco
            marco={marcoRota!}
            gerenciar={gerenciar}
            baixar={baixar}
            anexar={setAnexando}
            editar={() => navigate(`/acervo/${marcoRota!.id}/editar`)}
            confirmar={setConfirmacao}
          />
        )}
        {sucessoAnexo && <p role="status">{sucessoAnexo}</p>}
        {anexando && (
          <FormularioAnexo
            anexando={anexando}
            enviando={enviando}
            erro={erroAnexo}
            enviar={enviarAnexo}
            cancelar={() => setAnexando(undefined)}
          />
        )}
        <ConfirmarRemocao
          valor={confirmacao}
          fechar={() => setConfirmacao(undefined)}
          confirmar={() =>
            confirmacao?.anexo
              ? excluirAnexo(confirmacao.marco, confirmacao.anexo)
              : confirmacao && excluir(confirmacao.marco)
          }
        />
      </section>
    );
  return (
    <section className="modulo-administrativo" aria-label="Acervo histórico">
      <PageHeader
        title="Acervo histórico"
        description="Memória institucional organizada em uma linha do tempo."
        breadcrumbs={[{ label: "Acervo histórico" }]}
        actions={
          gerenciar && (
            <Button asChild>
              <Link to="/acervo/novo">Novo marco</Link>
            </Button>
          )
        }
      />
      <EstadoConsultas
        consultas={[referencias, marcos]}
        atualizar={atualizar}
      />
      <div className="acoes-dominio">
        <label>
          Ano
          <input
            type="number"
            min="1"
            max="9999"
            value={ano}
            onChange={(e) => alterarFiltro("ano", e.target.value)}
          />
        </label>
        <label>
          Categoria
          <select
            value={categoria}
            onChange={(e) => alterarFiltro("categoria", e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      {!marcos.loading && !marcos.erro && marcos.dados?.length === 0 && (
        <EmptyState
          title="Nenhum marco encontrado"
          description="Altere os filtros ou registre um marco histórico."
        />
      )}
      <ol className="linha-tempo">
        {marcos.dados?.map((x) => (
          <li key={x.id}>
            <article>
              <time>
                {dataBr(x.dataInicio)}
                {x.dataFim ? ` a ${dataBr(x.dataFim)}` : ""}
              </time>
              <h3>{x.titulo}</h3>
              <Badge>{x.categoria}</Badge>
              <p>{x.descricao}</p>
              <small>
                Autoria: {x.autor}
                {x.atividade ? ` · ${x.atividade}` : ""}
                {x.pessoas.length
                  ? ` · ${x.pessoas.map((p) => p.nome).join(", ")}`
                  : ""}
              </small>
              <Button asChild variant="outline">
                <Link to={`/acervo/${x.id}`}>Ver detalhes</Link>
              </Button>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

function FormularioMarco({
  marco,
  referencias,
  api,
  aoSalvar,
}: {
  marco?: Marco;
  referencias?: Referencias;
  api: Api;
  aoSalvar: () => void;
}) {
  const [pessoas, setPessoas] = useState<string[]>(
    marco?.pessoas.map((p) => p.id) ?? [],
  );
  return (
    <Formulario
      titulo="Dados do marco"
      texto={marco ? "Salvar alterações" : "Registrar marco"}
      iniciais={marco ?? { dataInicio: hoje() }}
      campos={[
        {
          nome: "dataInicio",
          rotulo: "Data inicial",
          tipo: "date",
          obrigatorio: true,
        },
        { nome: "dataFim", rotulo: "Data final", tipo: "date" },
        { nome: "titulo", rotulo: "Título", obrigatorio: true },
        {
          nome: "categoria",
          rotulo: "Categoria",
          tipo: "select",
          obrigatorio: true,
          opcoes: categorias.map((x) => ({ valor: x, rotulo: x })),
        },
        {
          nome: "descricao",
          rotulo: "Descrição",
          tipo: "textarea",
          obrigatorio: true,
          limite: 10000,
        },
        {
          nome: "atividadeAgendaId",
          rotulo: "Atividade relacionada",
          tipo: "select",
          opcoes:
            referencias?.atividades.map((x) => ({
              valor: x.id,
              rotulo: x.nome,
            })) ?? [],
        },
      ]}
      salvar={async (d) => {
        const dados = {
          ...d,
          dataFim: d.dataFim || null,
          atividadeAgendaId: d.atividadeAgendaId || null,
          pessoaIds: pessoas,
        };
        if (marco)
          await api(
            `/acervo-historico/marcos/${marco.id}`,
            { ...dados, versao: marco.versao },
            "PUT",
          );
        else await api("/acervo-historico/marcos", dados);
        aoSalvar();
      }}
    >
      <fieldset>
        <legend>Pessoas relacionadas</legend>
        {referencias?.pessoas.map((p) => (
          <label key={p.id}>
            <input
              type="checkbox"
              checked={pessoas.includes(p.id)}
              onChange={(e) =>
                setPessoas((a) =>
                  e.target.checked ? [...a, p.id] : a.filter((x) => x !== p.id),
                )
              }
            />
            {p.nome}
          </label>
        ))}
      </fieldset>
    </Formulario>
  );
}

function DetalheMarco({
  marco,
  gerenciar,
  baixar,
  anexar,
  editar,
  confirmar,
}: {
  marco: Marco;
  gerenciar: boolean;
  baixar: (m: Marco, a: Anexo) => Promise<void>;
  anexar: (v: { marco: Marco; anexo?: Anexo }) => void;
  editar: () => void;
  confirmar: (v: { marco: Marco; anexo?: Anexo }) => void;
}) {
  return (
    <div className="grade-detalhes">
      <Card>
        <CardHeader>
          <CardTitle>Registro histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{marco.descricao}</p>
          <dl className="dados-estruturados">
            <div>
              <dt>Autoria</dt>
              <dd>{marco.autor}</dd>
            </div>
            <div>
              <dt>Atividade</dt>
              <dd>{marco.atividade || "Não relacionada"}</dd>
            </div>
            <div>
              <dt>Pessoas</dt>
              <dd>
                {marco.pessoas.map((p) => p.nome).join(", ") ||
                  "Nenhuma pessoa relacionada"}
              </dd>
            </div>
          </dl>
          {gerenciar && (
            <div className="acoes-dominio">
              <Button onClick={editar}>Editar</Button>
              <Button
                variant="destructive"
                onClick={() => confirmar({ marco })}
              >
                Excluir
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Fotos e documentos</CardTitle>
        </CardHeader>
        <CardContent>
          {marco.anexos.length === 0 ? (
            <EmptyState title="Nenhum anexo" />
          ) : (
            marco.anexos.map((a) => (
              <div className="item-anexo" key={a.id}>
                <div>
                  <strong>{a.nomeArquivo}</strong>
                  <small>
                    {a.tipoConteudo} · {formatarTamanho(a.tamanho)}
                  </small>
                </div>
                <div className="acoes-dominio">
                  <Button
                    variant="outline"
                    onClick={() => void baixar(marco, a)}
                  >
                    Baixar
                  </Button>
                  {gerenciar && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => anexar({ marco, anexo: a })}
                      >
                        Substituir
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => confirmar({ marco, anexo: a })}
                      >
                        Remover
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
          {gerenciar && (
            <Button onClick={() => anexar({ marco })}>Adicionar anexo</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
const formatarTamanho = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1048576
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1048576).toFixed(1)} MB`;
function ConfirmarRemocao({
  valor,
  fechar,
  confirmar,
}: {
  valor?: { marco: Marco; anexo?: Anexo };
  fechar: () => void;
  confirmar: () => void;
}) {
  return (
    <AlertDialog open={Boolean(valor)} onOpenChange={(a) => !a && fechar()}>
      <AlertDialogContent>
        <AlertDialogTitle>
          {valor?.anexo ? "Remover anexo?" : "Excluir marco histórico?"}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {valor?.anexo
            ? `O arquivo “${valor.anexo.nomeArquivo}” será removido de “${valor.marco.titulo}”.`
            : `O marco “${valor?.marco.titulo}” e todos os seus anexos serão excluídos.`}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={confirmar}>
              Confirmar remoção
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FormularioAnexo({
  anexando,
  enviando,
  erro,
  enviar,
  cancelar,
}: {
  anexando: { marco: Marco; anexo?: Anexo };
  enviando: boolean;
  erro: string;
  enviar: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  cancelar: () => void;
}) {
  return (
    <form aria-label="Anexar foto ou documento" onSubmit={enviar}>
      <fieldset>
        <legend>
          {anexando.anexo ? "Substituir anexo" : "Anexar"} em{" "}
          {anexando.marco.titulo}
        </legend>
        <label>
          Arquivo *
          <input
            name="arquivo"
            type="file"
            accept="image/png,image/jpeg,application/pdf"
            required
          />
        </label>
        <label>
          Descrição
          <input
            name="descricao"
            maxLength={500}
            defaultValue={anexando.anexo?.descricao}
          />
        </label>
        <Button type="submit" disabled={enviando}>
          {enviando
            ? "Enviando…"
            : anexando.anexo
              ? "Salvar anexo"
              : "Enviar anexo"}
        </Button>
        <Button type="button" variant="outline" onClick={cancelar}>
          Cancelar
        </Button>
      </fieldset>
      {erro && <p role="alert">{erro}</p>}
    </form>
  );
}
