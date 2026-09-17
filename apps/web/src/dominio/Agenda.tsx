import { useMemo, useState } from "react";
import type { components } from "../../../../packages/contracts/api";
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Clock3,
  MapPin,
  Settings2,
} from "lucide-react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
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
  Label,
  PageSkeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toolbar,
} from "../components/ui";
import { type Api, dataBr, hoje, useConsulta } from "./api";
import { Chamada, lerRoteiro } from "./Chamada";
import { Formulario, SeletorPessoa, type Campo } from "./componentes";

type Catalogos = components["schemas"]["CadastrosAgendaResponse"];
type Ocorrencia = components["schemas"]["OcorrenciaResponse"];
type AtividadeDetalhe = components["schemas"]["AtividadeDetalheResponse"];
type ModoAgenda = "hoje" | "proximos" | "lista" | "mes" | "ano";
export const situacoesAgenda = [
  "Planejada",
  "Confirmada",
  "Concluída",
  "Cancelada",
  "Adiada",
];
const modosAgenda: Array<[ModoAgenda, string]> = [
  ["hoje", "Hoje"],
  ["proximos", "Próximos"],
  ["lista", "Lista"],
  ["mes", "Mês"],
  ["ano", "Ano"],
];
const opcoesSim = [
  { valor: "true", rotulo: "Sim" },
  { valor: "false", rotulo: "Não" },
];
function iso(data: Date) {
  return (
    data.getFullYear() +
    "-" +
    String(data.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(data.getDate()).padStart(2, "0")
  );
}
function dataValida(data: string | null | undefined) {
  return /^\d{4}-\d{2}-\d{2}$/.test(data ?? "") ? data! : hoje();
}
export function periodoAgenda(data: string, modo: ModoAgenda) {
  const referencia = new Date(data + "T12:00:00");
  let inicio = new Date(referencia);
  let fim = new Date(referencia);
  if (modo === "mes") {
    inicio = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
    fim = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0);
  } else if (modo === "ano") {
    inicio = new Date(referencia.getFullYear(), 0, 1);
    fim = new Date(referencia.getFullYear(), 11, 31);
  } else if (modo === "lista") {
    inicio.setDate(referencia.getDate() - referencia.getDay());
    fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
  } else if (modo === "proximos") fim.setDate(referencia.getDate() + 30);
  return { inicio: iso(inicio), fim: iso(fim) };
}
function rotuloPeriodo(data: string, modo: ModoAgenda) {
  const referencia = new Date(data + "T12:00:00");
  if (modo === "ano") return String(referencia.getFullYear());
  if (modo === "mes")
    return referencia.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  const periodo = periodoAgenda(data, modo);
  return periodo.inicio === periodo.fim
    ? dataBr(periodo.inicio)
    : dataBr(periodo.inicio) + " a " + dataBr(periodo.fim);
}
function camposAtividade(
  catalogos: Catalogos,
  atividades: Ocorrencia[] = [],
): Campo[] {
  return [
    {
      nome: "titulo",
      rotulo: "Título da atividade",
      obrigatorio: true,
      grupo: "Identificação",
    },
    {
      nome: "tipoAtividadeId",
      rotulo: "Tipo de atividade",
      tipo: "select",
      obrigatorio: true,
      grupo: "Identificação",
      opcoes: catalogos.tipos.map((item) => ({
        valor: item.id,
        rotulo: item.nome,
      })),
    },
    {
      nome: "entidadePromotoraId",
      rotulo: "Entidade promotora",
      tipo: "select",
      obrigatorio: true,
      grupo: "Identificação",
      opcoes: catalogos.promotoras.map((item) => ({
        valor: item.id,
        rotulo: item.nome,
      })),
    },
    {
      nome: "situacao",
      rotulo: "Situação",
      tipo: "select",
      obrigatorio: true,
      grupo: "Identificação",
      opcoes: situacoesAgenda.map((item, indice) => ({
        valor: String(indice + 1),
        rotulo: item,
      })),
    },
    {
      nome: "dataInicio",
      rotulo: "Data inicial",
      tipo: "date",
      obrigatorio: true,
      grupo: "Data e horário",
    },
    {
      nome: "dataFim",
      rotulo: "Data final",
      tipo: "date",
      obrigatorio: true,
      grupo: "Data e horário",
    },
    {
      nome: "diaInteiro",
      rotulo: "Dia inteiro",
      tipo: "select",
      obrigatorio: true,
      grupo: "Data e horário",
      opcoes: opcoesSim,
    },
    {
      nome: "horaInicio",
      rotulo: "Horário inicial",
      tipo: "time",
      grupo: "Data e horário",
    },
    {
      nome: "horaFim",
      rotulo: "Horário final",
      tipo: "time",
      grupo: "Data e horário",
    },
    {
      nome: "fusoHorario",
      rotulo: "Fuso horário",
      obrigatorio: true,
      limite: 100,
      grupo: "Data e horário",
    },
    {
      nome: "periodicidade",
      rotulo: "Recorrência",
      tipo: "select",
      grupo: "Recorrência",
      opcoes: ["Diária", "Semanal", "Mensal", "Anual"].map((item, indice) => ({
        valor: String(indice + 1),
        rotulo: item,
      })),
    },
    {
      nome: "intervalo",
      rotulo: "Intervalo da recorrência",
      tipo: "number",
      grupo: "Recorrência",
    },
    {
      nome: "diasSemana",
      rotulo: "Dias semanais (0 domingo a 6 sábado, separados por vírgula)",
      grupo: "Recorrência",
    },
    {
      nome: "recorrenciaAte",
      rotulo: "Repetir até (opcional)",
      tipo: "date",
      grupo: "Recorrência",
    },
    {
      nome: "local",
      rotulo: "Local",
      limite: 500,
      grupo: "Informações complementares",
    },
    {
      nome: "observacoes",
      rotulo: "Observações",
      tipo: "textarea",
      limite: 4000,
      grupo: "Informações complementares",
    },
    {
      nome: "prazo",
      rotulo: "É um prazo",
      tipo: "select",
      grupo: "Informações complementares",
      opcoes: opcoesSim,
    },
    {
      nome: "destaque",
      rotulo: "Destaque",
      tipo: "select",
      grupo: "Informações complementares",
      opcoes: opcoesSim,
    },
    {
      nome: "valor",
      rotulo: "Valor (opcional)",
      grupo: "Informações complementares",
    },
    {
      nome: "moeda",
      rotulo: "Moeda do valor (ex.: BRL)",
      limite: 10,
      grupo: "Informações complementares",
    },
    {
      nome: "link",
      rotulo: "Link HTTPS",
      limite: 2000,
      grupo: "Informações complementares",
    },
    {
      nome: "atividadeRelacionadaId",
      rotulo: "Atividade relacionada",
      tipo: "select",
      grupo: "Informações complementares",
      opcoes: Array.from(
        new Map(
          atividades.map((item) => [
            item.atividadeId,
            { valor: item.atividadeId, rotulo: item.titulo },
          ]),
        ).values(),
      ),
    },
  ];
}
function dadosAtividade(dados: Record<string, string>) {
  return {
    ...dados,
    diaInteiro: dados.diaInteiro === "true",
    horaInicio:
      dados.diaInteiro === "true" || !dados.horaInicio
        ? null
        : dados.horaInicio.slice(0, 5) + ":00",
    horaFim:
      dados.diaInteiro === "true" || !dados.horaFim
        ? null
        : dados.horaFim.slice(0, 5) + ":00",
    situacao: Number(dados.situacao),
    periodicidade: dados.periodicidade ? Number(dados.periodicidade) : null,
    intervalo: Number(dados.intervalo || 1),
    diasSemana: dados.diasSemana ? dados.diasSemana.split(",").map(Number) : [],
    recorrenciaAte: dados.recorrenciaAte || null,
    prazo: dados.prazo === "true",
    destaque: dados.destaque === "true",
    valor: dados.valor ? Number(dados.valor.replace(",", ".")) : null,
    moeda: dados.moeda || null,
    link: dados.link || null,
    responsavelId: dados.responsavelId || null,
    atividadeRelacionadaId: dados.atividadeRelacionadaId || null,
  };
}
function varianteSituacao(situacao: number | string) {
  const valor = Number(situacao);
  if (valor === 2 || valor === 3) return "success" as const;
  if (valor === 4) return "danger" as const;
  if (valor === 5) return "warning" as const;
  return "neutral" as const;
}
function horarioOcorrencia(ocorrencia: Ocorrencia) {
  if (ocorrencia.diaInteiro) return "Dia inteiro";
  return (
    [ocorrencia.horaInicio?.slice(0, 5), ocorrencia.horaFim?.slice(0, 5)]
      .filter(Boolean)
      .join("–") || "Horário não informado"
  );
}
function urlOcorrencia(ocorrencia: Ocorrencia) {
  return (
    "/agenda/atividades/" +
    ocorrencia.atividadeId +
    "/ocorrencias/" +
    ocorrencia.dataOriginal +
    "?data=" +
    ocorrencia.dataInicio
  );
}
function CartaoOcorrencia({ ocorrencia }: { ocorrencia: Ocorrencia }) {
  return (
    <article
      className={
        "cartao-ocorrencia " +
        (ocorrencia.destaque ? "cartao-ocorrencia-destaque" : "")
      }
    >
      <div className="linha-superior-ocorrencia">
        <Badge variant={varianteSituacao(ocorrencia.situacao)}>
          {situacoesAgenda[Number(ocorrencia.situacao) - 1]}
        </Badge>
        {ocorrencia.prazo && <Badge variant="warning">Prazo</Badge>}
      </div>
      <h3>{ocorrencia.titulo}</h3>
      <p>
        <Clock3 aria-hidden="true" /> {dataBr(ocorrencia.dataInicio)}
        {ocorrencia.dataFim !== ocorrencia.dataInicio &&
          " a " + dataBr(ocorrencia.dataFim)}{" "}
        · {horarioOcorrencia(ocorrencia)}
      </p>
      {ocorrencia.local && (
        <p>
          <MapPin aria-hidden="true" /> {ocorrencia.local}
        </p>
      )}
      <span>
        {ocorrencia.tipo} · {ocorrencia.promotora}
      </span>
      <Button asChild variant="outline" size="sm">
        <Link to={urlOcorrencia(ocorrencia)}>
          Ver detalhes <ChevronRight aria-hidden="true" />
        </Link>
      </Button>
    </article>
  );
}
function EventoCompacto({ ocorrencia }: { ocorrencia: Ocorrencia }) {
  return (
    <Link
      className={
        "evento-agenda " + (ocorrencia.destaque ? "evento-destaque" : "")
      }
      to={urlOcorrencia(ocorrencia)}
      title={
        ocorrencia.titulo +
        " — " +
        situacoesAgenda[Number(ocorrencia.situacao) - 1]
      }
    >
      <strong>{ocorrencia.titulo}</strong>
      <span>
        {ocorrencia.diaInteiro
          ? "Dia inteiro"
          : ocorrencia.horaInicio?.slice(0, 5)}{" "}
        · {situacoesAgenda[Number(ocorrencia.situacao) - 1]}
      </span>
    </Link>
  );
}
function AgendaPrincipal({ api, editar }: { api: Api; editar: boolean }) {
  const [parametros, setParametros] = useSearchParams();
  const location = useLocation();
  const [revisao, setRevisao] = useState(0);
  const [diaExpandido, setDiaExpandido] = useState("");
  const data = dataValida(parametros.get("data"));
  const modoInformado = parametros.get("visao") as ModoAgenda | null;
  const modo = modosAgenda.some(([valor]) => valor === modoInformado)
    ? modoInformado!
    : "mes";
  const promotora = parametros.get("promotora") ?? "";
  const tipo = parametros.get("tipo") ?? "";
  const situacao = parametros.get("situacao") ?? "";
  const intervalo = periodoAgenda(data, modo);
  const catalogos = useConsulta<Catalogos>(api, "/agenda/cadastros", revisao);
  const consulta = useConsulta<Ocorrencia[]>(
    api,
    "/agenda?inicio=" +
      intervalo.inicio +
      "&fim=" +
      intervalo.fim +
      (promotora ? "&promotoraId=" + promotora : "") +
      (tipo ? "&tipoId=" + tipo : "") +
      (situacao ? "&situacao=" + situacao : ""),
    revisao,
  );
  const mensagem = (location.state as { sucesso?: string } | null)?.sucesso;
  function alterar(
    mudancas: Partial<{
      data: string;
      visao: ModoAgenda;
      promotora: string;
      tipo: string;
      situacao: string;
    }>,
  ) {
    const valores = {
      data,
      visao: modo,
      promotora,
      tipo,
      situacao,
      ...mudancas,
    };
    const proximos = new URLSearchParams();
    if (valores.data !== hoje()) proximos.set("data", valores.data);
    if (valores.visao !== "mes") proximos.set("visao", valores.visao);
    if (valores.promotora) proximos.set("promotora", valores.promotora);
    if (valores.tipo) proximos.set("tipo", valores.tipo);
    if (valores.situacao) proximos.set("situacao", valores.situacao);
    setParametros(proximos, { replace: true });
    setDiaExpandido("");
  }
  const dias = useMemo(() => {
    if (modo !== "mes") return [];
    const resultado: string[] = [];
    const fim = new Date(intervalo.fim + "T12:00:00");
    for (
      let atual = new Date(intervalo.inicio + "T12:00:00");
      atual <= fim;
      atual.setDate(atual.getDate() + 1)
    )
      resultado.push(iso(atual));
    return resultado;
  }, [intervalo.fim, intervalo.inicio, modo]);
  const ocorrencias = consulta.dados ?? [];
  const ocorrenciasDia = (dia: string) =>
    ocorrencias.filter((item) => item.dataInicio <= dia && item.dataFim >= dia);
  const inicioMes = new Date(intervalo.inicio + "T12:00:00");
  return (
    <section className="pagina-agenda" aria-labelledby="titulo-agenda">
      <Toolbar className="cabecalho-modulo">
        <div>
          <h2 id="titulo-agenda">Agenda e reuniões</h2>
          <p>Planeje atividades e acesse rapidamente reuniões e chamadas.</p>
        </div>
        <div className="acoes-cabecalho-agenda">
          {editar && (
            <Button asChild variant="outline">
              <Link to="/agenda/configuracoes">
                <Settings2 aria-hidden="true" /> Configurações
              </Link>
            </Button>
          )}
          {editar && (
            <Button asChild>
              <Link to="/agenda/nova">
                <CalendarPlus aria-hidden="true" /> Nova atividade
              </Link>
            </Button>
          )}
        </div>
      </Toolbar>
      {mensagem && (
        <Alert variant="success">
          <AlertDescription>{mensagem}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Período e visualização</CardTitle>
          <CardDescription>
            Os filtros e a visualização permanecem no endereço da página.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="modos-agenda"
            role="group"
            aria-label="Visualização da agenda"
          >
            {modosAgenda.map(([valor, rotulo]) => (
              <Button
                key={valor}
                type="button"
                size="sm"
                variant={modo === valor ? "secondary" : "ghost"}
                aria-pressed={modo === valor}
                onClick={() =>
                  alterar({
                    visao: valor,
                    data: valor === "hoje" ? hoje() : data,
                  })
                }
              >
                {rotulo}
              </Button>
            ))}
          </div>
          <div className="filtros-agenda">
            <Label>
              Data de referência
              <input
                type="date"
                value={data}
                onChange={(evento) =>
                  evento.target.value && alterar({ data: evento.target.value })
                }
              />
            </Label>
            <Label>
              Filtrar por promotora
              <select
                value={promotora}
                onChange={(evento) =>
                  alterar({ promotora: evento.target.value })
                }
              >
                <option value="">Todas</option>
                {catalogos.dados?.promotoras.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </Label>
            <Label>
              Filtrar por tipo
              <select
                value={tipo}
                onChange={(evento) => alterar({ tipo: evento.target.value })}
              >
                <option value="">Todos</option>
                {catalogos.dados?.tipos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </Label>
            <Label>
              Filtrar por situação
              <select
                value={situacao}
                onChange={(evento) =>
                  alterar({ situacao: evento.target.value })
                }
              >
                <option value="">Todas</option>
                {situacoesAgenda.map((item, indice) => (
                  <option key={item} value={indice + 1}>
                    {item}
                  </option>
                ))}
              </select>
            </Label>
            <Button
              type="button"
              variant="outline"
              disabled={!promotora && !tipo && !situacao}
              onClick={() => alterar({ promotora: "", tipo: "", situacao: "" })}
            >
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="resumo-periodo-agenda">
        <div>
          <span>{rotuloPeriodo(data, modo)}</span>
          <strong>
            {ocorrencias.length}{" "}
            {ocorrencias.length === 1 ? "compromisso" : "compromissos"}
          </strong>
        </div>
        {modo !== "hoje" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alterar({ data: hoje(), visao: "hoje" })}
          >
            Ir para hoje
          </Button>
        )}
      </div>
      {(catalogos.loading || consulta.loading) && (
        <PageSkeleton label="Carregando agenda" />
      )}
      {(catalogos.erro || consulta.erro) && (
        <Alert variant="danger">
          <AlertDescription>{catalogos.erro || consulta.erro}</AlertDescription>
          <Button size="sm" onClick={() => setRevisao((valor) => valor + 1)}>
            Tentar novamente
          </Button>
        </Alert>
      )}
      {consulta.dados && ocorrencias.length === 0 && (
        <EmptyState
          icon={<CalendarDays aria-hidden="true" />}
          title="Nenhum compromisso encontrado"
          description="Ajuste o período ou limpe os filtros para consultar outras atividades."
          action={
            editar ? (
              <Button asChild>
                <Link to="/agenda/nova">Adicionar atividade</Link>
              </Button>
            ) : undefined
          }
        />
      )}
      {consulta.dados && ocorrencias.length > 0 && modo === "mes" && (
        <>
          <div className="calendario-agenda" aria-label="Calendário mensal">
            {Array.from({ length: inicioMes.getDay() }, (_, indice) => (
              <div key={"vazio-" + indice} className="dia-vazio" />
            ))}
            {dias.map((dia) => {
              const itens = ocorrenciasDia(dia);
              return (
                <section key={dia} className="dia-agenda">
                  <h3>
                    <span>
                      {new Date(dia + "T12:00:00").toLocaleDateString("pt-BR", {
                        weekday: "short",
                      })}
                    </span>
                    {Number(dia.slice(-2))}
                  </h3>
                  <div className="eventos-dia-agenda">
                    {itens.slice(0, 3).map((item) => (
                      <EventoCompacto
                        key={item.atividadeId + item.dataOriginal}
                        ocorrencia={item}
                      />
                    ))}
                  </div>
                  {itens.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mais-eventos-dia"
                      onClick={() => setDiaExpandido(dia)}
                    >
                      + {itens.length - 3} outros
                    </Button>
                  )}
                </section>
              );
            })}
          </div>
          <div className="agenda-movel" aria-label="Agenda mensal em lista">
            {dias
              .filter((dia) => ocorrenciasDia(dia).length > 0)
              .map((dia) => {
                const itens = ocorrenciasDia(dia);
                return (
                  <section key={dia}>
                    <h3>{dataBr(dia)}</h3>
                    <div className="grade-ocorrencias">
                      {itens.slice(0, 4).map((item) => (
                        <CartaoOcorrencia
                          key={item.atividadeId + item.dataOriginal}
                          ocorrencia={item}
                        />
                      ))}
                    </div>
                    {itens.length > 4 && (
                      <details className="mais-eventos-mobile">
                        <summary>
                          Mostrar mais {itens.length - 4} compromissos
                        </summary>
                        <div className="grade-ocorrencias">
                          {itens.slice(4).map((item) => (
                            <CartaoOcorrencia
                              key={item.atividadeId + item.dataOriginal}
                              ocorrencia={item}
                            />
                          ))}
                        </div>
                      </details>
                    )}
                  </section>
                );
              })}
          </div>
        </>
      )}
      {diaExpandido && (
        <Card className="resumo-dia-agenda">
          <CardHeader>
            <CardTitle>Compromissos de {dataBr(diaExpandido)}</CardTitle>
            <CardDescription>
              Todos os eventos deste dia, sem ampliar a célula do calendário.
            </CardDescription>
          </CardHeader>
          <CardContent className="grade-ocorrencias">
            {ocorrenciasDia(diaExpandido).map((item) => (
              <CartaoOcorrencia
                key={item.atividadeId + item.dataOriginal}
                ocorrencia={item}
              />
            ))}
            <Button variant="outline" onClick={() => setDiaExpandido("")}>
              Fechar resumo do dia
            </Button>
          </CardContent>
        </Card>
      )}
      {consulta.dados && ocorrencias.length > 0 && modo === "ano" && (
        <div className="cronograma-anual" aria-label="Cronograma anual">
          {Array.from({ length: 12 }, (_, mes) => {
            const prefixo =
              data.slice(0, 4) + "-" + String(mes + 1).padStart(2, "0");
            const itens = ocorrencias.filter(
              (item) =>
                item.dataInicio.slice(0, 7) <= prefixo &&
                item.dataFim.slice(0, 7) >= prefixo,
            );
            return (
              <Card key={prefixo}>
                <CardHeader>
                  <CardTitle>
                    {new Date(
                      Number(data.slice(0, 4)),
                      mes,
                      1,
                    ).toLocaleDateString("pt-BR", { month: "long" })}
                  </CardTitle>
                  <CardDescription>
                    {itens.length} {itens.length === 1 ? "item" : "itens"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {itens.slice(0, 4).map((item) => (
                    <EventoCompacto
                      key={item.atividadeId + item.dataOriginal}
                      ocorrencia={item}
                    />
                  ))}
                  {itens.length === 0 && (
                    <p className="texto-secundario">Sem compromissos.</p>
                  )}
                  {itens.length > 4 && (
                    <p className="texto-secundario">
                      + {itens.length - 4} outros itens
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      alterar({ data: prefixo + "-01", visao: "mes" })
                    }
                  >
                    Abrir mês
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {consulta.dados &&
        ocorrencias.length > 0 &&
        modo !== "mes" &&
        modo !== "ano" && (
          <div className="grade-ocorrencias" aria-label="Lista de compromissos">
            {ocorrencias.map((item) => (
              <CartaoOcorrencia
                key={item.atividadeId + item.dataOriginal}
                ocorrencia={item}
              />
            ))}
          </div>
        )}
    </section>
  );
}

function NovaAtividade({
  api,
  permissoes,
}: {
  api: Api;
  permissoes: string[];
}) {
  const navigate = useNavigate();
  const catalogos = useConsulta<Catalogos>(api, "/agenda/cadastros");
  const referencia = hoje();
  const atividades = useConsulta<Ocorrencia[]>(
    api,
    "/agenda?inicio=" +
      referencia.slice(0, 4) +
      "-01-01&fim=" +
      referencia.slice(0, 4) +
      "-12-31",
  );
  const padrao = {
    dataInicio: referencia,
    dataFim: referencia,
    diaInteiro: "true",
    fusoHorario: "America/Sao_Paulo",
    situacao: "1",
    intervalo: "1",
    diasSemana: String(new Date(referencia + "T12:00:00").getDay()),
    prazo: "false",
    destaque: "false",
  };
  return (
    <section
      className="pagina-formulario-agenda"
      aria-labelledby="titulo-nova-atividade"
    >
      <Toolbar className="cabecalho-interno">
        <div>
          <p className="caminho-interno">Agenda / Nova atividade</p>
          <h2 id="titulo-nova-atividade">Nova atividade</h2>
          <p>Cadastre uma atividade, prazo ou série recorrente.</p>
        </div>
      </Toolbar>
      {(catalogos.loading || atividades.loading) && (
        <PageSkeleton label="Carregando formulário da atividade" />
      )}
      {(catalogos.erro || atividades.erro) && (
        <Alert variant="danger">
          <AlertDescription>
            {catalogos.erro || atividades.erro}
          </AlertDescription>
        </Alert>
      )}
      {catalogos.dados && atividades.dados && (
        <Card>
          <CardContent>
            <Formulario
              titulo="Nova atividade"
              campos={camposAtividade(catalogos.dados, atividades.dados)}
              iniciais={padrao}
              acoes={
                <Button asChild type="button" variant="outline">
                  <Link to="/agenda">Cancelar</Link>
                </Button>
              }
              salvar={async (dados) => {
                const resultado = await api<
                  components["schemas"]["IdResponse"]
                >("/agenda/atividades", dadosAtividade(dados));
                navigate(
                  "/agenda/atividades/" +
                    resultado.id +
                    "/ocorrencias/" +
                    dados.dataInicio +
                    "?data=" +
                    dados.dataInicio,
                  { state: { sucesso: "Atividade cadastrada." } },
                );
              }}
            >
              {permissoes.includes("pessoas.consultar") && (
                <SeletorPessoa
                  api={api}
                  nome="responsavelId"
                  rotulo="Pessoa responsável (opcional)"
                  obrigatorio={false}
                />
              )}
            </Formulario>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
function DetalheOcorrencia({
  api,
  permissoes,
}: {
  api: Api;
  permissoes: string[];
}) {
  const { atividadeId = "", dataOriginal = "" } = useParams();
  const [parametros] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [revisao, setRevisao] = useState(0);
  const dataExibida = dataValida(parametros.get("data") ?? dataOriginal);
  const editar = permissoes.includes("agenda.editar");
  const ocorrencias = useConsulta<Ocorrencia[]>(
    api,
    "/agenda?inicio=" + dataExibida + "&fim=" + dataExibida,
    revisao,
  );
  const detalhe = useConsulta<AtividadeDetalhe>(
    api,
    editar ? "/agenda/atividades/" + atividadeId : null,
    revisao,
  );
  const catalogos = useConsulta<Catalogos>(
    api,
    editar ? "/agenda/cadastros" : null,
    revisao,
  );
  const ocorrencia = ocorrencias.dados?.find(
    (item) =>
      item.atividadeId === atividadeId && item.dataOriginal === dataOriginal,
  );
  const mensagem = (location.state as { sucesso?: string } | null)?.sucesso;
  const atualizar = () => setRevisao((valor) => valor + 1);
  return (
    <section
      className="pagina-detalhe-agenda"
      aria-labelledby="titulo-detalhe-agenda"
    >
      {(ocorrencias.loading || (editar && detalhe.loading)) && (
        <PageSkeleton label="Carregando atividade" />
      )}
      {(ocorrencias.erro || detalhe.erro) && (
        <Alert variant="danger">
          <AlertDescription>
            {ocorrencias.erro || detalhe.erro}
          </AlertDescription>
          <Button size="sm" onClick={atualizar}>
            Tentar novamente
          </Button>
        </Alert>
      )}
      {mensagem && (
        <Alert variant="success">
          <AlertDescription>{mensagem}</AlertDescription>
        </Alert>
      )}
      {ocorrencias.dados && !ocorrencia && (
        <EmptyState
          icon={<CalendarDays aria-hidden="true" />}
          title="Ocorrência não encontrada"
          description="Ela pode ter sido remarcada. Retorne à agenda para localizar a data atual."
          action={
            <Button asChild variant="outline">
              <Link to="/agenda">Voltar à agenda</Link>
            </Button>
          }
        />
      )}
      {ocorrencia && (
        <>
          <Toolbar className="cabecalho-detalhe-agenda">
            <div>
              <p className="caminho-interno">Agenda / Detalhes</p>
              <h2 id="titulo-detalhe-agenda">{ocorrencia.titulo}</h2>
              <div className="etiquetas-ocorrencia">
                <Badge variant={varianteSituacao(ocorrencia.situacao)}>
                  {situacoesAgenda[Number(ocorrencia.situacao) - 1]}
                </Badge>
                {ocorrencia.recorrente && (
                  <Badge variant="primary">Recorrente</Badge>
                )}
                {ocorrencia.prazo && <Badge variant="warning">Prazo</Badge>}
              </div>
            </div>
            <div className="acoes-cabecalho-agenda">
              <Button asChild variant="outline">
                <Link to="/agenda">Voltar à agenda</Link>
              </Button>
              {ocorrencia.reuniaoId &&
                permissoes.includes("frequencia.consultar") && (
                  <Button asChild>
                    <Link
                      to={
                        "/agenda/reunioes/" + ocorrencia.reuniaoId + "/chamada"
                      }
                    >
                      Abrir chamada
                    </Link>
                  </Button>
                )}
            </div>
          </Toolbar>
          {Number(ocorrencia.situacao) === 4 && (
            <Alert variant="warning">
              <AlertDescription>
                Esta ocorrência foi cancelada e permanece visível como
                histórico. Presenças já registradas continuam contando para a
                primeira reunião.
              </AlertDescription>
            </Alert>
          )}
          <Tabs defaultValue="resumo" className="abas-detalhe-agenda">
            <TabsList aria-label="Áreas da atividade">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              {editar && (
                <TabsTrigger value="ocorrencia">Ocorrência</TabsTrigger>
              )}
              {editar && ocorrencia.recorrente && (
                <TabsTrigger value="recorrencia">Recorrência</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="resumo">
              <div className="grade-resumo-agenda">
                <Card>
                  <CardHeader>
                    <CardTitle>Quando e onde</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="lista-dados-agenda">
                      <dt>Período</dt>
                      <dd>
                        {dataBr(ocorrencia.dataInicio)}
                        {ocorrencia.dataFim !== ocorrencia.dataInicio &&
                          " a " + dataBr(ocorrencia.dataFim)}
                      </dd>
                      <dt>Horário</dt>
                      <dd>{horarioOcorrencia(ocorrencia)}</dd>
                      <dt>Fuso horário</dt>
                      <dd>{ocorrencia.fusoHorario}</dd>
                      <dt>Local</dt>
                      <dd>{ocorrencia.local || "Não informado"}</dd>
                    </dl>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Classificação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="lista-dados-agenda">
                      <dt>Tipo</dt>
                      <dd>{ocorrencia.tipo}</dd>
                      <dt>Promotora</dt>
                      <dd>{ocorrencia.promotora}</dd>
                      <dt>Situação</dt>
                      <dd>
                        {situacoesAgenda[Number(ocorrencia.situacao) - 1]}
                      </dd>
                    </dl>
                  </CardContent>
                </Card>
                {(ocorrencia.observacoes ||
                  ocorrencia.valor != null ||
                  ocorrencia.link) && (
                  <Card className="cartao-complementar-agenda">
                    <CardHeader>
                      <CardTitle>Informações complementares</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {ocorrencia.observacoes && (
                        <p>{ocorrencia.observacoes}</p>
                      )}
                      {ocorrencia.valor != null && (
                        <p>
                          Valor: {ocorrencia.valor} {ocorrencia.moeda}
                        </p>
                      )}
                      {ocorrencia.link && (
                        <Button asChild variant="link">
                          <a
                            href={ocorrencia.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir link da atividade
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
              {editar &&
                !ocorrencia.reuniaoId &&
                !ocorrencia.prazo &&
                catalogos.dados && (
                  <Card className="cartao-preparar-reuniao">
                    <CardHeader>
                      <CardTitle>Preparar reunião</CardTitle>
                      <CardDescription>
                        Crie a reunião desta ocorrência para liberar roteiro e
                        chamada.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Formulario
                        titulo="Preparar reunião"
                        campos={[
                          {
                            nome: "modeloId",
                            rotulo: "Modelo de roteiro (opcional)",
                            tipo: "select",
                            opcoes: catalogos.dados.modelos.map((item) => ({
                              valor: item.id,
                              rotulo: item.nome,
                            })),
                          },
                        ]}
                        texto="Criar reunião"
                        salvar={async (dados) => {
                          const resultado = await api<
                            components["schemas"]["IdResponse"]
                          >(
                            "/agenda/atividades/" +
                              ocorrencia.atividadeId +
                              "/ocorrencias/" +
                              ocorrencia.dataOriginal +
                              "/reuniao",
                            {
                              versao:
                                detalhe.dados?.versao ?? ocorrencia.versao,
                              modeloId: dados.modeloId || null,
                            },
                          );
                          navigate(
                            "/agenda/reunioes/" + resultado.id + "/chamada",
                          );
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
            </TabsContent>
            <TabsContent value="ocorrencia">
              <Card>
                <CardHeader>
                  <CardTitle>Alterar esta ocorrência</CardTitle>
                  <CardDescription>
                    A alteração cria uma exceção e preserva a série e a data
                    original.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Formulario
                    titulo="Exceção da ocorrência"
                    campos={[
                      {
                        nome: "dataInicio",
                        rotulo: "Nova data inicial",
                        tipo: "date",
                        obrigatorio: true,
                        grupo: "Data e situação",
                      },
                      {
                        nome: "dataFim",
                        rotulo: "Nova data final",
                        tipo: "date",
                        obrigatorio: true,
                        grupo: "Data e situação",
                      },
                      ...(!ocorrencia.diaInteiro
                        ? [
                            {
                              nome: "horaInicio",
                              rotulo: "Novo horário inicial",
                              tipo: "time" as const,
                              grupo: "Data e situação",
                            },
                            {
                              nome: "horaFim",
                              rotulo: "Novo horário final",
                              tipo: "time" as const,
                              grupo: "Data e situação",
                            },
                          ]
                        : []),
                      {
                        nome: "situacao",
                        rotulo: "Nova situação",
                        tipo: "select",
                        grupo: "Data e situação",
                        opcoes: situacoesAgenda.map((item, indice) => ({
                          valor: String(indice + 1),
                          rotulo: item,
                        })),
                      },
                      {
                        nome: "observacoes",
                        rotulo: "Observações da exceção",
                        tipo: "textarea",
                        limite: 4000,
                        grupo: "Observações",
                      },
                    ]}
                    iniciais={ocorrencia}
                    salvar={async (dados) => {
                      await api(
                        "/agenda/atividades/" +
                          ocorrencia.atividadeId +
                          "/ocorrencias/" +
                          ocorrencia.dataOriginal,
                        {
                          ...dados,
                          versao: detalhe.dados?.versao ?? ocorrencia.versao,
                          situacao: Number(dados.situacao),
                          horaInicio:
                            ocorrencia.diaInteiro || !dados.horaInicio
                              ? null
                              : dados.horaInicio.slice(0, 5) + ":00",
                          horaFim:
                            ocorrencia.diaInteiro || !dados.horaFim
                              ? null
                              : dados.horaFim.slice(0, 5) + ":00",
                        },
                        "PUT",
                      );
                      navigate(
                        "/agenda/atividades/" +
                          ocorrencia.atividadeId +
                          "/ocorrencias/" +
                          ocorrencia.dataOriginal +
                          "?data=" +
                          dados.dataInicio,
                        {
                          replace: true,
                          state: { sucesso: "Ocorrência atualizada." },
                        },
                      );
                      atualizar();
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="recorrencia">
              {detalhe.dados && catalogos.dados && (
                <Card>
                  <CardHeader>
                    <CardTitle>Alterar trecho futuro da série</CardTitle>
                    <CardDescription>
                      Reuniões e exceções já preparadas são preservadas. Escolha
                      um trecho posterior a elas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Formulario
                      titulo="Alterar série futura"
                      campos={[
                        {
                          nome: "aPartirDe",
                          rotulo: "A partir da ocorrência",
                          tipo: "date",
                          obrigatorio: true,
                          grupo: "Início da alteração",
                        },
                        ...camposAtividade(catalogos.dados, ocorrencias.dados),
                      ]}
                      iniciais={{
                        ...detalhe.dados.dados,
                        diasSemana: detalhe.dados.dados.diasSemana?.join(","),
                        aPartirDe: ocorrencia.dataOriginal,
                      }}
                      salvar={async (dados) => {
                        await api(
                          "/agenda/atividades/" +
                            ocorrencia.atividadeId +
                            "/alteracoes-futuras",
                          {
                            versao: detalhe.dados!.versao,
                            aPartirDe: dados.aPartirDe,
                            dados: {
                              ...dadosAtividade(dados),
                              responsavelId:
                                dados.responsavelId === undefined
                                  ? detalhe.dados!.dados.responsavelId
                                  : dados.responsavelId || null,
                            },
                          },
                        );
                        navigate("/agenda", {
                          state: {
                            sucesso: "Trecho futuro da série atualizado.",
                          },
                        });
                      }}
                    >
                      {permissoes.includes("pessoas.consultar") && (
                        <SeletorPessoa
                          api={api}
                          nome="responsavelId"
                          rotulo="Pessoa responsável (opcional)"
                          obrigatorio={false}
                          valorInicial={detalhe.dados.dados.responsavelId ?? ""}
                        />
                      )}
                    </Formulario>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </section>
  );
}

function ConfiguracoesAgenda({ api }: { api: Api }) {
  const [revisao, setRevisao] = useState(0);
  const catalogos = useConsulta<Catalogos>(api, "/agenda/cadastros", revisao);
  const atualizar = () => setRevisao((valor) => valor + 1);
  return (
    <section
      className="pagina-configuracoes-agenda"
      aria-labelledby="titulo-configuracoes-agenda"
    >
      <Toolbar className="cabecalho-interno">
        <div>
          <p className="caminho-interno">Agenda / Configurações</p>
          <h2 id="titulo-configuracoes-agenda">Configurações da Agenda</h2>
          <p>Gerencie tipos, entidades promotoras e modelos de roteiro.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/agenda">Voltar à agenda</Link>
        </Button>
      </Toolbar>
      {catalogos.loading && <PageSkeleton label="Carregando configurações" />}
      {catalogos.erro && (
        <Alert variant="danger">
          <AlertDescription>{catalogos.erro}</AlertDescription>
          <Button size="sm" onClick={atualizar}>
            Tentar novamente
          </Button>
        </Alert>
      )}
      {catalogos.dados && (
        <Tabs defaultValue="tipos">
          <TabsList aria-label="Configurações da Agenda">
            <TabsTrigger value="tipos">Tipos</TabsTrigger>
            <TabsTrigger value="promotoras">Promotoras</TabsTrigger>
            <TabsTrigger value="modelos">Modelos de roteiro</TabsTrigger>
          </TabsList>
          <TabsContent value="tipos">
            <div className="grade-configuracoes-agenda">
              <Card>
                <CardHeader>
                  <CardTitle>Tipos cadastrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="lista-configuracoes-agenda">
                    {catalogos.dados.tipos.map((item) => (
                      <li key={item.id}>{item.nome}</li>
                    ))}
                  </ul>
                  {catalogos.dados.tipos.length === 0 && (
                    <p>Nenhum tipo cadastrado.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Formulario
                    titulo="Novo tipo de atividade"
                    campos={[
                      {
                        nome: "nome",
                        rotulo: "Nome do tipo",
                        obrigatorio: true,
                        limite: 100,
                      },
                    ]}
                    salvar={async (dados) => {
                      await api("/agenda/tipos", dados);
                      atualizar();
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="promotoras">
            <div className="grade-configuracoes-agenda">
              <Card>
                <CardHeader>
                  <CardTitle>Entidades promotoras</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="lista-configuracoes-agenda">
                    {catalogos.dados.promotoras.map((item) => (
                      <li key={item.id}>{item.nome}</li>
                    ))}
                  </ul>
                  {catalogos.dados.promotoras.length === 0 && (
                    <p>Nenhuma promotora cadastrada.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Formulario
                    titulo="Nova entidade promotora"
                    campos={[
                      {
                        nome: "nome",
                        rotulo: "Nome da promotora",
                        obrigatorio: true,
                        limite: 100,
                      },
                    ]}
                    salvar={async (dados) => {
                      await api("/agenda/promotoras", dados);
                      atualizar();
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="modelos">
            <Alert variant="info">
              <AlertDescription>
                Cada linha representa título | duração em minutos | observações.
                Reuniões existentes mantêm sua própria cópia do roteiro.
              </AlertDescription>
            </Alert>
            <div className="grade-configuracoes-agenda">
              <Card>
                <CardContent>
                  <Formulario
                    titulo="Novo modelo de roteiro"
                    campos={[
                      {
                        nome: "nome",
                        rotulo: "Nome do modelo",
                        obrigatorio: true,
                      },
                      {
                        nome: "itens",
                        rotulo: "Blocos do roteiro",
                        tipo: "textarea",
                      },
                    ]}
                    salvar={async (dados) => {
                      await api("/agenda/modelos", {
                        nome: dados.nome,
                        itens: lerRoteiro(dados.itens),
                        versao: null,
                      });
                      atualizar();
                    }}
                  />
                </CardContent>
              </Card>
              {catalogos.dados.modelos.map((modelo) => (
                <Card key={modelo.id}>
                  <CardContent>
                    <Formulario
                      key={modelo.versao}
                      titulo={"Editar modelo " + modelo.nome}
                      campos={[
                        {
                          nome: "nome",
                          rotulo: "Nome do modelo",
                          obrigatorio: true,
                        },
                        {
                          nome: "itens",
                          rotulo: "Blocos do roteiro",
                          tipo: "textarea",
                        },
                      ]}
                      iniciais={{
                        nome: modelo.nome,
                        itens: modelo.itens
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
                          "/agenda/modelos/" + modelo.id,
                          {
                            nome: dados.nome,
                            itens: lerRoteiro(dados.itens),
                            versao: modelo.versao,
                          },
                          "PUT",
                        );
                        atualizar();
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}
function PaginaChamada({
  api,
  permissoes,
}: {
  api: Api;
  permissoes: string[];
}) {
  const { reuniaoId = "" } = useParams();
  return (
    <section className="pagina-chamada">
      <Button asChild variant="outline">
        <Link to="/agenda">Voltar à agenda</Link>
      </Button>
      <Chamada
        api={api}
        reuniaoId={reuniaoId}
        registrar={permissoes.includes("frequencia.registrar")}
        editarRoteiro={permissoes.includes("agenda.editar")}
      />
    </section>
  );
}
export function Agenda({
  api,
  permissoes,
}: {
  api: Api;
  permissoes: string[];
}) {
  const editar = permissoes.includes("agenda.editar");
  return (
    <Routes>
      <Route index element={<AgendaPrincipal api={api} editar={editar} />} />
      {editar && (
        <Route
          path="nova"
          element={<NovaAtividade api={api} permissoes={permissoes} />}
        />
      )}
      {editar && (
        <Route
          path="configuracoes"
          element={<ConfiguracoesAgenda api={api} />}
        />
      )}
      <Route
        path="atividades/:atividadeId/ocorrencias/:dataOriginal"
        element={<DetalheOcorrencia api={api} permissoes={permissoes} />}
      />
      {permissoes.includes("frequencia.consultar") && (
        <Route
          path="reunioes/:reuniaoId/chamada"
          element={<PaginaChamada api={api} permissoes={permissoes} />}
        />
      )}
      <Route path="*" element={<Navigate to="/agenda" replace />} />
    </Routes>
  );
}
