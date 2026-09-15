import { useState } from "react";
import type { components } from "../../../../packages/contracts/api";
import { type Api, useConsulta, dataBr } from "./api";
import { Estado, Formulario } from "./componentes";
import { Button } from "../components/ui/button";
export const estadosFrequencia = [
  "Presença com Pontualidade",
  "Presença com Atraso",
  "Falta",
  "Falta Justificada",
];
export function lerRoteiro(texto: string) {
  return texto
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      const [titulo, minutos, ...obs] = l.split("|");
      return {
        titulo: titulo.trim(),
        duracaoMinutos: minutos?.trim() ? Number(minutos) : null,
        observacoes: obs.join("|").trim() || null,
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
  const atualizar = () => setRevisao((r) => r + 1);
  const reuniao = useConsulta<components["schemas"]["ReuniaoResponse"]>(
    api,
    `/reunioes/${reuniaoId}`,
    revisao,
  );
  const chamada = useConsulta<components["schemas"]["ChamadaResponse"]>(
    api,
    `/reunioes/${reuniaoId}/chamada?busca=${encodeURIComponent(busca)}&pagina=${pagina}`,
    revisao,
  );
  const historico = useConsulta<
    components["schemas"]["AlteracaoFrequenciaResponse"][]
  >(
    api,
    historicoPessoa
      ? `/reunioes/${reuniaoId}/frequencia/${historicoPessoa}/historico`
      : null,
    revisao,
  );
  async function marcar(
    p: components["schemas"]["PessoaChamada"],
    situacao: number,
  ) {
    setErro("");
    setAviso("");
    setSalvando(true);
    try {
      await api(
        `/reunioes/${reuniaoId}/frequencia/${p.pessoaId}`,
        { versao: p.versao, situacao, observacoes: p.observacoes },
        "PUT",
      );
      setAviso(`${p.nome}: ${estadosFrequencia[situacao - 1]}.`);
      atualizar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar.");
    } finally {
      setSalvando(false);
    }
  }
  return (
    <section aria-label="Chamada da reunião">
      <Estado {...reuniao} atualizar={atualizar} />
      {reuniao.dados && (
        <>
          <h2>{reuniao.dados.titulo}</h2>
          <p>
            {dataBr(reuniao.dados.data)} ·{" "}
            {Number(reuniao.dados.situacao) === 4
              ? "Cancelada — presenças continuam contando para a primeira reunião."
              : "Chamada e roteiro"}
          </p>
          <details>
            <summary>Roteiro da reunião</summary>
            <ol>
              {reuniao.dados.roteiro.map((i, n) => (
                <li key={n}>
                  {i.titulo}{" "}
                  {i.duracaoMinutos != null && `· ${i.duracaoMinutos} min`}{" "}
                  {i.observacoes}
                </li>
              ))}
            </ol>
            {reuniao.dados.roteiro.length === 0 && (
              <p>
                Sem roteiro. A reunião não exige execução rígida de um modelo.
              </p>
            )}
            {editarRoteiro && (
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
                      (i) =>
                        `${i.titulo} | ${i.duracaoMinutos ?? ""} | ${i.observacoes ?? ""}`,
                    )
                    .join("\n"),
                }}
                salvar={async (d) => {
                  await api(
                    `/reunioes/${reuniaoId}/roteiro`,
                    {
                      versao: reuniao.dados!.versao,
                      itens: lerRoteiro(d.itens),
                    },
                    "PUT",
                  );
                  atualizar();
                }}
              />
            )}
          </details>
        </>
      )}
      <p>
        Sem lançamento não significa falta. Busque pelo nome para incluir uma
        pessoa já cadastrada.
      </p>
      <label>
        Buscar pessoa na chamada
        <input
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(1);
          }}
          maxLength={100}
        />
      </label>
      <Estado {...chamada} atualizar={atualizar} />
      {erro && <p role="alert">{erro}</p>}
      {aviso && <p role="status">{aviso}</p>}
      {chamada.dados && (
        <>
          <p>
            {chamada.dados.contagens
              .map(
                (c) =>
                  `${estadosFrequencia[Number(c.situacao) - 1]}: ${c.quantidade}`,
              )
              .join(" · ") || "Nenhuma frequência lançada."}
          </p>
          {chamada.dados.pessoas.length === 0 && (
            <p>
              Nenhuma pessoa nesta lista. Busque um cadastro existente ou
              cadastre um visitante.
            </p>
          )}
          <ul className="lista-dominio">
            {chamada.dados.pessoas.map((p) => (
              <li key={p.pessoaId}>
                <strong>
                  {p.nome} · {p.condicao}
                </strong>
                <span>
                  {p.situacao
                    ? estadosFrequencia[Number(p.situacao) - 1]
                    : "Sem lançamento"}
                </span>
                {registrar && (
                  <div
                    className="botoes-chamada"
                    role="group"
                    aria-label={`Frequência de ${p.nome}`}
                  >
                    {estadosFrequencia.map((e, i) => (
                      <Button
                        key={e}
                        disabled={salvando}
                        aria-pressed={Number(p.situacao) === i + 1}
                        variant={
                          Number(p.situacao) === i + 1 ? "default" : "outline"
                        }
                        onClick={() => void marcar(p, i + 1)}
                      >
                        {e}
                      </Button>
                    ))}
                  </div>
                )}
                {p.frequenciaId && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setHistoricoPessoa(p.pessoaId)}
                    >
                      Ver histórico de {p.nome}
                    </Button>
                    {registrar && (
                      <details>
                        <summary>Observação ou justificativa</summary>
                        <Formulario
                          titulo={`Observação de ${p.nome}`}
                          campos={[
                            {
                              nome: "observacoes",
                              rotulo: "Observação",
                              tipo: "textarea",
                              limite: 1000,
                            },
                          ]}
                          iniciais={{ observacoes: p.observacoes }}
                          salvar={async (d) => {
                            await api(
                              `/reunioes/${reuniaoId}/frequencia/${p.pessoaId}`,
                              {
                                versao: p.versao,
                                situacao: p.situacao,
                                observacoes: d.observacoes || null,
                              },
                              "PUT",
                            );
                            atualizar();
                          }}
                        />
                      </details>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="acoes-dominio">
            <Button
              disabled={pagina === 1}
              onClick={() => setPagina((p) => p - 1)}
            >
              Anterior
            </Button>
            <span>Página {pagina}</span>
            <Button
              disabled={pagina * 30 >= Number(chamada.dados.total)}
              onClick={() => setPagina((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </>
      )}
      {registrar && (
        <details>
          <summary>Cadastrar visitante</summary>
          <p>
            Pesquise antes para evitar duplicar a mesma pessoa. Não cria
            candidatura nem presume presença.
          </p>
          <Formulario
            titulo="Novo visitante"
            campos={[
              { nome: "nome", rotulo: "Nome do visitante", obrigatorio: true },
            ]}
            salvar={async (d) => {
              await api(`/reunioes/${reuniaoId}/visitantes`, d);
              setBusca(d.nome);
              setPagina(1);
              atualizar();
            }}
          />
        </details>
      )}
      {historicoPessoa && (
        <section>
          <h3>Histórico da frequência</h3>
          <Estado {...historico} atualizar={atualizar} />
          <ol>
            {historico.dados?.map((h) => (
              <li key={h.id}>
                {new Date(h.createdAt).toLocaleString("pt-BR")} ·{" "}
                {h.situacaoAnterior
                  ? estadosFrequencia[Number(h.situacaoAnterior) - 1]
                  : "Sem lançamento"}{" "}
                → {estadosFrequencia[Number(h.situacao) - 1]} {h.observacoes}
              </li>
            ))}
          </ol>
          <Button onClick={() => setHistoricoPessoa("")}>
            Fechar histórico
          </Button>
        </section>
      )}
    </section>
  );
}
