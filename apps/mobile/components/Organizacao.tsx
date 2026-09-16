import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { components } from "../../../packages/contracts/api";

type Dados = components["schemas"]["OrganizacaoResponse"];
function dataBr(data?: string | null) {
  return data ? data.slice(0, 10).split("-").reverse().join("/") : "vigente";
}

export function Organizacao({
  api,
  token,
  igrejaId,
}: {
  api: string;
  token: string;
  igrejaId: string;
}) {
  const [dados, setDados] = useState<Dados | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [revisao, setRevisao] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setErro("");
    fetch(`${api}/api/v1/organizacao`, {
      headers: { Authorization: `Bearer ${token}`, "X-Igreja-Id": igrejaId },
      signal: abort.signal,
    })
      .then(async (r) => {
        if (!r.ok)
          throw new Error(
            r.status === 403
              ? "Sem permissão para consultar a organização desta Igreja."
              : "Não foi possível carregar Consulados e Diretoria.",
          );
        return r.json() as Promise<Dados>;
      })
      .then((d) => {
        if (!abort.signal.aborted) setDados(d);
      })
      .catch((e: Error) => {
        if (!abort.signal.aborted) {
          setDados(null);
          setErro(e.message);
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [api, token, igrejaId, revisao]);
  return (
    <View style={styles.area}>
      <Text accessibilityRole="header" style={styles.titulo}>
        Consulados e Diretoria
      </Text>
      {loading && (
        <ActivityIndicator accessibilityLabel="Carregando Consulados e Diretoria" />
      )}
      {!!erro && (
        <>
          <Text accessibilityRole="alert" style={styles.erro}>
            {erro}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.botao}
            onPress={() => setRevisao((r) => r + 1)}
          >
            <Text style={styles.botaoTexto}>Tentar novamente</Text>
          </Pressable>
        </>
      )}
      {!loading &&
        !erro &&
        dados?.consulados.length === 0 &&
        dados.mandatos.length === 0 && (
          <Text style={styles.texto}>
            Nenhum Consulado ou mandato cadastrado.
          </Text>
        )}
      {dados?.consulados.map((c) => (
        <View key={c.id} style={styles.cartao}>
          <Text style={styles.subtitulo}>Consulado {c.nome}</Text>
          <Text style={styles.texto}>
            {dataBr(c.dataInicio)} a {dataBr(c.dataFim)}
          </Text>
          {c.membros.filter((m) => !m.dataFim).length === 0 ? (
            <Text style={styles.texto}>Nenhum membro vigente.</Text>
          ) : (
            c.membros
              .filter((m) => !m.dataFim)
              .map((m) => (
                <Text key={m.id} style={styles.texto}>
                  • {m.nome}
                  {c.consules.some(
                    (l) => l.pessoaId === m.pessoaId && !l.dataFim,
                  )
                    ? " · Cônsul"
                    : ""}
                </Text>
              ))
          )}
        </View>
      ))}
      {dados?.mandatos.map((m) => (
        <View key={m.id} style={styles.cartao}>
          <Text style={styles.subtitulo}>{m.nome}</Text>
          <Text style={styles.texto}>
            {dataBr(m.dataInicio)} a {dataBr(m.dataFim)}
          </Text>
          {m.ocupacoes.length === 0 ? (
            <Text style={styles.texto}>Nenhuma ocupação registrada.</Text>
          ) : (
            m.ocupacoes.map((o) => (
              <Text key={o.id} style={styles.texto}>
                • {o.cargo}: {o.nome}
                {o.dataFim ? ` · até ${dataBr(o.dataFim)}` : ""}
              </Text>
            ))
          )}
        </View>
      ))}
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
});
