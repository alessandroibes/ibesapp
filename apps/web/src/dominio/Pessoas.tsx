import { useEffect, useState } from "react";
import type { components } from "../../../../packages/contracts/api";
import { type Api, useConsulta, dataBr, hoje } from "./api";
import { Estado, Formulario, SeletorPessoa, type Campo } from "./componentes";
import { Jornada } from "./Jornada";
import { estadosFrequencia } from "./Chamada";
import { Button } from "../components/ui/button";
type Pessoa = components["schemas"]["PessoaResponse"];
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
export function Pessoas({
  api,
  igrejaId,
  permissoes,
}: {
  api: Api;
  igrejaId: string;
  permissoes: string[];
}) {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [selecionada, setSelecionada] = useState("");
  const [revisao, setRevisao] = useState(0);
  const lista = useConsulta<components["schemas"]["PessoasResponse"]>(
    api,
    `/pessoas?busca=${encodeURIComponent(busca)}&pagina=${pagina}`,
    revisao,
  );
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
  return (
    <section>
      <h2>Pessoas e jornada ER</h2>
      <p>
        Uma pessoa pode ser responsável, Conselheiro ou ter uma trajetória ER
        sem duplicar seu cadastro.
      </p>
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
      <Estado {...lista} atualizar={atualizar} />
      {lista.dados && (
        <>
          <p>{lista.dados.total} pessoa(s) encontrada(s).</p>
          <ul className="pessoas-lista">
            {lista.dados.pessoas.map((pessoa) => (
              <li key={pessoa.id}>
                <Button
                  variant={pessoa.id === selecionada ? "default" : "outline"}
                  onClick={() => setSelecionada(pessoa.id)}
                >
                  {pessoa.nome}
                </Button>
                <span>{pessoa.situacao ?? "Cadastro de pessoa"}</span>
              </li>
            ))}
          </ul>
          {lista.dados.total === 0 && (
            <p>Nenhuma pessoa cadastrada para esta busca.</p>
          )}
          <div className="acoes-dominio">
            <Button
              variant="outline"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => p - 1)}
            >
              Anterior
            </Button>
            <span>Página {pagina}</span>
            <Button
              variant="outline"
              disabled={pagina * 20 >= Number(lista.dados.total)}
              onClick={() => setPagina((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </>
      )}
      {editar && (
        <details>
          <summary>Cadastrar pessoa</summary>
          <Formulario
            titulo="Nova pessoa"
            campos={camposPessoa}
            salvar={async (dados) => {
              const criada = await api<components["schemas"]["IdResponse"]>(
                "/pessoas",
                converter(dados),
              );
              setSelecionada(criada.id);
              atualizar();
            }}
          />
        </details>
      )}
      <Estado {...ficha} atualizar={atualizar} />
      {p && (
        <article className="ficha-dominio" key={p.id}>
          <h3>Ficha de {p.dados.nome}</h3>
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
          {editar && (
            <>
              <details>
                <summary>Editar cadastro</summary>
                <Formulario
                  key={p.versao}
                  titulo="Editar pessoa"
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
              </details>
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
            </>
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
          {editar && (
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
          {editar && (
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
              podeRegistrar={permissoes.includes("progressao.registrar")}
              atualizarPessoa={atualizar}
            />
          )}
        </article>
      )}
    </section>
  );
}
