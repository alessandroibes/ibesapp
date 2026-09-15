import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { components } from "../../../packages/contracts/api";
type Chamada = components["schemas"]["ChamadaResponse"];
type Pessoa = components["schemas"]["PessoaChamada"];
const estados = [
  "Presença com Pontualidade",
  "Presença com Atraso",
  "Falta",
  "Falta Justificada",
];
const situacoes = [
  "Planejada",
  "Confirmada",
  "Concluída",
  "Cancelada",
  "Adiada",
];
function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function Operacao({
  api,
  token,
  igrejaId,
  permissoes,
}: {
  api: string;
  token: string;
  igrejaId: string;
  permissoes: string[];
}) {
  const [data, setData] = useState(hoje());
  const [reuniaoId, setReuniaoId] = useState("");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [revisao, setRevisao] = useState(0);
  const [reunioes, setReunioes] = useState<
    components["schemas"]["ReuniaoResumo"][]
  >([]);
  const [agenda, setAgenda] = useState<
    components["schemas"]["OcorrenciaResponse"][]
  >([]);
  const [chamada, setChamada] = useState<Chamada | null>(null);
  const [reuniao, setReuniao] = useState<
    components["schemas"]["ReuniaoResponse"] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [visitante, setVisitante] = useState("");
  const [notas, setNotas] = useState<Record<string, string>>({});
  const podeAgenda = permissoes.includes("agenda.consultar");
  const podeChamada = permissoes.includes("frequencia.consultar");
  const registrar = permissoes.includes("frequencia.registrar");
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setErro("");
    setChamada(null);
    setReuniao(null);
    setReunioes([]);
    setAgenda([]);
    async function get(caminho: string) {
      const r = await fetch(`${api}/api/v1${caminho}`, {
        headers: { Authorization: `Bearer ${token}`, "X-Igreja-Id": igrejaId },
        signal: abort.signal,
      });
      if (!r.ok)
        throw new Error(
          r.status === 403
            ? "Sem permissão na Igreja selecionada."
            : "Não foi possível carregar. Confira a data, a conexão e sua sessão.",
        );
      return r.json();
    }
    (async () => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data))
        throw new Error("Informe a data no formato AAAA-MM-DD.");
      if (reuniaoId && podeChamada) {
        const [r, c] = await Promise.all([
          get(`/reunioes/${reuniaoId}`),
          get(
            `/reunioes/${reuniaoId}/chamada?busca=${encodeURIComponent(busca)}&pagina=${pagina}`,
          ),
        ]);
        if (!abort.signal.aborted) {
          setReuniao(r);
          setChamada(c);
        }
      } else {
        const [r, a] = await Promise.all([
          podeChamada ? get(`/reunioes?inicio=${data}&fim=${data}`) : [],
          podeAgenda ? get(`/agenda?inicio=${data}&fim=${data}`) : [],
        ]);
        if (!abort.signal.aborted) {
          setReunioes(r);
          setAgenda(a);
        }
      }
    })()
      .catch((e) => {
        if (!abort.signal.aborted) setErro(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [
    api,
    token,
    igrejaId,
    data,
    reuniaoId,
    busca,
    pagina,
    revisao,
    podeAgenda,
    podeChamada,
  ]);
  async function enviar(caminho: string, dados: object, metodo: string) {
    const r = await fetch(`${api}/api/v1${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Igreja-Id": igrejaId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });
    if (!r.ok) {
      const p = await r.json().catch(() => ({}));
      throw new Error(
        r.status === 409
          ? "O registro mudou. Atualize a chamada antes de tentar novamente."
          : (p.title ??
              "Não foi possível salvar. Verifique a conexão e sua permissão."),
      );
    }
    return r.json();
  }
  async function marcar(pessoa: Pessoa, situacao: number) {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await enviar(
        `/reunioes/${reuniaoId}/frequencia/${pessoa.pessoaId}`,
        {
          versao: pessoa.versao,
          situacao,
          observacoes: notas[pessoa.pessoaId] ?? pessoa.observacoes,
        },
        "PUT",
      );
      setMensagem(`${pessoa.nome}: ${estados[situacao - 1]}.`);
      setRevisao((r) => r + 1);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }
  const botao = (
    nome: string,
    acao: () => void,
    desabilitado = false,
    selecionado = false,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={nome}
      accessibilityState={{ disabled: desabilitado, selected: selecionado }}
      disabled={desabilitado}
      onPress={acao}
      style={[styles.botao, selecionado && styles.selecionado]}
    >
      <Text style={[styles.texto, selecionado && styles.textoSelecionado]}>
        {nome}
      </Text>
    </Pressable>
  );
  return (
    <View style={styles.area}>
      <Text accessibilityRole="header" style={styles.titulo}>
        Agenda e chamada
      </Text>
      <Text>Data (AAAA-MM-DD)</Text>
      <TextInput
        accessibilityLabel="Data da agenda (AAAA-MM-DD)"
        style={styles.campo}
        value={data}
        maxLength={10}
        editable={!salvando}
        onChangeText={(d) => {
          setData(d);
          setReuniaoId("");
        }}
      />
      {botao(
        "Atualizar chamada e agenda",
        () => setRevisao((r) => r + 1),
        salvando || loading,
      )}
      {loading && (
        <ActivityIndicator accessibilityLabel="Carregando agenda e chamada" />
      )}
      {!!erro && (
        <Text accessibilityRole="alert" style={styles.erro}>
          {erro}
        </Text>
      )}
      {!!mensagem && <Text accessibilityLiveRegion="polite">{mensagem}</Text>}
      {!reuniaoId && !loading && (
        <>
          {podeChamada && (
            <>
              <Text accessibilityRole="header" style={styles.titulo}>
                Reuniões do dia
              </Text>
              {reunioes.length === 0 && (
                <Text>
                  Nenhuma reunião preparada. Prepare a reunião pela agenda web.
                </Text>
              )}
              {reunioes.map((r) => (
                <View key={r.id}>
                  {botao(`Abrir chamada: ${r.titulo}`, () => {
                    setReuniaoId(r.id);
                    setBusca("");
                    setPagina(1);
                    setNotas({});
                    setMensagem("");
                  })}
                </View>
              ))}
            </>
          )}
          {podeAgenda && (
            <>
              <Text accessibilityRole="header" style={styles.titulo}>
                Compromissos do dia
              </Text>
              {agenda.length === 0 && (
                <Text>Nenhum compromisso para esta data.</Text>
              )}
              {agenda.map((a) => (
                <View
                  key={`${a.atividadeId}-${a.dataOriginal}`}
                  style={styles.cartao}
                >
                  <Text style={styles.texto}>{a.titulo}</Text>
                  <Text>
                    {a.dataInicio} a {a.dataFim} ·{" "}
                    {a.diaInteiro ? "Dia inteiro" : a.horaInicio?.slice(0, 5)}
                  </Text>
                  <Text>
                    {situacoes[Number(a.situacao) - 1]} · {a.promotora}
                  </Text>
                  <Text>
                    {a.local} {a.observacoes}
                  </Text>
                  {a.prazo && <Text>Prazo</Text>}
                  {a.valor != null && (
                    <Text>
                      {a.valor} {a.moeda}
                    </Text>
                  )}
                </View>
              ))}
            </>
          )}
        </>
      )}
      {!!reuniaoId && (
        <>
          {botao(
            "Voltar à agenda",
            () => {
              setReuniaoId("");
              setMensagem("");
            },
            salvando,
          )}
          <Text>Buscar pessoa na chamada</Text>
          <TextInput
            accessibilityLabel="Buscar pessoa na chamada"
            style={styles.campo}
            value={busca}
            maxLength={100}
            editable={!salvando}
            onChangeText={(s) => {
              setBusca(s);
              setPagina(1);
            }}
          />
          <Text>
            Sem lançamento não significa falta. Busque também pessoas já
            cadastradas que vieram como visitantes.
          </Text>
        </>
      )}
      {reuniao && (
        <>
          <Text accessibilityRole="header" style={styles.titulo}>
            {reuniao.titulo}
          </Text>
          {Number(reuniao.situacao) === 4 && (
            <Text>
              Reunião cancelada. Presenças continuam contando para a primeira
              reunião.
            </Text>
          )}
          <Text accessibilityRole="header">Roteiro</Text>
          {reuniao.roteiro.length === 0 && <Text>Sem roteiro definido.</Text>}
          {reuniao.roteiro.map((i, n) => (
            <Text key={n}>
              {n + 1}. {i.titulo}{" "}
              {i.duracaoMinutos != null && `· ${i.duracaoMinutos} min`}{" "}
              {i.observacoes}
            </Text>
          ))}
        </>
      )}
      {chamada && (
        <>
          <Text>
            {chamada.contagens
              .map((c) => `${estados[Number(c.situacao) - 1]}: ${c.quantidade}`)
              .join(" · ") || "Nenhuma frequência lançada."}
          </Text>
          {chamada.pessoas.length === 0 && (
            <Text>Nenhuma pessoa encontrada.</Text>
          )}
          {chamada.pessoas.map((p) => (
            <View key={p.pessoaId} style={styles.cartao}>
              <Text accessibilityRole="header" style={styles.titulo}>
                {p.nome}
              </Text>
              <Text>
                {p.condicao} ·{" "}
                {p.situacao
                  ? estados[Number(p.situacao) - 1]
                  : "Sem lançamento"}
              </Text>
              {registrar && (
                <>
                  <TextInput
                    accessibilityLabel={`Observação de ${p.nome}`}
                    style={styles.campo}
                    placeholder="Observação ou justificativa (opcional)"
                    value={notas[p.pessoaId] ?? p.observacoes ?? ""}
                    maxLength={1000}
                    editable={!salvando}
                    onChangeText={(n) =>
                      setNotas((v) => ({ ...v, [p.pessoaId]: n }))
                    }
                  />
                  <View style={styles.area}>
                    {estados.map((e, i) => (
                      <View key={e}>
                        {botao(
                          e,
                          () => void marcar(p, i + 1),
                          salvando,
                          Number(p.situacao) === i + 1,
                        )}
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          ))}
          <Text>Página {pagina}</Text>
          {botao(
            "Página anterior da chamada",
            () => setPagina((p) => p - 1),
            pagina === 1 || salvando,
          )}
          {botao(
            "Próxima página da chamada",
            () => setPagina((p) => p + 1),
            pagina * 30 >= Number(chamada.total) || salvando,
          )}
        </>
      )}
      {!!reuniaoId && registrar && (
        <View style={styles.cartao}>
          <Text accessibilityRole="header" style={styles.titulo}>
            Visitante
          </Text>
          <Text>
            Pesquise antes para evitar cadastro duplicado. Não cria candidatura
            nem presume presença.
          </Text>
          <TextInput
            accessibilityLabel="Nome do visitante"
            style={styles.campo}
            value={visitante}
            onChangeText={setVisitante}
            maxLength={200}
            editable={!salvando}
          />
          {botao(
            "Cadastrar visitante",
            () => {
              setSalvando(true);
              setErro("");
              void enviar(
                `/reunioes/${reuniaoId}/visitantes`,
                { nome: visitante },
                "POST",
              )
                .then(() => {
                  setBusca(visitante);
                  setPagina(1);
                  setVisitante("");
                  setRevisao((r) => r + 1);
                })
                .catch((e) => setErro(e.message))
                .finally(() => setSalvando(false));
            },
            salvando || !visitante.trim(),
          )}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  area: { gap: 12, marginVertical: 12 },
  cartao: {
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#cbd1c3",
    borderRadius: 8,
    backgroundColor: "#fffdf8",
  },
  titulo: { fontSize: 22, color: "#183a38", fontWeight: "600" },
  botao: {
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: "#71817c",
    borderRadius: 8,
  },
  selecionado: { backgroundColor: "#183a38" },
  texto: { color: "#183a38", fontSize: 16 },
  textoSelecionado: { color: "#fff" },
  campo: {
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: "#71817c",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  erro: { color: "#972b25" },
});
