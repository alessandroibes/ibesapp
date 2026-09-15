import { useState } from "react";
import type { components } from "../../../../packages/contracts/api";
import { type Api, useConsulta, hoje, dataBr } from "./api";
import { Estado, Formulario, SeletorPessoa } from "./componentes";
type Esquemas = components["schemas"];
export function Instituicao({
  api,
  editar,
  podeConsultarPessoas,
}: {
  api: Api;
  editar: boolean;
  podeConsultarPessoas: boolean;
}) {
  const [revisao, setRevisao] = useState(0);
  const atualizar = () => setRevisao((r) => r + 1);
  const instituicao = useConsulta<Esquemas["EmbaixadaResponse"]>(
    api,
    "/embaixada",
    revisao,
  );
  const conselheiros = useConsulta<Esquemas["ConselheiroResponse"][]>(
    api,
    "/embaixada/conselheiros",
    revisao,
  );
  const liderancas = useConsulta<Esquemas["LiderancaResponse"][]>(
    api,
    "/embaixada/liderancas",
    revisao,
  );
  const contas = useConsulta<Esquemas["ContaResponse"][]>(
    api,
    editar ? "/embaixada/contas" : null,
    revisao,
  );
  const i = instituicao.dados;
  return (
    <section>
      <h2>Igreja e Embaixada</h2>
      <Estado {...instituicao} atualizar={atualizar} />
      {i && (
        <>
          <h3>{i.nomeOficial}</h3>
          <p>
            {i.nomeUsual} · Fundação: {dataBr(i.dataFundacao)}
          </p>
          <p>
            {i.nomeIgreja} · Pastor: {i.pastor ?? "Não informado"}
          </p>
          <p>Endereço da Igreja: {i.enderecoIgreja ?? "Não informado"}</p>
          <p>Endereço da Embaixada: {i.enderecoEmbaixada ?? "Não informado"}</p>
          <p>{i.historia ?? "História ainda não registrada."}</p>
          {editar && (
            <details>
              <summary>Editar dados institucionais</summary>
              <Formulario
                key={i.versaoEmbaixada}
                titulo="Dados institucionais"
                iniciais={i}
                campos={[
                  {
                    nome: "nomeIgreja",
                    rotulo: "Nome da Igreja",
                    obrigatorio: true,
                  },
                  {
                    nome: "enderecoIgreja",
                    rotulo: "Endereço da Igreja",
                    limite: 500,
                  },
                  { nome: "pastor", rotulo: "Pastor" },
                  {
                    nome: "nomeOficial",
                    rotulo: "Nome oficial da Embaixada",
                    obrigatorio: true,
                  },
                  { nome: "nomeUsual", rotulo: "Nome usual" },
                  {
                    nome: "dataFundacao",
                    rotulo: "Data de fundação",
                    tipo: "date",
                  },
                  {
                    nome: "enderecoEmbaixada",
                    rotulo: "Endereço da Embaixada",
                    limite: 500,
                  },
                  { nome: "historia", rotulo: "História", tipo: "textarea" },
                ]}
                salvar={async (d) => {
                  await api(
                    "/embaixada",
                    {
                      ...d,
                      dataFundacao: d.dataFundacao || null,
                      versaoIgreja: i.versaoIgreja,
                      versaoEmbaixada: i.versaoEmbaixada,
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
      <h3>Conselheiros</h3>
      <Estado {...conselheiros} atualizar={atualizar} />
      {conselheiros.dados?.length === 0 && (
        <p>Nenhum Conselheiro cadastrado.</p>
      )}
      <ul className="lista-dominio">
        {conselheiros.dados?.map((c) => (
          <li key={c.id}>
            <strong>
              {c.nome} · {c.funcao}
            </strong>
            <span>
              {dataBr(c.dataInicio)} até{" "}
              {c.dataFim ? dataBr(c.dataFim) : "o momento"}
            </span>
            {editar && !c.dataFim && (
              <details>
                <summary>Encerrar vínculo de Conselheiro</summary>
                <Formulario
                  titulo={`Encerrar Conselheiro ${c.nome}`}
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
                    await api(`/embaixada/conselheiros/${c.id}/encerramento`, {
                      ...d,
                      versao: c.versao,
                    });
                    atualizar();
                  }}
                />
              </details>
            )}
          </li>
        ))}
      </ul>
      {editar && podeConsultarPessoas && (
        <details>
          <summary>Cadastrar Conselheiro</summary>
          <p>O vínculo não concede permissões de acesso automaticamente.</p>
          <Estado {...contas} atualizar={atualizar} />
          <Formulario
            titulo="Novo Conselheiro"
            campos={[
              {
                nome: "funcao",
                rotulo: "Função",
                obrigatorio: true,
                limite: 100,
              },
              {
                nome: "dataInicio",
                rotulo: "Data de início",
                tipo: "date",
                obrigatorio: true,
              },
              {
                nome: "usuarioId",
                rotulo: "Conta de acesso (opcional)",
                tipo: "select",
                opcoes: contas.dados?.map((c) => ({
                  valor: c.id,
                  rotulo: c.email,
                })),
              },
            ]}
            iniciais={{ dataInicio: hoje() }}
            salvar={async (d) => {
              const pessoa = await api<Esquemas["PessoaResponse"]>(
                `/pessoas/${d.pessoaId}`,
              );
              await api("/embaixada/conselheiros", {
                ...d,
                usuarioId: d.usuarioId || null,
                versaoPessoa: pessoa.versao,
              });
              atualizar();
            }}
          >
            <SeletorPessoa api={api} />
          </Formulario>
        </details>
      )}
      <h3>Histórico de liderança adulta</h3>
      <Estado {...liderancas} atualizar={atualizar} />
      {liderancas.dados?.length === 0 && <p>Nenhuma liderança registrada.</p>}
      <ul className="lista-dominio">
        {liderancas.dados?.map((l) => (
          <li key={l.id}>
            <strong>
              {l.funcao} · {l.nome}
            </strong>
            <span>
              {dataBr(l.dataInicio)} até{" "}
              {l.dataFim ? dataBr(l.dataFim) : "o momento"}
            </span>
            {editar && !l.dataFim && (
              <Formulario
                titulo={`Encerrar liderança ${l.funcao}`}
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
                  await api(`/embaixada/liderancas/${l.id}/encerramento`, {
                    ...d,
                    versao: l.versao,
                  });
                  atualizar();
                }}
              />
            )}
          </li>
        ))}
      </ul>
      {editar && (
        <details>
          <summary>Registrar liderança</summary>
          <Formulario
            titulo="Nova liderança"
            campos={[
              {
                nome: "conselheiroId",
                rotulo: "Conselheiro",
                tipo: "select",
                obrigatorio: true,
                opcoes: conselheiros.dados
                  ?.filter((c) => !c.dataFim)
                  .map((c) => ({ valor: c.id, rotulo: c.nome })),
              },
              {
                nome: "funcao",
                rotulo: "Função de liderança",
                obrigatorio: true,
                limite: 100,
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
              const c = conselheiros.dados!.find(
                (c) => c.id === d.conselheiroId,
              )!;
              await api("/embaixada/liderancas", {
                ...d,
                versaoConselheiro: c.versao,
              });
              atualizar();
            }}
          />
        </details>
      )}
    </section>
  );
}
