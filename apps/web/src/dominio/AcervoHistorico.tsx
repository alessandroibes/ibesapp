import { useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
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
  const [ano, setAno] = useState("");
  const [categoria, setCategoria] = useState("");
  const [editando, setEditando] = useState<Marco>();
  const [pessoas, setPessoas] = useState<string[]>([]);
  const [anexando, setAnexando] = useState<{ marco: Marco; anexo?: Anexo }>();
  const [erroAnexo, setErroAnexo] = useState("");
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
    if (!window.confirm(`Excluir o marco “${marco.titulo}” e seus anexos?`))
      return;
    await api(
      `/acervo-historico/marcos/${marco.id}?versao=${marco.versao}`,
      {},
      "DELETE",
    );
    atualizar();
  }
  async function excluirAnexo(marco: Marco, anexo: Anexo) {
    if (!window.confirm(`Remover “${anexo.nomeArquivo}”?`)) return;
    await api(
      `/acervo-historico/marcos/${marco.id}/anexos/${anexo.id}?versao=${anexo.versao}`,
      {},
      "DELETE",
    );
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
    const form = new FormData(e.currentTarget);
    form.set("versao", anexando.anexo?.versao ?? anexando.marco.versao);
    const caminho = `/acervo-historico/marcos/${anexando.marco.id}/anexos${anexando.anexo ? `/${anexando.anexo.id}` : ""}`;
    try {
      await api(caminho, form, anexando.anexo ? "PUT" : "POST");
      setAnexando(undefined);
      atualizar();
    } catch (error) {
      setErroAnexo(
        error instanceof Error ? error.message : "Não foi possível anexar.",
      );
    }
  }
  return (
    <section aria-labelledby="titulo-acervo">
      <h2 id="titulo-acervo">Acervo histórico</h2>
      <p>
        Memória institucional organizada em uma linha do tempo anual ou
        retrospectiva.
      </p>
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
            onChange={(e) => setAno(e.target.value)}
          />
        </label>
        <label>
          Categoria
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      {gerenciar && (
        <Formulario
          key={editando?.id ?? "novo"}
          titulo={editando ? "Editar marco histórico" : "Novo marco histórico"}
          texto={editando ? "Salvar alterações" : "Registrar marco"}
          iniciais={editando ?? { dataInicio: hoje() }}
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
                referencias.dados?.atividades.map((x) => ({
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
            if (editando)
              await api(
                `/acervo-historico/marcos/${editando.id}`,
                { ...dados, versao: editando.versao },
                "PUT",
              );
            else await api("/acervo-historico/marcos", dados);
            setEditando(undefined);
            setPessoas([]);
            atualizar();
          }}
        >
          <div role="group" aria-labelledby="pessoas-relacionadas">
            <p id="pessoas-relacionadas">
              <strong>Pessoas relacionadas</strong>
            </p>
            {referencias.dados?.pessoas.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  checked={pessoas.includes(p.id)}
                  onChange={(e) =>
                    setPessoas((atual) =>
                      e.target.checked
                        ? [...atual, p.id]
                        : atual.filter((x) => x !== p.id),
                    )
                  }
                />{" "}
                {p.nome}
              </label>
            ))}
          </div>
        </Formulario>
      )}
      {!marcos.loading && !marcos.erro && marcos.dados?.length === 0 && (
        <p>Nenhum marco encontrado.</p>
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
              <strong>{x.categoria}</strong>
              <p>{x.descricao}</p>
              <small>
                Autoria: {x.autor}
                {x.atividade ? ` · ${x.atividade}` : ""}
                {x.pessoas.length
                  ? ` · ${x.pessoas.map((p) => p.nome).join(", ")}`
                  : ""}
              </small>
              {x.anexos.map((a) => (
                <div className="acoes-dominio" key={a.id}>
                  <Button variant="outline" onClick={() => void baixar(x, a)}>
                    {a.nomeArquivo}
                  </Button>
                  {gerenciar && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setAnexando({ marco: x, anexo: a })}
                      >
                        Substituir anexo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void excluirAnexo(x, a)}
                      >
                        Remover anexo
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {gerenciar && (
                <div className="acoes-dominio">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditando(x);
                      setPessoas(x.pessoas.map((p) => p.id));
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAnexando({ marco: x })}
                  >
                    Anexar
                  </Button>
                  <Button variant="outline" onClick={() => void excluir(x)}>
                    Excluir
                  </Button>
                </div>
              )}
            </article>
          </li>
        ))}
      </ol>
      {anexando && (
        <form aria-label="Anexar foto ou documento" onSubmit={enviarAnexo}>
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
            <Button type="submit">
              {anexando.anexo ? "Salvar anexo" : "Enviar anexo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAnexando(undefined)}
            >
              Cancelar
            </Button>
          </fieldset>
          {erroAnexo && <p role="alert">{erroAnexo}</p>}
        </form>
      )}
    </section>
  );
}
