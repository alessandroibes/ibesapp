import { useEffect, useState } from "react";
import type { components } from "../../../../packages/contracts/api";
import { type Api, useConsulta, dataBr, hoje } from "./api";
import { Estado, Formulario, SeletorPessoa, type Campo } from "./componentes";
import { Jornada } from "./Jornada";
import { estadosFrequencia } from "./Chamada";
import { Button } from "../components/ui/button";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
type AlteracaoSituacao = {
  tipo: number;
  data: string;
  motivo: string;
  registradoEm: string;
};
type Pessoa = components["schemas"]["PessoaResponse"] & {
  ativa: boolean;
  alteracoesSituacao: AlteracaoSituacao[];
};
type PessoaResumo = {
  id: string;
  versao: string;
  nome: string;
  dataNascimento?: string | null;
  situacao?: string | null;
  ativa: boolean;
};
type PessoasResposta = { total: number; pessoas: PessoaResumo[] };
const camposPessoa: Campo[] = [
  { nome: "nome", rotulo: "Nome completo", obrigatorio: true },
  { nome: "dataNascimento", rotulo: "Data de nascimento", tipo: "date" },
  { nome: "naturalidade", rotulo: "Naturalidade" },
  { nome: "whatsApp", rotulo: "WhatsApp", limite: 40 },
  { nome: "endereco", rotulo: "Endereço", limite: 500 },
  { nome: "dataBatismo", rotulo: "Data do batismo", tipo: "date" },
  { nome: "localBatismo", rotulo: "Local do batismo" },
  { nome: "numeroCarteira", rotulo: "Número da carteira", limite: 80 },
  { nome: "situacaoCarteira", rotulo: "Situação da carteira", limite: 100 },
  {
    nome: "possuiBiblia",
    rotulo: "Possui Bíblia",
    tipo: "select",
    opcoes: [
      { valor: "true", rotulo: "Sim" },
      { valor: "false", rotulo: "Não" },
    ],
  },
  {
    nome: "observacoes",
    rotulo: "Observações",
    tipo: "textarea",
    limite: 4000,
  },
];
function converter(d: Record<string, string>) {
  return {
    ...Object.fromEntries(
      Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
    ),
    possuiBiblia: d.possuiBiblia === "" ? null : d.possuiBiblia === "true",
  };
}
function Foto({ igrejaId, pessoa }: { igrejaId: string; pessoa: Pessoa }) {
  const [imagem, setImagem] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setImagem("");
    if (pessoa.possuiFoto)
      fetch(`/api/v1/pessoas/${pessoa.id}/foto`, {
        headers: { "X-Igreja-Id": igrejaId },
        signal: controller.signal,
      })
        .then(async (r) => {
          if (!r.ok) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (!controller.signal.aborted) setImagem(reader.result as string);
          };
          reader.readAsDataURL(await r.blob());
        })
        .catch(() => undefined);
    return () => controller.abort();
  }, [igrejaId, pessoa.id, pessoa.possuiFoto, pessoa.versao]);
  return imagem ? (
    <img
      className="foto-pessoa"
      src={imagem}
      alt={`Foto de ${pessoa.dados.nome}`}
    />
  ) : (
    <p>
      {pessoa.possuiFoto
        ? "Foto indisponível no momento."
        : "Sem foto cadastrada."}
    </p>
  );
}

function DialogoSituacao({
  pessoa,
  api,
  fechar,
  concluido,
}: {
  pessoa: PessoaResumo | Pessoa;
  api: Api;
  fechar: () => void;
  concluido: () => void;
}) {
  const ativa = pessoa.ativa;
  return (
    <div
      className="fundo-dialogo"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && fechar()}
    >
      <section
        className="dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-dialogo-situacao"
      >
        <div className="cabecalho-dialogo">
          <div>
            <p className="rotulo-secao">Alterar situação</p>
            <h2 id="titulo-dialogo-situacao">
              {ativa ? "Inativar" : "Reativar"}{" "}
              {"nome" in pessoa ? pessoa.nome : pessoa.dados.nome}
            </h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={fechar}>
            ×
          </button>
        </div>
        <p>
          {ativa
            ? "A pessoa deixará de aparecer nas listas e seleções operacionais. Todo o histórico será preservado."
            : "A pessoa voltará a aparecer nas listas e seleções operacionais."}
        </p>
        <Formulario
          titulo={`${ativa ? "Inativar" : "Reativar"} pessoa`}
          texto={ativa ? "Confirmar inativação" : "Confirmar reativação"}
          campos={[
            { nome: "data", rotulo: "Data", tipo: "date", obrigatorio: true },
            {
              nome: "motivo",
              rotulo: "Motivo",
              tipo: "textarea",
              obrigatorio: true,
              limite: 500,
            },
          ]}
          iniciais={{ data: hoje() }}
          salvar={async (dados) => {
            await api(
              `/pessoas/${pessoa.id}/${ativa ? "inativacao" : "reativacao"}`,
              { ...dados, versao: pessoa.versao },
            );
            concluido();
          }}
        />
        <Button type="button" variant="outline" onClick={fechar}>
          Cancelar
        </Button>
      </section>
    </div>
  );
}

function ListaPessoas({ api, editar }: { api: Api; editar: boolean }) {
  const [busca, setBusca] = useState("");
  const [condicao, setCondicao] = useState("todos");
  const [incluirInativos, setIncluirInativos] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [revisao, setRevisao] = useState(0);
  const [alterando, setAlterando] = useState<PessoaResumo>();
  const consulta = useConsulta<PessoasResposta>(
    api,
    `/pessoas?busca=${encodeURIComponent(busca)}&condicao=${condicao}&incluirInativos=${incluirInativos}&pagina=${pagina}`,
    revisao,
  );
  return (
    <section aria-labelledby="titulo-pessoas">
      <div className="cabecalho-listagem">
        <div>
          <h2 id="titulo-pessoas">Pessoas</h2>
          <p>Embaixadores, Candidatos e Visitantes cadastrados na Igreja.</p>
        </div>
        {editar && (
          <Button asChild>
            <Link to="/pessoas/nova">Adicionar pessoa</Link>
          </Button>
        )}
      </div>
      <div className="filtros-listagem">
        <label>
          Buscar pelo nome
          <input
            value={busca}
            maxLength={100}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
          />
        </label>
        <label>
          Condição
          <select
            value={condicao}
            onChange={(e) => {
              setCondicao(e.target.value);
              setPagina(1);
            }}
          >
            <option value="todos">Todas</option>
            <option value="embaixadores">Embaixadores</option>
            <option value="candidatos">Candidatos</option>
            <option value="visitantes">Visitantes</option>
          </select>
        </label>
        <label className="controle-checkbox">
          <input
            type="checkbox"
            checked={incluirInativos}
            onChange={(e) => {
              setIncluirInativos(e.target.checked);
              setPagina(1);
            }}
          />{" "}
          Exibir inativos
        </label>
      </div>
      <Estado {...consulta} atualizar={() => setRevisao((x) => x + 1)} />
      {consulta.dados && (
        <>
          <p className="resultado-listagem">
            {consulta.dados.total} pessoa(s) encontrada(s).
          </p>
          {consulta.dados.total === 0 ? (
            <div className="estado-vazio">
              <p>Nenhuma pessoa encontrada com os filtros informados.</p>
            </div>
          ) : (
            <div className="tabela-responsiva">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Condição</th>
                    <th>Situação</th>
                    <th>
                      <span className="somente-leitor">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consulta.dados.pessoas.map((pessoa) => (
                    <tr key={pessoa.id}>
                      <td>
                        <strong>{pessoa.nome}</strong>
                      </td>
                      <td>{pessoa.situacao ?? "Visitante"}</td>
                      <td>
                        <span
                          className={`indicador-situacao ${pessoa.ativa ? "situacao-ativa" : "situacao-inativa"}`}
                        >
                          {pessoa.ativa ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td>
                        <div className="acoes-tabela">
                          <Button asChild variant="outline">
                            <Link to={`/pessoas/${pessoa.id}`}>Visualizar</Link>
                          </Button>
                          {editar && (
                            <Button asChild variant="outline">
                              <Link to={`/pessoas/${pessoa.id}/editar`}>
                                Editar
                              </Link>
                            </Button>
                          )}
                          {editar && (
                            <Button
                              variant="outline"
                              onClick={() => setAlterando(pessoa)}
                            >
                              {pessoa.ativa ? "Inativar" : "Reativar"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="paginacao">
            <Button
              variant="outline"
              disabled={pagina === 1}
              onClick={() => setPagina((x) => x - 1)}
            >
              Anterior
            </Button>
            <span>Página {pagina}</span>
            <Button
              variant="outline"
              disabled={pagina * 20 >= consulta.dados.total}
              onClick={() => setPagina((x) => x + 1)}
            >
              Próxima
            </Button>
          </div>
        </>
      )}
      {alterando && (
        <DialogoSituacao
          pessoa={alterando}
          api={api}
          fechar={() => setAlterando(undefined)}
          concluido={() => {
            setAlterando(undefined);
            setRevisao((x) => x + 1);
          }}
        />
      )}
    </section>
  );
}

function NovaPessoa({ api }: { api: Api }) {
  const navegar = useNavigate();
  return (
    <section>
      <div className="cabecalho-formulario">
        <div>
          <p className="caminho-interno">
            <Link to="/pessoas">Pessoas</Link> / Novo cadastro
          </p>
          <h2>Adicionar pessoa</h2>
          <p>
            Cadastre os dados básicos. A trajetória ER pode ser iniciada
            posteriormente.
          </p>
        </div>
      </div>
      <Formulario
        titulo="Nova pessoa"
        campos={camposPessoa}
        salvar={async (dados) => {
          const criada = await api<components["schemas"]["IdResponse"]>(
            "/pessoas",
            converter(dados),
          );
          navegar(`/pessoas/${criada.id}`);
        }}
      />
      <Button asChild variant="outline">
        <Link to="/pessoas">Cancelar</Link>
      </Button>
    </section>
  );
}

export function Pessoas({
  api,
  igrejaId,
  permissoes,
}: {
  api: Api;
  igrejaId: string;
  permissoes: string[];
}) {
  const editar = permissoes.includes("pessoas.editar");
  return (
    <Routes>
      <Route index element={<ListaPessoas api={api} editar={editar} />} />
      {editar && <Route path="nova" element={<NovaPessoa api={api} />} />}
      <Route
        path=":pessoaId"
        element={
          <RotaPessoa api={api} igrejaId={igrejaId} permissoes={permissoes} />
        }
      />
      <Route
        path=":pessoaId/editar"
        element={
          editar ? (
            <RotaPessoa
              api={api}
              igrejaId={igrejaId}
              permissoes={permissoes}
              modoEdicao
            />
          ) : (
            <Navigate to=".." replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/pessoas" replace />} />
    </Routes>
  );
}

function RotaPessoa({
  api,
  igrejaId,
  permissoes,
  modoEdicao = false,
}: {
  api: Api;
  igrejaId: string;
  permissoes: string[];
  modoEdicao?: boolean;
}) {
  const { pessoaId = "" } = useParams();
  return (
    <PessoaDetalhe
      api={api}
      igrejaId={igrejaId}
      permissoes={permissoes}
      pessoaIdInicial={pessoaId}
      modoEdicao={modoEdicao}
    />
  );
}

function PessoaDetalhe({
  api,
  igrejaId,
  permissoes,
  pessoaIdInicial,
  modoEdicao,
}: {
  api: Api;
  igrejaId: string;
  permissoes: string[];
  pessoaIdInicial: string;
  modoEdicao: boolean;
}) {
  const selecionada = pessoaIdInicial;
  const [revisao, setRevisao] = useState(0);
  const [alterando, setAlterando] = useState(false);
  const ficha = useConsulta<Pessoa>(
    api,
    selecionada ? `/pessoas/${selecionada}` : null,
    revisao,
  );
  const editar = permissoes.includes("pessoas.editar");
  const atualizar = () => setRevisao((r) => r + 1);
  const p = ficha.dados;
  const frequencia = useConsulta<
    components["schemas"]["FrequenciaPessoaResponse"][]
  >(
    api,
    selecionada && permissoes.includes("frequencia.consultar")
      ? `/pessoas/${selecionada}/frequencia`
      : null,
    revisao,
  );
  if (modoEdicao)
    return (
      <section>
        <Estado {...ficha} atualizar={atualizar} />
        {p && (
          <>
            <p className="caminho-interno">
              <Link to={`/pessoas/${p.id}`}>{p.dados.nome}</Link> / Editar
            </p>
            <h2>Editar pessoa</h2>
            <Formulario
              key={p.versao}
              titulo="Dados pessoais"
              campos={camposPessoa}
              iniciais={p.dados}
              salvar={async (dados) => {
                await api(
                  `/pessoas/${p.id}`,
                  { versao: p.versao, dados: converter(dados) },
                  "PUT",
                );
                atualizar();
              }}
            />
            <Formulario
              titulo="Atualizar foto"
              campos={[]}
              salvar={async () => {
                const elemento = document.getElementById(
                  `foto-${p.id}`,
                ) as HTMLInputElement;
                if (!elemento.files?.[0])
                  throw new Error("Selecione uma foto PNG ou JPEG.");
                const form = new FormData();
                form.set("foto", elemento.files[0]);
                form.set("versao", p.versao);
                await api(`/pessoas/${p.id}/foto`, form);
                atualizar();
              }}
            >
              <label htmlFor={`foto-${p.id}`}>
                Foto PNG ou JPEG, até 2 MB
                <input
                  id={`foto-${p.id}`}
                  type="file"
                  accept="image/png,image/jpeg"
                  required
                />
              </label>
            </Formulario>
            <Button asChild variant="outline">
              <Link to={`/pessoas/${p.id}`}>Voltar aos detalhes</Link>
            </Button>
          </>
        )}
      </section>
    );
  return (
    <section>
      <p className="caminho-interno">
        <Link to="/pessoas">Pessoas</Link> / Detalhes
      </p>
      <Estado {...ficha} atualizar={atualizar} />
      {p && (
        <article className="ficha-dominio" key={p.id}>
          <div className="cabecalho-detalhes">
            <div>
              <h2>{p.dados.nome}</h2>
              <span
                className={`indicador-situacao ${p.ativa ? "situacao-ativa" : "situacao-inativa"}`}
              >
                {p.ativa ? "Ativa" : "Inativa"}
              </span>
            </div>
            <div className="acoes-dominio">
              <Button asChild variant="outline">
                <Link to="/pessoas">Voltar</Link>
              </Button>
              {editar && (
                <Button asChild>
                  <Link to={`/pessoas/${p.id}/editar`}>Editar</Link>
                </Button>
              )}
              {editar && (
                <Button variant="outline" onClick={() => setAlterando(true)}>
                  {p.ativa ? "Inativar" : "Reativar"}
                </Button>
              )}
            </div>
          </div>
          <Foto igrejaId={igrejaId} pessoa={p} />
          <dl>
            <dt>Nascimento</dt>
            <dd>{dataBr(p.dados.dataNascimento)}</dd>
            <dt>Primeira reunião</dt>
            <dd>
              {p.primeiraReuniao
                ? dataBr(p.primeiraReuniao)
                : "Nenhuma presença registrada"}
            </dd>
            <dt>Faixa etária atual</dt>
            <dd>
              {p.faixaEtaria ?? "Fora da faixa etária ER ou data não informada"}
            </dd>
            <dt>Contato</dt>
            <dd>{p.dados.whatsApp ?? "Não informado"}</dd>
            <dt>Endereço</dt>
            <dd>{p.dados.endereco ?? "Não informado"}</dd>
            <dt>Naturalidade</dt>
            <dd>{p.dados.naturalidade ?? "Não informada"}</dd>
            <dt>Batismo</dt>
            <dd>
              {dataBr(p.dados.dataBatismo)} ·{" "}
              {p.dados.localBatismo ?? "Local não informado"}
            </dd>
            <dt>Carteira</dt>
            <dd>
              {p.dados.numeroCarteira ?? "Número não informado"} ·{" "}
              {p.dados.situacaoCarteira ?? "Situação não informada"}
            </dd>
            <dt>Possui Bíblia</dt>
            <dd>
              {p.dados.possuiBiblia == null
                ? "Não informado"
                : p.dados.possuiBiblia
                  ? "Sim"
                  : "Não"}
            </dd>
            <dt>Observações</dt>
            <dd>{p.dados.observacoes ?? "Nenhuma"}</dd>
          </dl>
          {p.alteracoesSituacao.length > 0 && (
            <details>
              <summary>Histórico da situação</summary>
              <ul className="lista-dominio">
                {p.alteracoesSituacao.map((alteracao) => (
                  <li key={`${alteracao.registradoEm}-${alteracao.tipo}`}>
                    <strong>
                      {alteracao.tipo === 0 ? "Inativação" : "Reativação"} em{" "}
                      {dataBr(alteracao.data)}
                    </strong>
                    <span>{alteracao.motivo}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {permissoes.includes("frequencia.consultar") && (
            <details>
              <summary>Histórico de frequência</summary>
              <Estado {...frequencia} atualizar={atualizar} />
              {frequencia.dados?.length === 0 && (
                <p>Nenhuma frequência registrada.</p>
              )}
              <ul>
                {frequencia.dados?.map((f) => (
                  <li key={f.reuniaoId}>
                    {dataBr(f.data)} · {f.titulo} ·{" "}
                    {estadosFrequencia[Number(f.situacao) - 1]}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <h4>Responsáveis</h4>
          {p.responsaveis.length === 0 && <p>Nenhum responsável vinculado.</p>}
          <ul className="lista-dominio">
            {p.responsaveis.map((r) => (
              <li key={r.id}>
                <strong>
                  {r.parentesco}: {r.nome}
                </strong>
                <span>
                  {r.whatsApp ?? "Contato não informado"} ·{" "}
                  {dataBr(r.dataInicio)} até{" "}
                  {r.dataFim ? dataBr(r.dataFim) : "o momento"}
                </span>
                {editar && !r.dataFim && (
                  <Formulario
                    titulo={`Encerrar vínculo de ${r.nome}`}
                    campos={[
                      {
                        nome: "dataFim",
                        rotulo: "Data de encerramento",
                        tipo: "date",
                        obrigatorio: true,
                      },
                    ]}
                    iniciais={{ dataFim: hoje() }}
                    salvar={async (d) => {
                      await api(
                        `/pessoas/${p.id}/responsaveis/${r.id}/encerramento`,
                        { ...d, versao: r.versao },
                      );
                      atualizar();
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
          {editar && p.ativa && (
            <details>
              <summary>Vincular responsável</summary>
              <Formulario
                titulo="Novo vínculo de responsável"
                campos={[
                  {
                    nome: "parentesco",
                    rotulo: "Parentesco ou relação",
                    obrigatorio: true,
                    limite: 80,
                  },
                  {
                    nome: "dataInicio",
                    rotulo: "Data de início",
                    tipo: "date",
                    obrigatorio: true,
                  },
                ]}
                iniciais={{ dataInicio: hoje() }}
                salvar={async (d) => {
                  await api(`/pessoas/${p.id}/responsaveis`, {
                    ...d,
                    versao: p.versao,
                  });
                  atualizar();
                }}
              >
                <SeletorPessoa
                  api={api}
                  nome="responsavelId"
                  rotulo="Responsável"
                />
              </Formulario>
            </details>
          )}
          <h4>Vínculos eclesiásticos</h4>
          {p.vinculos.length === 0 && (
            <p>Nenhum vínculo eclesiástico registrado.</p>
          )}
          <ul className="lista-dominio">
            {p.vinculos.map((v) => (
              <li key={v.id}>
                <strong>
                  {v.tipo} · {v.nomeIgreja}
                </strong>
                <span>
                  {dataBr(v.dataInicio)} até{" "}
                  {v.dataFim ? dataBr(v.dataFim) : "o momento"}
                </span>
                {editar && !v.dataFim && (
                  <Formulario
                    titulo={`Encerrar vínculo com ${v.nomeIgreja}`}
                    campos={[
                      {
                        nome: "dataFim",
                        rotulo: "Data de encerramento",
                        tipo: "date",
                        obrigatorio: true,
                      },
                    ]}
                    iniciais={{ dataFim: hoje() }}
                    salvar={async (d) => {
                      await api(
                        `/pessoas/${p.id}/vinculos-eclesiasticos/${v.id}/encerramento`,
                        { ...d, versao: v.versao },
                      );
                      atualizar();
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
          {editar && p.ativa && (
            <details>
              <summary>Registrar vínculo eclesiástico</summary>
              <Formulario
                titulo="Novo vínculo eclesiástico"
                campos={[
                  { nome: "nomeIgreja", rotulo: "Igreja", obrigatorio: true },
                  {
                    nome: "tipo",
                    rotulo: "Vínculo",
                    tipo: "select",
                    obrigatorio: true,
                    opcoes: [
                      { valor: "Membro", rotulo: "Membro" },
                      { valor: "Congregado", rotulo: "Congregado" },
                    ],
                  },
                  {
                    nome: "dataInicio",
                    rotulo: "Data de início",
                    tipo: "date",
                    obrigatorio: true,
                  },
                ]}
                iniciais={{ dataInicio: hoje() }}
                salvar={async (d) => {
                  await api(`/pessoas/${p.id}/vinculos-eclesiasticos`, {
                    ...d,
                    versao: p.versao,
                  });
                  atualizar();
                }}
              />
            </details>
          )}
          {permissoes.includes("progressao.consultar") && (
            <Jornada
              api={api}
              pessoaId={p.id}
              versaoPessoa={p.versao}
              podeRegistrar={
                p.ativa && permissoes.includes("progressao.registrar")
              }
              atualizarPessoa={atualizar}
            />
          )}
        </article>
      )}
      {alterando && p && (
        <DialogoSituacao
          pessoa={p}
          api={api}
          fechar={() => setAlterando(false)}
          concluido={() => {
            setAlterando(false);
            atualizar();
          }}
        />
      )}
    </section>
  );
}
