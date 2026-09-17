import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { EstadoConsultas, Formulario, FormularioDialogo } from "./componentes";

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
  const [filtros, setFiltros] = useSearchParams();
  const iniciativaFiltro = filtros.get("iniciativa") ?? "";
  const inicio = filtros.get("inicio") ?? "";
  const fim = filtros.get("fim") ?? "";
  const alterarFiltro = (nome: string, valor: string) => {
    const seguintes = new URLSearchParams(filtros);
    if (valor) seguintes.set(nome, valor);
    else seguintes.delete(nome);
    setFiltros(seguintes, { replace: true });
  };
  const [editando, setEditando] = useState<Lancamento>();
  const [excluindo, setExcluindo] = useState<Lancamento>();
  const atualizar = () => setRevisao((x) => x + 1);
  const parametros = new URLSearchParams();
  if (iniciativaFiltro) parametros.set("iniciativaId", iniciativaFiltro);
  if (inicio) parametros.set("inicio", inicio);
  if (fim) parametros.set("fim", fim);
  const filtro = parametros.size ? `?${parametros}` : "";
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
    await api(
      `/financeiro/lancamentos/${item.id}?versao=${item.versao}`,
      {},
      "DELETE",
    );
    setExcluindo(undefined);
    atualizar();
  }
  return (
    <section
      className="modulo-administrativo"
      aria-label="Financeiro da Embaixada"
    >
      <PageHeader
        title="Financeiro da Embaixada"
        description="Controle simples de entradas e saídas, gerais ou ligadas a eventos e iniciativas."
        breadcrumbs={[{ label: "Financeiro" }]}
        actions={
          gerenciar && (
            <div className="acoes-dominio">
              <FormularioDialogo
                titulo="Nova iniciativa"
                descricao="Agrupe movimentações relacionadas."
                gatilho="Nova iniciativa"
              >
                <Formulario
                  titulo="Dados da iniciativa"
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
              </FormularioDialogo>
              <FormularioDialogo
                titulo="Novo lançamento"
                descricao="Registre uma entrada ou saída."
                gatilho="Novo lançamento"
              >
                <FormularioLancamento
                  api={api}
                  referencias={referencias.dados}
                  iniciativas={iniciativaOpcoes}
                  atualizar={atualizar}
                />
              </FormularioDialogo>
            </div>
          )
        }
      />
      <EstadoConsultas
        consultas={[referencias, iniciativas, lancamentos, resumo]}
        atualizar={atualizar}
      />
      <div className="filtros-administrativos">
        <label>
          Data inicial
          <input
            type="date"
            value={inicio}
            onChange={(e) => alterarFiltro("inicio", e.target.value)}
          />
        </label>
        <label>
          Data final
          <input
            type="date"
            value={fim}
            onChange={(e) => alterarFiltro("fim", e.target.value)}
          />
        </label>
        <label>
          Filtrar por iniciativa
          <select
            value={iniciativaFiltro}
            onChange={(e) => alterarFiltro("iniciativa", e.target.value)}
          >
            <option value="">Todas as movimentações</option>
            {iniciativaOpcoes.map((x) => (
              <option key={x.valor} value={x.valor}>
                {x.rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>
      {resumo.dados && (
        <dl className="resumo-financeiro resumo-cartoes">
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
      {gerenciar && editando && (
        <Card>
          <CardContent>
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
                {
                  nome: "data",
                  rotulo: "Data",
                  tipo: "date",
                  obrigatorio: true,
                },
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
            <Button variant="outline" onClick={() => setEditando(undefined)}>
              Cancelar edição
            </Button>
          </CardContent>
        </Card>
      )}
      {!lancamentos.loading &&
        !lancamentos.erro &&
        lancamentos.dados?.length === 0 && (
          <EmptyState
            title="Nenhum lançamento encontrado"
            description="Altere os filtros ou registre uma movimentação."
          />
        )}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="lista-dominio lista-administrativa">
            {lancamentos.dados?.map((x) => (
              <li key={x.id}>
                <strong>
                  <Badge variant={x.tipo === 1 ? "success" : "warning"}>
                    {x.tipo === 1 ? "Entrada" : "Saída"}
                  </Badge>{" "}
                  · {moeda.format(x.valor)}
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
                    <Button
                      variant="destructive"
                      onClick={() => setExcluindo(x)}
                    >
                      Excluir
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <AlertDialog
        open={Boolean(excluindo)}
        onOpenChange={(aberto) => !aberto && setExcluindo(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
          <AlertDialogDescription>
            {excluindo
              ? `Será excluído ${excluindo.tipo === 1 ? "a entrada" : "a saída"} “${excluindo.motivo}”, de ${moeda.format(excluindo.valor)}, em ${dataBr(excluindo.data)}.`
              : ""}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => excluindo && void excluir(excluindo)}
              >
                Excluir lançamento
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function FormularioLancamento({
  api,
  referencias,
  iniciativas,
  atualizar,
}: {
  api: Api;
  referencias?: Referencias;
  iniciativas: { valor: string; rotulo: string }[];
  atualizar: () => void;
}) {
  const opcoes = (itens?: Referencia[]) =>
    itens?.map((x) => ({ valor: x.id, rotulo: x.nome })) ?? [];
  return (
    <Formulario
      titulo="Dados do lançamento"
      texto="Registrar lançamento"
      iniciais={{ data: hoje(), tipo: "1" }}
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
          opcoes: opcoes(referencias?.pessoas),
        },
        {
          nome: "atividadeAgendaId",
          rotulo: "Evento/atividade",
          tipo: "select",
          opcoes: opcoes(referencias?.atividades),
        },
        {
          nome: "iniciativaFinanceiraId",
          rotulo: "Iniciativa",
          tipo: "select",
          opcoes: iniciativas,
        },
      ]}
      salvar={async (d) => {
        await api("/financeiro/lancamentos", {
          ...d,
          tipo: Number(d.tipo),
          valor: Number(d.valor),
          pessoaId: d.pessoaId || null,
          atividadeAgendaId: d.atividadeAgendaId || null,
          iniciativaFinanceiraId: d.iniciativaFinanceiraId || null,
        });
        atualizar();
      }}
    />
  );
}
