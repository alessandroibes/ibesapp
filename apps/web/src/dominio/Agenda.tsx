import { useState } from "react";
import type { components } from "../../../../packages/contracts/api";
import { type Api, useConsulta, hoje, dataBr } from "./api";
import { Estado, Formulario, SeletorPessoa, type Campo } from "./componentes";
import { Button } from "../components/ui/button";
import { Chamada, lerRoteiro } from "./Chamada";
type Catalogos = components["schemas"]["CadastrosAgendaResponse"];
type Ocorrencia = components["schemas"]["OcorrenciaResponse"];
const situacoes = [
  "Planejada",
  "Confirmada",
  "Concluída",
  "Cancelada",
  "Adiada",
];
const opcoesSim = [
  { valor: "true", rotulo: "Sim" },
  { valor: "false", rotulo: "Não" },
];
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function periodo(data: string, modo: string) {
  const d = new Date(data + "T12:00:00");
  let inicio = new Date(d);
  let fim = new Date(d);
  if (modo === "mes") {
    inicio = new Date(d.getFullYear(), d.getMonth(), 1);
    fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }
  if (modo === "ano") {
    inicio = new Date(d.getFullYear(), 0, 1);
    fim = new Date(d.getFullYear(), 11, 31);
  }
  if (modo === "semana") {
    inicio.setDate(d.getDate() - d.getDay());
    fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
  }
  if (modo === "proximos") fim.setDate(d.getDate() + 30);
  return { inicio: iso(inicio), fim: iso(fim) };
}
function camposAtividade(c: Catalogos, atividades: Ocorrencia[] = []): Campo[] {
  return [
    { nome: "titulo", rotulo: "Título da atividade", obrigatorio: true },
    {
      nome: "tipoAtividadeId",
      rotulo: "Tipo de atividade",
      tipo: "select",
      obrigatorio: true,
      opcoes: c.tipos.map((t) => ({ valor: t.id, rotulo: t.nome })),
    },
    {
      nome: "entidadePromotoraId",
      rotulo: "Entidade promotora",
      tipo: "select",
      obrigatorio: true,
      opcoes: c.promotoras.map((t) => ({ valor: t.id, rotulo: t.nome })),
    },
    {
      nome: "dataInicio",
      rotulo: "Data inicial",
      tipo: "date",
      obrigatorio: true,
    },
    { nome: "dataFim", rotulo: "Data final", tipo: "date", obrigatorio: true },
    {
      nome: "diaInteiro",
      rotulo: "Dia inteiro",
      tipo: "select",
      obrigatorio: true,
      opcoes: opcoesSim,
    },
    { nome: "horaInicio", rotulo: "Horário inicial", tipo: "time" },
    { nome: "horaFim", rotulo: "Horário final", tipo: "time" },
    {
      nome: "fusoHorario",
      rotulo: "Fuso horário",
      obrigatorio: true,
      limite: 100,
    },
    {
      nome: "situacao",
      rotulo: "Situação",
      tipo: "select",
      obrigatorio: true,
      opcoes: situacoes.map((s, i) => ({ valor: String(i + 1), rotulo: s })),
    },
    {
      nome: "periodicidade",
      rotulo: "Recorrência",
      tipo: "select",
      opcoes: ["Diária", "Semanal", "Mensal", "Anual"].map((s, i) => ({
        valor: String(i + 1),
        rotulo: s,
      })),
    },
    { nome: "intervalo", rotulo: "Intervalo da recorrência", tipo: "number" },
    {
      nome: "diasSemana",
      rotulo: "Dias semanais (0 domingo a 6 sábado, separados por vírgula)",
    },
    { nome: "recorrenciaAte", rotulo: "Repetir até (opcional)", tipo: "date" },
    { nome: "local", rotulo: "Local", limite: 500 },
    {
      nome: "observacoes",
      rotulo: "Observações",
      tipo: "textarea",
      limite: 4000,
    },
    { nome: "prazo", rotulo: "É um prazo", tipo: "select", opcoes: opcoesSim },
    { nome: "destaque", rotulo: "Destaque", tipo: "select", opcoes: opcoesSim },
    { nome: "valor", rotulo: "Valor (opcional)" },
    { nome: "moeda", rotulo: "Moeda do valor (ex.: BRL)", limite: 10 },
    { nome: "link", rotulo: "Link HTTPS", limite: 2000 },
    {
      nome: "atividadeRelacionadaId",
      rotulo: "Atividade relacionada (do período exibido)",
      tipo: "select",
      opcoes: Array.from(
        new Map(
          atividades.map((a) => [
            a.atividadeId,
            { valor: a.atividadeId, rotulo: a.titulo },
          ]),
        ).values(),
      ),
    },
  ];
}
function dadosAtividade(d: Record<string, string>) {
  return {
    ...d,
    tipoAtividadeId: d.tipoAtividadeId,
    entidadePromotoraId: d.entidadePromotoraId,
    diaInteiro: d.diaInteiro === "true",
    horaInicio:
      d.diaInteiro === "true"
        ? null
        : d.horaInicio
          ? d.horaInicio.slice(0, 5) + ":00"
          : null,
    horaFim:
      d.diaInteiro === "true"
        ? null
        : d.horaFim
          ? d.horaFim.slice(0, 5) + ":00"
          : null,
    situacao: Number(d.situacao),
    periodicidade: d.periodicidade ? Number(d.periodicidade) : null,
    intervalo: Number(d.intervalo || 1),
    diasSemana: d.diasSemana ? d.diasSemana.split(",").map(Number) : [],
    recorrenciaAte: d.recorrenciaAte || null,
    prazo: d.prazo === "true",
    destaque: d.destaque === "true",
    valor: d.valor ? Number(d.valor.replace(",", ".")) : null,
    moeda: d.moeda || null,
    link: d.link || null,
    responsavelId: d.responsavelId || null,
    atividadeRelacionadaId: d.atividadeRelacionadaId || null,
  };
}
export function Agenda({
  api,
  permissoes,
}: {
  api: Api;
  permissoes: string[];
}) {
  const [data, setData] = useState(hoje());
  const [modo, setModo] = useState("mes");
  const [promotora, setPromotora] = useState("");
  const [tipo, setTipo] = useState("");
  const [situacao, setSituacao] = useState("");
  const [revisao, setRevisao] = useState(0);
  const [selecionada, setSelecionada] = useState<Ocorrencia>();
  const [reuniaoId, setReuniaoId] = useState("");
  const editar = permissoes.includes("agenda.editar");
  const atualizar = () => {
    setRevisao((r) => r + 1);
    setSelecionada(undefined);
  };
  const intervalo = periodo(data, modo);
  const catalogos = useConsulta<Catalogos>(api, "/agenda/cadastros", revisao);
  const consulta = useConsulta<Ocorrencia[]>(
    api,
    `/agenda?inicio=${intervalo.inicio}&fim=${intervalo.fim}${promotora ? `&promotoraId=${promotora}` : ""}${tipo ? `&tipoId=${tipo}` : ""}${situacao ? `&situacao=${situacao}` : ""}`,
    revisao,
  );
  const detalhe = useConsulta<
    components["schemas"]["AtividadeDetalheResponse"]
  >(
    api,
    selecionada && editar
      ? `/agenda/atividades/${selecionada.atividadeId}`
      : null,
    revisao,
  );
  const c = catalogos.dados;
  const o = selecionada;
  const padrao = {
    dataInicio: data,
    dataFim: data,
    diaInteiro: "true",
    fusoHorario: "America/Sao_Paulo",
    situacao: 1,
    intervalo: 1,
    diasSemana: String(new Date(data + "T12:00:00").getDay()),
    prazo: "false",
    destaque: "false",
  };
  const cartao = (x: Ocorrencia) => (
    <button
      className={`evento-agenda ${x.destaque ? "evento-destaque" : ""}`}
      key={`${x.atividadeId}-${x.dataOriginal}`}
      onClick={() => {
        setSelecionada(x);
        setReuniaoId("");
      }}
    >
      <strong>{x.titulo}</strong>
      <span>
        {dataBr(x.dataInicio)}
        {x.dataFim !== x.dataInicio && ` a ${dataBr(x.dataFim)}`} ·{" "}
        {x.diaInteiro ? "Dia inteiro" : x.horaInicio?.slice(0, 5)}
      </span>
      <span>
        {situacoes[Number(x.situacao) - 1]} · {x.promotora}
        {x.prazo && " · Prazo"}
      </span>
    </button>
  );
  const dias = [];
  const inicioMes = new Date(intervalo.inicio + "T12:00:00");
  const fimMes = new Date(intervalo.fim + "T12:00:00");
  if (modo === "mes" || modo === "semana") {
    for (let d = new Date(inicioMes); d <= fimMes; d.setDate(d.getDate() + 1))
      dias.push(iso(d));
  }
  return (
    <section>
      <h2>Agenda e reuniões</h2>
      <div className="campos-dominio">
        <label>
          Data de referência
          <input
            type="date"
            value={data}
            onChange={(e) => e.target.value && setData(e.target.value)}
          />
        </label>
        <label>
          Visualização
          <select value={modo} onChange={(e) => setModo(e.target.value)}>
            <option value="hoje">Dia</option>
            <option value="proximos">Próximos 30 dias</option>
            <option value="semana">Semana</option>
            <option value="mes">Mês</option>
            <option value="ano">Ano / cronograma</option>
          </select>
        </label>
        <label>
          Filtrar por promotora
          <select
            value={promotora}
            onChange={(e) => setPromotora(e.target.value)}
          >
            <option value="">Todas</option>
            {c?.promotoras.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Filtrar por tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {c?.tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Filtrar por situação
          <select
            value={situacao}
            onChange={(e) => setSituacao(e.target.value)}
          >
            <option value="">Todas</option>
            {situacoes.map((s, i) => (
              <option key={s} value={i + 1}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button
        variant="outline"
        onClick={() => {
          setData(hoje());
          setModo("hoje");
        }}
      >
        Hoje
      </Button>
      <Estado {...catalogos} atualizar={atualizar} />
      <Estado {...consulta} atualizar={atualizar} />
      {consulta.dados?.length === 0 && (
        <p>Nenhum compromisso neste período e filtros.</p>
      )}
      {consulta.dados &&
        (dias.length ? (
          <div className="calendario-agenda" aria-label="Calendário">
            {modo === "mes" &&
              Array.from({ length: inicioMes.getDay() }, (_, i) => (
                <div key={`vazio${i}`} className="dia-vazio" />
              ))}
            {dias.map((d) => (
              <section key={d} className="dia-agenda">
                <h3>
                  {new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: "short",
                    day: "numeric",
                  })}
                </h3>
                {consulta
                  .dados!.filter((x) => x.dataInicio <= d && x.dataFim >= d)
                  .map(cartao)}
              </section>
            ))}
          </div>
        ) : modo === "ano" ? (
          <div>
            {Array.from({ length: 12 }, (_, m) => {
              const prefixo = `${data.slice(0, 4)}-${String(m + 1).padStart(2, "0")}`;
              return (
                <section key={m}>
                  <h3>
                    {new Date(
                      Number(data.slice(0, 4)),
                      m,
                      1,
                    ).toLocaleDateString("pt-BR", { month: "long" })}
                  </h3>
                  {consulta
                    .dados!.filter(
                      (x) =>
                        x.dataInicio.slice(0, 7) <= prefixo &&
                        x.dataFim.slice(0, 7) >= prefixo,
                    )
                    .map(cartao)}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="agenda-lista">{consulta.dados.map(cartao)}</div>
        ))}
      {o && (
        <article aria-label="Detalhes do compromisso">
          <h3>{o.titulo}</h3>
          <p>
            {dataBr(o.dataInicio)} a {dataBr(o.dataFim)} · {o.fusoHorario} ·{" "}
            {situacoes[Number(o.situacao) - 1]}
          </p>
          <p>
            {o.local} · {o.tipo} · {o.promotora}
          </p>
          <p>{o.observacoes}</p>
          {o.valor != null && (
            <p>
              Valor: {o.valor} {o.moeda}
            </p>
          )}
          {o.link && (
            <p>
              <a href={o.link} target="_blank" rel="noreferrer">
                Abrir link da atividade
              </a>
            </p>
          )}
          {o.reuniaoId && permissoes.includes("frequencia.consultar") && (
            <Button onClick={() => setReuniaoId(o.reuniaoId!)}>
              Abrir chamada e roteiro
            </Button>
          )}
          {editar && !o.reuniaoId && !o.prazo && c && (
            <Formulario
              titulo="Preparar reunião"
              campos={[
                {
                  nome: "modeloId",
                  rotulo: "Modelo de roteiro (opcional)",
                  tipo: "select",
                  opcoes: c.modelos.map((m) => ({
                    valor: m.id,
                    rotulo: m.nome,
                  })),
                },
              ]}
              texto="Criar reunião"
              salvar={async (d) => {
                const r = await api<components["schemas"]["IdResponse"]>(
                  `/agenda/atividades/${o.atividadeId}/ocorrencias/${o.dataOriginal}/reuniao`,
                  {
                    versao: detalhe.dados?.versao ?? o.versao,
                    modeloId: d.modeloId || null,
                  },
                );
                setReuniaoId(r.id);
                atualizar();
              }}
            />
          )}
          {editar && (
            <details>
              <summary>Alterar ou cancelar esta ocorrência</summary>
              <Formulario
                titulo="Exceção da ocorrência"
                campos={[
                  {
                    nome: "dataInicio",
                    rotulo: "Nova data inicial",
                    tipo: "date",
                    obrigatorio: true,
                  },
                  {
                    nome: "dataFim",
                    rotulo: "Nova data final",
                    tipo: "date",
                    obrigatorio: true,
                  },
                  ...(!o.diaInteiro
                    ? [
                        {
                          nome: "horaInicio",
                          rotulo: "Novo horário inicial",
                          tipo: "time" as const,
                        },
                        {
                          nome: "horaFim",
                          rotulo: "Novo horário final",
                          tipo: "time" as const,
                        },
                      ]
                    : []),
                  {
                    nome: "situacao",
                    rotulo: "Nova situação",
                    tipo: "select",
                    opcoes: situacoes.map((s, i) => ({
                      valor: String(i + 1),
                      rotulo: s,
                    })),
                  },
                  {
                    nome: "observacoes",
                    rotulo: "Observações da exceção",
                    tipo: "textarea",
                    limite: 4000,
                  },
                ]}
                iniciais={o}
                salvar={async (d) => {
                  await api(
                    `/agenda/atividades/${o.atividadeId}/ocorrencias/${o.dataOriginal}`,
                    {
                      ...d,
                      versao: detalhe.dados?.versao ?? o.versao,
                      situacao: Number(d.situacao),
                      horaInicio: o.diaInteiro
                        ? null
                        : d.horaInicio.slice(0, 5) + ":00",
                      horaFim: o.diaInteiro
                        ? null
                        : d.horaFim.slice(0, 5) + ":00",
                    },
                    "PUT",
                  );
                  atualizar();
                }}
              />
            </details>
          )}
          {editar && o.recorrente && c && detalhe.dados && (
            <details>
              <summary>Alterar trecho futuro da série</summary>
              <p>
                Reuniões e exceções já preparadas são preservadas. Escolha um
                trecho posterior a elas.
              </p>
              <Formulario
                titulo="Alterar série futura"
                campos={[
                  {
                    nome: "aPartirDe",
                    rotulo: "A partir da ocorrência",
                    tipo: "date",
                    obrigatorio: true,
                  },
                  ...camposAtividade(c, consulta.dados),
                ]}
                iniciais={{
                  ...detalhe.dados.dados,
                  diasSemana: detalhe.dados.dados.diasSemana?.join(","),
                  aPartirDe: o.dataOriginal,
                }}
                salvar={async (d) => {
                  await api(
                    `/agenda/atividades/${o.atividadeId}/alteracoes-futuras`,
                    {
                      versao: detalhe.dados!.versao,
                      aPartirDe: d.aPartirDe,
                      dados: {
                        ...dadosAtividade(d),
                        responsavelId:
                          d.responsavelId === undefined
                            ? detalhe.dados!.dados.responsavelId
                            : d.responsavelId || null,
                      },
                    },
                  );
                  atualizar();
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
            </details>
          )}
          <Button variant="outline" onClick={() => setSelecionada(undefined)}>
            Fechar detalhes
          </Button>
        </article>
      )}
      {reuniaoId && permissoes.includes("frequencia.consultar") && (
        <Chamada
          key={reuniaoId}
          api={api}
          reuniaoId={reuniaoId}
          registrar={permissoes.includes("frequencia.registrar")}
          editarRoteiro={editar}
        />
      )}
      {editar && c && (
        <>
          <details>
            <summary>Cadastrar atividade ou prazo</summary>
            <p>
              Tipos e promotoras são configuráveis. Cadastre-os abaixo antes da
              primeira atividade. Recorrência mensal/anual mantém o dia e ignora
              datas inexistentes.
            </p>
            <Formulario
              key={`nova-${revisao}`}
              titulo="Nova atividade"
              campos={camposAtividade(c, consulta.dados)}
              iniciais={padrao}
              salvar={async (d) => {
                await api("/agenda/atividades", dadosAtividade(d));
                atualizar();
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
          </details>
          <details>
            <summary>Tipos e entidades promotoras</summary>
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
              salvar={async (d) => {
                await api("/agenda/promotoras", d);
                atualizar();
              }}
            />
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
              salvar={async (d) => {
                await api("/agenda/tipos", d);
                atualizar();
              }}
            />
          </details>
          <details>
            <summary>Modelos de roteiro</summary>
            <p>
              Cada linha representa um bloco ordenado: título | duração em
              minutos | observações. Reuniões já criadas mantêm sua cópia.
            </p>
            <Formulario
              titulo="Novo modelo de roteiro"
              campos={[
                { nome: "nome", rotulo: "Nome do modelo", obrigatorio: true },
                {
                  nome: "itens",
                  rotulo: "Blocos do roteiro",
                  tipo: "textarea",
                },
              ]}
              salvar={async (d) => {
                await api("/agenda/modelos", {
                  nome: d.nome,
                  itens: lerRoteiro(d.itens),
                  versao: null,
                });
                atualizar();
              }}
            />
            {c.modelos.map((m) => (
              <details key={m.id}>
                <summary>{m.nome}</summary>
                <Formulario
                  key={m.versao}
                  titulo={`Editar modelo ${m.nome}`}
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
                    nome: m.nome,
                    itens: m.itens
                      .map(
                        (i) =>
                          `${i.titulo} | ${i.duracaoMinutos ?? ""} | ${i.observacoes ?? ""}`,
                      )
                      .join("\n"),
                  }}
                  salvar={async (d) => {
                    await api(
                      `/agenda/modelos/${m.id}`,
                      {
                        nome: d.nome,
                        itens: lerRoteiro(d.itens),
                        versao: m.versao,
                      },
                      "PUT",
                    );
                    atualizar();
                  }}
                />
              </details>
            ))}
          </details>
        </>
      )}
    </section>
  );
}
