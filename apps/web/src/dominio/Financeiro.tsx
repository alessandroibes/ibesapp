import { useState } from "react";
import { Button } from "../components/ui/button";
import { type Api, dataBr, hoje, useConsulta } from "./api";
import { EstadoConsultas, Formulario } from "./componentes";

type Referencia = { id: string; nome: string };
type Referencias = { pessoas: Referencia[]; atividades: Referencia[] };
type Iniciativa = {
  id: string;
  versao: string;
  nome: string;
  descricao?: string;
};
type Lancamento = {
  id: string;
  versao: string;
  tipo: number;
  data: string;
  valor: number;
  motivo: string;
  descricao?: string;
  pessoaId?: string;
  pessoa?: string;
  atividadeAgendaId?: string;
  atividade?: string;
  iniciativaFinanceiraId?: string;
  iniciativa?: string;
};
type Resumo = {
  entradas: number;
  saidas: number;
  saldo: number;
  quantidadeLancamentos: number;
};
const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function Financeiro({
  api,
  gerenciar,
}: {
  api: Api;
  gerenciar: boolean;
}) {
  const [revisao, setRevisao] = useState(0);
  const [iniciativaFiltro, setIniciativaFiltro] = useState("");
  const [editando, setEditando] = useState<Lancamento>();
  const atualizar = () => setRevisao((x) => x + 1);
  const filtro = iniciativaFiltro ? `?iniciativaId=${iniciativaFiltro}` : "";
  const referencias = useConsulta<Referencias>(
    api,
    "/financeiro/referencias",
    revisao,
  );
  const iniciativas = useConsulta<Iniciativa[]>(
    api,
    "/financeiro/iniciativas",
    revisao,
  );
  const lancamentos = useConsulta<Lancamento[]>(
    api,
    `/financeiro/lancamentos${filtro}`,
    revisao,
  );
  const resumo = useConsulta<Resumo>(
    api,
    `/financeiro/resumo${filtro}`,
    revisao,
  );
  const opcoes = (itens?: Referencia[]) =>
    itens?.map((x) => ({ valor: x.id, rotulo: x.nome })) ?? [];
  const iniciativaOpcoes =
    iniciativas.dados?.map((x) => ({ valor: x.id, rotulo: x.nome })) ?? [];
  async function excluir(item: Lancamento) {
    if (!window.confirm(`Excluir o lançamento “${item.motivo}”?`)) return;
    await api(
      `/financeiro/lancamentos/${item.id}?versao=${item.versao}`,
      {},
      "DELETE",
    );
    atualizar();
  }
  return (
    <section aria-labelledby="titulo-financeiro">
      <h2 id="titulo-financeiro">Financeiro da Embaixada</h2>
      <p>
        Controle simples das entradas e saídas em reais, gerais ou relacionadas
        a eventos, pessoas e iniciativas.
      </p>
      <EstadoConsultas
        consultas={[referencias, iniciativas, lancamentos, resumo]}
        atualizar={atualizar}
      />
      <label>
        Filtrar por iniciativa
        <select
          value={iniciativaFiltro}
          onChange={(e) => setIniciativaFiltro(e.target.value)}
        >
          <option value="">Todas as movimentações</option>
          {iniciativaOpcoes.map((x) => (
            <option key={x.valor} value={x.valor}>
              {x.rotulo}
            </option>
          ))}
        </select>
      </label>
      {resumo.dados && (
        <dl className="resumo-financeiro">
          <div>
            <dt>Entradas</dt>
            <dd>{moeda.format(resumo.dados.entradas)}</dd>
          </div>
          <div>
            <dt>Saídas</dt>
            <dd>{moeda.format(resumo.dados.saidas)}</dd>
          </div>
          <div>
            <dt>Saldo</dt>
            <dd>{moeda.format(resumo.dados.saldo)}</dd>
          </div>
          <div>
            <dt>Lançamentos</dt>
            <dd>{resumo.dados.quantidadeLancamentos}</dd>
          </div>
        </dl>
      )}
      {gerenciar && (
        <div className="grade-organizacao">
          <Formulario
            titulo="Nova iniciativa"
            campos={[
              { nome: "nome", rotulo: "Nome", obrigatorio: true },
              {
                nome: "descricao",
                rotulo: "Descrição",
                tipo: "textarea",
                limite: 2000,
              },
            ]}
            salvar={async (d) => {
              await api("/financeiro/iniciativas", d);
              atualizar();
            }}
          />
          <Formulario
            key={editando?.id ?? "novo"}
            titulo={editando ? "Editar lançamento" : "Novo lançamento"}
            texto={editando ? "Salvar alterações" : "Registrar lançamento"}
            iniciais={editando ?? { data: hoje(), tipo: "1" }}
            campos={[
              {
                nome: "tipo",
                rotulo: "Movimentação",
                tipo: "select",
                obrigatorio: true,
                opcoes: [
                  { valor: "1", rotulo: "Entrada" },
                  { valor: "2", rotulo: "Saída" },
                ],
              },
              { nome: "data", rotulo: "Data", tipo: "date", obrigatorio: true },
              {
                nome: "valor",
                rotulo: "Valor (R$)",
                tipo: "number",
                obrigatorio: true,
              },
              { nome: "motivo", rotulo: "Motivo", obrigatorio: true },
              {
                nome: "descricao",
                rotulo: "Descrição opcional",
                tipo: "textarea",
                limite: 2000,
              },
              {
                nome: "pessoaId",
                rotulo: "Pessoa relacionada",
                tipo: "select",
                opcoes: opcoes(referencias.dados?.pessoas),
              },
              {
                nome: "atividadeAgendaId",
                rotulo: "Evento/atividade",
                tipo: "select",
                opcoes: opcoes(referencias.dados?.atividades),
              },
              {
                nome: "iniciativaFinanceiraId",
                rotulo: "Iniciativa",
                tipo: "select",
                opcoes: iniciativaOpcoes,
              },
            ]}
            salvar={async (d) => {
              const dados = {
                ...d,
                tipo: Number(d.tipo),
                valor: Number(d.valor),
                pessoaId: d.pessoaId || null,
                atividadeAgendaId: d.atividadeAgendaId || null,
                iniciativaFinanceiraId: d.iniciativaFinanceiraId || null,
              };
              if (editando)
                await api(
                  `/financeiro/lancamentos/${editando.id}`,
                  { ...dados, versao: editando.versao },
                  "PUT",
                );
              else await api("/financeiro/lancamentos", dados);
              setEditando(undefined);
              atualizar();
            }}
          />
        </div>
      )}
      {!lancamentos.loading &&
        !lancamentos.erro &&
        lancamentos.dados?.length === 0 && <p>Nenhum lançamento encontrado.</p>}
      <ul className="lista-dominio">
        {lancamentos.dados?.map((x) => (
          <li key={x.id}>
            <strong>
              {x.tipo === 1 ? "Entrada" : "Saída"} · {moeda.format(x.valor)}
            </strong>
            <br />
            <span>
              {dataBr(x.data)} · {x.motivo}
            </span>
            {x.descricao && <p>{x.descricao}</p>}
            <small>
              {[x.pessoa, x.atividade, x.iniciativa]
                .filter(Boolean)
                .join(" · ")}
            </small>
            {gerenciar && (
              <div className="acoes-dominio">
                <Button variant="outline" onClick={() => setEditando(x)}>
                  Editar
                </Button>
                <Button variant="outline" onClick={() => void excluir(x)}>
                  Excluir
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
