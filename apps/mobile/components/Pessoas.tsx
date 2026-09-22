import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import type { components } from "../../../packages/contracts/api";

type Pessoa = components["schemas"]["PessoaResponse"];
type Jornada = components["schemas"]["JornadaResponse"];
type Lista = components["schemas"]["PessoasResponse"];
export function Pessoas({
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
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState<Lista | null>(null);
  const [id, setId] = useState("");
  const [pessoa, setPessoa] = useState<Pessoa | null>(null);
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [revisao, setRevisao] = useState(0);
  const [data, setData] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const consultarJornada = permissoes.includes("progressao.consultar");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setErro("");
    setPessoa(null);
    setJornada(null);
    setLista(null);
    async function obter(caminho: string) {
      const r = await fetch(`${api}/api/v1${caminho}`, {
        headers: { Authorization: `Bearer ${token}`, "X-Igreja-Id": igrejaId },
        signal: controller.signal,
      });
      if (r.status === 404 && caminho.endsWith("/jornada")) return null;
      if (!r.ok)
        throw new Error(
          r.status === 403
            ? "Você não tem permissão nesta Igreja."
            : "Não foi possível consultar os registros. Verifique sua conexão e sessão.",
        );
      return r.json();
    }
    (async () => {
      if (id) {
        const p = (await obter(`/pessoas/${id}`)) as Pessoa;
        const j =
          consultarJornada && p.possuiJornada
            ? ((await obter(`/pessoas/${id}/jornada`)) as Jornada | null)
            : null;
        if (!controller.signal.aborted) {
          setPessoa(p);
          setJornada(j);
        }
      } else {
        const l = (await obter(
          `/pessoas?busca=${encodeURIComponent(busca)}&pagina=${pagina}`,
        )) as Lista;
        if (!controller.signal.aborted) setLista(l);
      }
    })()
      .catch((e) => {
        if (!controller.signal.aborted) setErro(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, token, igrejaId, busca, pagina, id, revisao, consultarJornada]);
  async function concluir(caminho: string, dados: object) {
    if (!jornada || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      setErro("Informe a data do fato no formato AAAA-MM-DD.");
      return;
    }
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      const r = await fetch(`${api}/api/v1/pessoas/${id}/jornada/${caminho}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Igreja-Id": igrejaId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...dados,
          versao: jornada.versao,
          dataConclusao: data,
        }),
      });
      if (!r.ok) {
        const problema = await r.json().catch(() => ({}));
        throw new Error(
          r.status === 409
            ? "O registro mudou. Atualize a jornada antes de tentar novamente."
            : (problema.title ??
                "Não foi possível registrar. Confira a data e seu vínculo como Conselheiro."),
        );
      }
      setMensagem("Conclusão registrada.");
      setRevisao((r) => r + 1);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar.");
    } finally {
      setSalvando(false);
    }
  }
  async function corrigir(caminho: string) {
    if (!jornada || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      setErro("Informe a data do fato no formato AAAA-MM-DD.");
      return;
    }
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      const r = await fetch(`${api}/api/v1/pessoas/${id}/jornada/${caminho}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Igreja-Id": igrejaId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ versao: jornada.versao, dataConclusao: data }),
      });
      if (!r.ok) {
        const problema = await r.json().catch(() => ({}));
        throw new Error(problema.title ?? "Não foi possível corrigir a data.");
      }
      setMensagem("Data corrigida.");
      setRevisao((valor) => valor + 1);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não foi possível corrigir a data.",
      );
    } finally {
      setSalvando(false);
    }
  }
  const botao = (titulo: string, acao: () => void, desabilitado = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={acao}
      style={styles.botao}
    >
      <Text style={styles.texto}>{titulo}</Text>
    </Pressable>
  );
  return (
    <View style={styles.area}>
      <Text accessibilityRole="header" style={styles.titulo}>
        Pessoas e jornada ER
      </Text>
      {loading && (
        <ActivityIndicator accessibilityLabel="Carregando pessoas e jornada" />
      )}
      {!!erro && <Text accessibilityRole="alert">{erro}</Text>}
      {!!mensagem && <Text accessibilityLiveRegion="polite">{mensagem}</Text>}
      {botao(
        "Atualizar registros",
        () => setRevisao((r) => r + 1),
        loading || salvando,
      )}
      {!id && (
        <>
          <Text>Buscar por nome</Text>
          <TextInput
            accessibilityLabel="Buscar por nome"
            style={styles.campo}
            value={busca}
            maxLength={100}
            onChangeText={(v) => {
              setBusca(v);
              setPagina(1);
            }}
          />
          {lista?.total === 0 && <Text>Nenhuma pessoa encontrada.</Text>}
          {lista?.pessoas.map((p) => (
            <View key={p.id}>
              {botao(`${p.nome}${p.situacao ? ` · ${p.situacao}` : ""}`, () => {
                setId(p.id);
                setMensagem("");
              })}
            </View>
          ))}
          {lista && (
            <>
              <Text>
                Página {pagina} · {lista.total} pessoas
              </Text>
              {botao(
                "Página anterior",
                () => setPagina((p) => p - 1),
                pagina === 1,
              )}
              {botao(
                "Próxima página",
                () => setPagina((p) => p + 1),
                pagina * 20 >= Number(lista.total),
              )}
            </>
          )}
        </>
      )}
      {!!id &&
        botao(
          "Voltar para pessoas",
          () => {
            setId("");
            setMensagem("");
          },
          salvando,
        )}
      {pessoa && (
        <>
          <Text accessibilityRole="header" style={styles.titulo}>
            {pessoa.dados.nome}
          </Text>
          <Text>
            Nascimento: {pessoa.dados.dataNascimento ?? "Não informado"}
          </Text>
          <Text>
            Primeira reunião:{" "}
            {pessoa.primeiraReuniao ?? "Nenhuma presença registrada"}
          </Text>
          <Text>
            Faixa etária: {pessoa.faixaEtaria ?? "Fora da faixa etária ER"}
          </Text>
          <Text>WhatsApp: {pessoa.dados.whatsApp ?? "Não informado"}</Text>
          <Text accessibilityRole="header">Responsáveis</Text>
          {pessoa.responsaveis.length === 0 && (
            <Text>Nenhum responsável registrado.</Text>
          )}
          {pessoa.responsaveis.map((r) => (
            <Text key={r.id}>
              {r.nome} · {r.relacao} · {r.telefoneWhatsApp ?? "Sem telefone"} ·{" "}
              {r.moraComOEmbaixador == null
                ? "Moradia não informada"
                : r.moraComOEmbaixador
                  ? "Mora com o Embaixador"
                  : "Não mora com o Embaixador"}
            </Text>
          ))}
        </>
      )}
      {jornada && (
        <>
          <Text accessibilityRole="header" style={styles.titulo}>
            {jornada.situacao}
          </Text>
          <Text>
            A condição de Embaixador termina ao completar 18 anos; o histórico é
            preservado.
          </Text>
          {!!jornada.mesesPermanencia && (
            <Text>
              Permanência mínima: {jornada.mesesPermanencia} meses por Posto.
            </Text>
          )}
          {permissoes.includes("progressao.registrar") &&
            !pessoa?.conselheiroVigente && (
              <>
                <Text>Data do fato (AAAA-MM-DD)</Text>
                <TextInput
                  accessibilityLabel="Data do fato (AAAA-MM-DD)"
                  placeholder="AAAA-MM-DD"
                  value={data}
                  maxLength={10}
                  onChangeText={setData}
                  style={styles.campo}
                />
              </>
            )}
          <Text accessibilityRole="header">Requisitos Mínimos</Text>
          {jornada.requisitos.map((r) => (
            <View key={r.requisito} style={styles.area}>
              <Text>
                {r.nome} · {r.dataConclusao ?? "Pendente"}
              </Text>
              {!r.dataConclusao &&
                permissoes.includes("progressao.registrar") &&
                !pessoa?.conselheiroVigente &&
                botao(
                  `Concluir ${r.nome}`,
                  () => void concluir("requisitos", { requisito: r.requisito }),
                  salvando,
                )}
              {!!r.dataConclusao &&
                permissoes.includes("progressao.registrar") &&
                !pessoa?.conselheiroVigente &&
                botao(
                  `Corrigir data de ${r.nome}`,
                  () => void corrigir(`requisitos/${r.requisito}`),
                  salvando,
                )}
            </View>
          ))}
          {jornada.postos.map((p) => (
            <View key={p.id} style={styles.area}>
              <Text accessibilityRole="header" style={styles.titulo}>
                {p.nome}
              </Text>
              <Text>
                Ingresso: {p.dataIngresso} · Conclusão:{" "}
                {p.dataConclusao ?? "Em andamento"}
              </Text>
              <Text>
                {p.identificacaoManual ?? "Manual ainda não definido."}
              </Text>
              {p.tarefas.map((t) => (
                <View key={t.id}>
                  <Text>
                    Tarefa {t.numero}: {t.nome} ·{" "}
                    {t.dataConclusao ?? "Pendente"}
                  </Text>
                  {!t.dataConclusao &&
                    !p.dataConclusao &&
                    permissoes.includes("progressao.registrar") &&
                    !pessoa?.conselheiroVigente &&
                    botao(
                      `Concluir Tarefa ${t.numero}: ${t.nome}`,
                      () => void concluir("tarefas", { tarefaManualId: t.id }),
                      salvando,
                    )}
                  {!!t.dataConclusao &&
                    permissoes.includes("progressao.registrar") &&
                    !pessoa?.conselheiroVigente &&
                    botao(
                      `Corrigir data da Tarefa ${t.numero}: ${t.nome}`,
                      () => void corrigir(`tarefas/${t.id}`),
                      salvando,
                    )}
                </View>
              ))}
            </View>
          ))}
          <Text accessibilityRole="header">Cerimônias</Text>
          {jornada.cerimonias.length === 0 && (
            <Text>Nenhuma cerimônia registrada.</Text>
          )}
          {jornada.cerimonias.map((c) => (
            <Text key={c.id}>
              {c.data} · {c.descricao}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  area: { gap: 14, marginVertical: 12 },
  titulo: { fontSize: 22, color: "#183a38", fontWeight: "600" },
  botao: {
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: "#71817c",
    borderRadius: 8,
  },
  texto: { color: "#183a38", fontSize: 16 },
  campo: {
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: "#71817c",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
});
