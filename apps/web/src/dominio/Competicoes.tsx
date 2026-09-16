import { useEffect, useState } from "react";
import type { components } from "../../../../packages/contracts/api";
import { Button } from "../components/ui/button";
import { type Api, dataBr, hoje, useConsulta } from "./api";
import { Estado, Formulario, SeletorPessoa } from "./componentes";

type Modalidade = components["schemas"]["ModalidadeResponse"];
type Resumo = components["schemas"]["CompeticaoResumoResponse"];
type Detalhe = components["schemas"]["CompeticaoDetalheResponse"];
type ProvaCompeticao = components["schemas"]["ProvaCompeticaoResponse"];
type Candidato = components["schemas"]["CandidatoEscalacaoResponse"];
type Aptidao = components["schemas"]["AptidaoResponse"];
const naturezas = ["", "Individual", "Coletiva"];
const referencias = ["", "Nenhuma", "Missionário", "Livro bíblico"];
const situacoes = ["", "Rascunho", "Finalizada"];
const categorias = ["", "Junior", "Adolescente", "Juvenil", "Livre"];

export function Competicoes({
  api,
  gerenciar,
}: {
  api: Api;
  gerenciar: boolean;
}) {
  const [revisao, setRevisao] = useState(0);
  const [competicaoId, setCompeticaoId] = useState("");
  const catalogo = useConsulta<Modalidade[]>(
    api,
    "/competicoes/catalogo",
    revisao,
  );
  const competicoes = useConsulta<Resumo[]>(api, "/competicoes", revisao);
  const aptidoes = useConsulta<Aptidao[]>(
    api,
    "/competicoes/aptidoes",
    revisao,
  );
  const detalhe = useConsulta<Detalhe>(
    api,
    competicaoId ? `/competicoes/${competicaoId}` : null,
    revisao,
  );
  const atualizar = () => setRevisao((x) => x + 1);
  async function salvar(caminho: string, dados: object, metodo = "POST") {
    await api(caminho, dados, metodo);
    atualizar();
  }
  const provas =
    catalogo.dados?.flatMap((m) =>
      m.provas.map((p) => ({ ...p, modalidade: m.nome })),
    ) ?? [];
  const provaOpcoes = provas
    .filter((p) => p.ativa)
    .map((p) => ({ valor: p.id, rotulo: `${p.modalidade} · ${p.nome}` }));
  return (
    <section aria-labelledby="titulo-competicoes">
      <h2 id="titulo-competicoes">Competições e escalações</h2>
      <p>
        Aptidão é definida por Conselheiro. A lista de escalação mostra somente
        Candidatos e Embaixadores aptos e elegíveis na data-base do regulamento.
      </p>
      <Estado {...catalogo} atualizar={atualizar} />
      <Estado {...competicoes} atualizar={atualizar} />
      <Estado {...aptidoes} atualizar={atualizar} />
      {gerenciar && (
        <div className="grade-organizacao">
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
          <Formulario
            titulo="Nova prova"
            campos={[
              {
                nome: "modalidadeId",
                rotulo: "Modalidade",
                tipo: "select",
                obrigatorio: true,
                opcoes:
                  catalogo.dados
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
          <Formulario
            titulo="Registrar aptidão"
            campos={[
              {
                nome: "provaId",
                rotulo: "Prova",
                tipo: "select",
                obrigatorio: true,
                opcoes: provaOpcoes,
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
          <Formulario
            titulo="Nova competição"
            campos={[
              {
                nome: "nome",
                rotulo: "Nome da competição",
                obrigatorio: true,
                limite: 200,
              },
              {
                nome: "dataInicio",
                rotulo: "Data inicial",
                tipo: "date",
                obrigatorio: true,
              },
              {
                nome: "dataFim",
                rotulo: "Data final",
                tipo: "date",
                obrigatorio: true,
              },
              {
                nome: "dataBaseCategoria",
                rotulo: "Data-base das categorias",
                tipo: "date",
                obrigatorio: true,
              },
              { nome: "local", rotulo: "Local", limite: 500 },
              {
                nome: "observacoes",
                rotulo: "Observações",
                tipo: "textarea",
                limite: 4000,
              },
            ]}
            iniciais={{
              dataInicio: hoje(),
              dataFim: hoje(),
              dataBaseCategoria: hoje(),
            }}
            salvar={(d) =>
              salvar("/competicoes", {
                ...d,
                local: d.local || null,
                observacoes: d.observacoes || null,
              })
            }
          />
        </div>
      )}
      <details>
        <summary>Catálogo de modalidades e provas</summary>
        {catalogo.dados?.length === 0 ? (
          <p>Nenhuma modalidade cadastrada.</p>
        ) : (
          catalogo.dados?.map((m) => (
            <div key={m.id}>
              <h4>
                {m.nome}
                {m.ativa ? "" : " · Inativa"}
              </h4>
              {m.provas.length === 0 ? (
                <p>Nenhuma prova.</p>
              ) : (
                <ul>
                  {m.provas.map((p) => (
                    <li key={p.id}>
                      {p.nome} · {naturezas[p.natureza]} · referência:{" "}
                      {referencias[p.tipoReferencia]}
                      {p.ativa ? "" : " · Inativa"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </details>
      <details>
        <summary>Aptidões registradas</summary>
        {aptidoes.dados?.length === 0 ? (
          <p>Nenhuma aptidão registrada.</p>
        ) : (
          <ul className="lista-dominio">
            {aptidoes.dados?.map((a) => (
              <li key={a.id}>
                <strong>
                  {a.pessoa} · {a.prova}
                </strong>
                <span>
                  {dataBr(a.dataInicio)} a{" "}
                  {a.dataFim ? dataBr(a.dataFim) : "vigente"}
                  {a.motivoFim ? ` · ${a.motivoFim}` : ""}
                </span>
                {gerenciar && !a.dataFim && (
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
                )}
              </li>
            ))}
          </ul>
        )}
      </details>
      <h3>Competições</h3>
      {!competicoes.loading && competicoes.dados?.length === 0 && (
        <p>Nenhuma competição cadastrada.</p>
      )}
      <div className="acoes-dominio">
        {competicoes.dados?.map((c) => (
          <Button
            key={c.id}
            variant={competicaoId === c.id ? "default" : "outline"}
            aria-pressed={competicaoId === c.id}
            onClick={() => setCompeticaoId(c.id)}
          >
            {c.nome} · {dataBr(c.dataInicio)}
          </Button>
        ))}
      </div>
      <Estado {...detalhe} atualizar={atualizar} />
      {detalhe.dados && (
        <CompeticaoDetalhe
          dados={detalhe.dados}
          provas={provaOpcoes}
          api={api}
          gerenciar={gerenciar}
          salvar={salvar}
        />
      )}
    </section>
  );
}

function CompeticaoDetalhe({
  dados: c,
  provas,
  api,
  gerenciar,
  salvar,
}: {
  dados: Detalhe;
  provas: { valor: string; rotulo: string }[];
  api: Api;
  gerenciar: boolean;
  salvar: (caminho: string, dados: object, metodo?: string) => Promise<void>;
}) {
  return (
    <article>
      <h3>{c.nome}</h3>
      <p>
        {dataBr(c.dataInicio)} a {dataBr(c.dataFim)} · data-base{" "}
        {dataBr(c.dataBaseCategoria)}
        {c.local ? ` · ${c.local}` : ""}
      </p>
      {c.observacoes && <p>{c.observacoes}</p>}
      {gerenciar && (
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
                { valor: "1,2,3", rotulo: "Junior, Adolescente e Juvenil" },
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
              rotulo: "Data e horário da prova (opcional)",
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
      )}
      {c.provas.length === 0 ? (
        <p>Nenhuma prova configurada nesta competição.</p>
      ) : (
        c.provas.map((p) => (
          <ProvaCartao
            key={p.id}
            competicaoId={c.id}
            prova={p}
            api={api}
            gerenciar={gerenciar}
            salvar={salvar}
          />
        ))
      )}
    </article>
  );
}

function ProvaCartao({
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
  salvar: (caminho: string, dados: object, metodo?: string) => Promise<void>;
}) {
  return (
    <section className="prova-competicao">
      <h4>
        {p.modalidade} · {p.prova}
      </h4>
      <p>
        {naturezas[p.natureza]} ·{" "}
        {p.categorias.map((x) => categorias[x]).join(", ")} · titulares: mínimo{" "}
        {p.minimoTitulares}
        {p.quantidadeExataTitulares
          ? `, exatamente ${p.quantidadeExataTitulares}`
          : ""}{" "}
        · máximo total {p.maximoParticipantes} · até {p.maximoReservas} reservas
      </p>
      {p.tipoReferencia !== 1 && (
        <p>
          {referencias[p.tipoReferencia]}: {p.referencia}
        </p>
      )}
      {p.data && (
        <p>
          Horário: {dataBr(p.data)}, {p.horaInicio?.slice(0, 5)}–
          {p.horaFim?.slice(0, 5)}
        </p>
      )}
      <p>
        <strong>Escalação {situacoes[p.escalacao.situacao]}</strong>
      </p>
      {p.escalacao.participantes.length === 0 ? (
        <p>Nenhum participante escalado.</p>
      ) : (
        <ul>
          {p.escalacao.participantes.map((x) => (
            <li key={x.pessoaId}>
              {x.nome} · {x.funcao === 1 ? "Titular" : "Reserva"}
            </li>
          ))}
        </ul>
      )}
      {p.escalacao.alteracoes.map((x, i) => (
        <p key={`${x.registradoEm}-${i}`}>
          {x.tipo === 1 ? "Finalizada" : "Reaberta"} em{" "}
          {new Date(x.registradoEm).toLocaleString("pt-BR")}
          {x.motivo ? ` · ${x.motivo}` : ""}
        </p>
      ))}
      {p.escalacao.avisos.map((x) => (
        <p role="status" key={x}>
          {x}
        </p>
      ))}
      {gerenciar && (
        <EscalacaoEditor
          api={api}
          competicaoId={competicaoId}
          prova={p}
          salvar={salvar}
        />
      )}
    </section>
  );
}

function EscalacaoEditor({
  api,
  competicaoId,
  prova: p,
  salvar,
}: {
  api: Api;
  competicaoId: string;
  prova: ProvaCompeticao;
  salvar: (caminho: string, dados: object, metodo?: string) => Promise<void>;
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
  if (p.escalacao.situacao === 2)
    return (
      <Formulario
        titulo="Reabrir escalação"
        texto="Reabrir"
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
    );
  return (
    <div>
      <h5>Candidatos e Embaixadores aptos e elegíveis</h5>
      <Estado {...candidatos} atualizar={() => undefined} />
      {!candidatos.loading && candidatos.dados?.length === 0 && (
        <p>Nenhum participante apto e elegível.</p>
      )}
      <ul className="lista-dominio">
        {candidatos.dados?.map((c) => (
          <li key={c.pessoaId}>
            <strong>{c.nome}</strong>
            <span>{c.faixaEtaria}</span>
            {c.conflitos.map((x) => (
              <span key={x}>{x}</span>
            ))}
            <label>
              Função
              <select
                aria-label={`Função de ${c.nome}`}
                value={selecionados[c.pessoaId] ?? ""}
                disabled={salvando}
                onChange={(e) =>
                  setSelecionados((s) => {
                    const novo = { ...s };
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
        <Button
          disabled={salvando}
          variant="outline"
          onClick={() =>
            executar(() =>
              salvar(`/competicoes/escalacoes/${p.escalacao.id}/finalizacao`, {
                versao: p.escalacao.versao,
              }),
            )
          }
        >
          Finalizar escalação
        </Button>
      </div>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
