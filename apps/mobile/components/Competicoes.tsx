import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { components } from "../../../packages/contracts/api";

type Resumo = components["schemas"]["CompeticaoResumoResponse"];
type Detalhe = components["schemas"]["CompeticaoDetalheResponse"];
function dataBr(data: string) {
  return data.slice(0, 10).split("-").reverse().join("/");
}

export function Competicoes({
  api,
  token,
  igrejaId,
}: {
  api: string;
  token: string;
  igrejaId: string;
}) {
  const [lista, setLista] = useState<Resumo[]>([]);
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [selecionada, setSelecionada] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [revisao, setRevisao] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setErro("");
    const caminho = selecionada
      ? `/api/v1/competicoes/${selecionada}`
      : "/api/v1/competicoes";
    fetch(`${api}${caminho}`, {
      headers: { Authorization: `Bearer ${token}`, "X-Igreja-Id": igrejaId },
      signal: abort.signal,
    })
      .then(async (r) => {
        if (!r.ok)
          throw new Error(
            r.status === 403
              ? "Sem permissão para consultar as competições desta Igreja."
              : "Não foi possível carregar as competições.",
          );
        return r.json();
      })
      .then((dados) => {
        if (abort.signal.aborted) return;
        if (selecionada) setDetalhe(dados as Detalhe);
        else setLista(dados as Resumo[]);
      })
      .catch((e: Error) => {
        if (!abort.signal.aborted) setErro(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [api, token, igrejaId, selecionada, revisao]);
  return (
    <View style={styles.area}>
      <Text accessibilityRole="header" style={styles.titulo}>
        Competições e escalações
      </Text>
      {loading && (
        <ActivityIndicator accessibilityLabel="Carregando competições" />
      )}
      {!!erro && (
        <>
          <Text accessibilityRole="alert" style={styles.erro}>
            {erro}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.botao}
            onPress={() => setRevisao((x) => x + 1)}
          >
            <Text style={styles.botaoTexto}>Tentar novamente</Text>
          </Pressable>
        </>
      )}
      {!selecionada && !loading && !erro && lista.length === 0 && (
        <Text style={styles.texto}>Nenhuma competição cadastrada.</Text>
      )}
      {!selecionada &&
        lista.map((c) => (
          <Pressable
            accessibilityRole="button"
            key={c.id}
            style={styles.cartao}
            onPress={() => setSelecionada(c.id)}
          >
            <Text style={styles.subtitulo}>{c.nome}</Text>
            <Text style={styles.texto}>
              {dataBr(c.dataInicio)} a {dataBr(c.dataFim)} ·{" "}
              {c.quantidadeProvas} provas
            </Text>
          </Pressable>
        ))}
      {selecionada && (
        <Pressable
          accessibilityRole="button"
          style={styles.botaoSecundario}
          onPress={() => {
            setSelecionada("");
            setDetalhe(null);
          }}
        >
          <Text style={styles.texto}>Voltar às competições</Text>
        </Pressable>
      )}
      {detalhe && (
        <>
          <View style={styles.cartao}>
            <Text style={styles.subtitulo}>{detalhe.nome}</Text>
            <Text style={styles.texto}>
              Data-base: {dataBr(detalhe.dataBaseCategoria)}
            </Text>
          </View>
          {detalhe.provas.length === 0 ? (
            <Text style={styles.texto}>Nenhuma prova configurada.</Text>
          ) : (
            detalhe.provas.map((p) => (
              <View style={styles.cartao} key={p.id}>
                <Text style={styles.subtitulo}>
                  {p.modalidade} · {p.prova}
                </Text>
                <Text style={styles.texto}>
                  Escalação{" "}
                  {p.escalacao.situacao === 2 ? "finalizada" : "em rascunho"}
                </Text>
                {p.escalacao.participantes.length === 0 ? (
                  <Text style={styles.texto}>
                    Nenhum participante escalado.
                  </Text>
                ) : (
                  p.escalacao.participantes.map((x) => (
                    <Text style={styles.texto} key={x.pessoaId}>
                      • {x.nome} · {x.funcao === 1 ? "Titular" : "Reserva"}
                    </Text>
                  ))
                )}
                {p.escalacao.avisos.map((x) => (
                  <Text accessibilityRole="alert" style={styles.erro} key={x}>
                    {x}
                  </Text>
                ))}
              </View>
            ))
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { gap: 12, marginTop: 20 },
  titulo: { color: "#183a38", fontSize: 22, fontWeight: "600" },
  subtitulo: { color: "#183a38", fontSize: 18, fontWeight: "600" },
  texto: { color: "#526258", fontSize: 15, lineHeight: 23 },
  cartao: {
    borderWidth: 1,
    borderColor: "#cbd1c3",
    borderRadius: 8,
    padding: 14,
    gap: 6,
    backgroundColor: "#fffdf8",
  },
  erro: { color: "#972b25", fontSize: 16 },
  botao: {
    minHeight: 48,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#183a38",
    alignItems: "center",
  },
  botaoTexto: { color: "#fff", fontSize: 16, fontWeight: "600" },
  botaoSecundario: {
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: "#71817c",
    borderRadius: 8,
  },
});
