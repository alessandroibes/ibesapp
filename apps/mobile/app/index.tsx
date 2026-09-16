import { useEffect, useState } from "react";
import { Pessoas } from "../components/Pessoas";
import { Operacao } from "../components/Operacao";
import { Organizacao } from "../components/Organizacao";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import type { components } from "../../../packages/contracts/api";
import {
  carregarSessao,
  encerrarSessao,
  guardarSessao,
  type Sessao,
} from "../lib/sessao";
WebBrowser.maybeCompleteAuthSession();
const api = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://localhost:7443"
).replace(/\/$/, "");
const discovery = {
  authorizationEndpoint: `${api}/connect/authorize`,
  tokenEndpoint: `${api}/connect/token`,
};
type Igreja = components["schemas"]["IgrejaResponse"];
export default function Inicio() {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [selecionada, setSelecionada] = useState("");
  const [embaixada, setEmbaixada] = useState("");
  const [permissoes, setPermissoes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [carregandoIgrejas, setCarregandoIgrejas] = useState(false);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: "ibes-mobile",
      redirectUri: "ibes://oauth/callback",
      scopes: ["openid", "fundacao"],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery,
  );
  useEffect(() => {
    carregarSessao()
      .then(setSessao)
      .catch(() => setErro("Não foi possível recuperar sua sessão."))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!sessao) return;
    setCarregandoIgrejas(true);
    const controller = new AbortController();
    fetch(`${api}/bff/sessao`, {
      headers: { Authorization: `Bearer ${sessao.accessToken}` },
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const data = (await r.json()) as { igrejas: Igreja[] };
        setIgrejas(data.igrejas);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setErro("Não foi possível carregar suas Igrejas.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregandoIgrejas(false);
      });
    return () => controller.abort();
  }, [sessao, tentativa]);
  async function entrar() {
    setErro("");
    try {
      const result = await promptAsync();
      if (result.type === "cancel" || result.type === "dismiss") return;
      if (result.type !== "success" || !request?.codeVerifier)
        throw new Error();
      setLoading(true);
      const tokens = await AuthSession.exchangeCodeAsync(
        {
          clientId: "ibes-mobile",
          code: result.params.code,
          redirectUri: "ibes://oauth/callback",
          extraParams: { code_verifier: request.codeVerifier },
        },
        discovery,
      );
      const nova = {
        accessToken: tokens.accessToken,
        expiraEm: Date.now() + (tokens.expiresIn ?? 600) * 1000,
      };
      await guardarSessao(nova);
      setSessao(nova);
    } catch {
      setErro("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }
  async function escolher(igrejaId: string) {
    if (!sessao) return;
    setLoading(true);
    setErro("");
    setEmbaixada("");
    setPermissoes([]);
    setSelecionada(igrejaId);
    try {
      const r = await fetch(`${api}/api/v1/contexto`, {
        headers: {
          Authorization: `Bearer ${sessao.accessToken}`,
          "X-Igreja-Id": igrejaId,
        },
      });
      if (!r.ok) throw new Error();
      const data = (await r.json()) as {
        embaixada: string;
        permissoes?: string[];
      };
      setEmbaixada(data.embaixada);
      setPermissoes(data.permissoes ?? []);
    } catch {
      setErro(
        "Não foi possível acessar a Igreja. Entre novamente se sua sessão expirou.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function sair() {
    try {
      await encerrarSessao();
      setSessao(null);
      setIgrejas([]);
      setEmbaixada("");
      setSelecionada("");
      setErro("");
    } catch {
      setErro("Não foi possível encerrar a sessão. Tente novamente.");
    }
  }
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.marca}>EMBAIXADORES DO REI</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Cuidar de cada jornada.
        </Text>
        <Text style={styles.subtitle}>
          Fé que inspira. Serviço que transforma.
        </Text>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.heading}>
            Sua Embaixada
          </Text>
          {loading && (
            <ActivityIndicator
              accessibilityLabel="Carregando"
              color="#183a38"
            />
          )}
          {!!erro && (
            <>
              <Text accessibilityRole="alert" style={styles.error}>
                {erro}
              </Text>
              <Pressable
                accessibilityRole="button"
                style={styles.button}
                onPress={() => {
                  setErro("");
                  if (!sessao) void entrar();
                  else if (selecionada) void escolher(selecionada);
                  else setTentativa((t) => t + 1);
                }}
              >
                <Text style={styles.buttonText}>Tentar novamente</Text>
              </Pressable>
            </>
          )}
          {!sessao && (
            <>
              <Text style={styles.body}>
                Acesso para Conselheiros e liderança adulta.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !request || loading }}
                disabled={!request || loading}
                style={styles.button}
                onPress={entrar}
              >
                <Text style={styles.buttonText}>Entrar na minha conta</Text>
              </Pressable>
            </>
          )}
          {sessao && (
            <>
              {carregandoIgrejas && (
                <ActivityIndicator
                  accessibilityLabel="Carregando Igrejas"
                  color="#183a38"
                />
              )}
              {!carregandoIgrejas && !erro && igrejas.length === 0 && (
                <Text style={styles.body}>Nenhuma Igreja disponível.</Text>
              )}
              {igrejas.map((i) => (
                <Pressable
                  key={i.igrejaId}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: selecionada === i.igrejaId,
                    disabled: loading,
                  }}
                  disabled={loading}
                  onPress={() => escolher(i.igrejaId)}
                  style={styles.option}
                >
                  <Text style={styles.body}>
                    {selecionada === i.igrejaId ? "✓ " : ""}
                    {i.nome}
                  </Text>
                </Pressable>
              ))}
              {!!embaixada && (
                <>
                  <Text accessibilityRole="header" style={styles.heading}>
                    {embaixada}
                  </Text>
                  {(permissoes.includes("agenda.consultar") ||
                    permissoes.includes("frequencia.consultar")) && (
                    <Operacao
                      key={`operacao-${selecionada}`}
                      api={api}
                      token={sessao.accessToken}
                      igrejaId={selecionada}
                      permissoes={permissoes}
                    />
                  )}
                  {permissoes.includes("pessoas.consultar") && (
                    <Pessoas
                      key={selecionada}
                      api={api}
                      token={sessao.accessToken}
                      igrejaId={selecionada}
                      permissoes={permissoes}
                    />
                  )}
                  {permissoes.includes("organizacao.consultar") && (
                    <Organizacao
                      key={`organizacao-${selecionada}`}
                      api={api}
                      token={sessao.accessToken}
                      igrejaId={selecionada}
                    />
                  )}
                </>
              )}
              <Pressable
                accessibilityRole="button"
                style={styles.option}
                onPress={sair}
              >
                <Text style={styles.body}>Sair deste aplicativo</Text>
              </Pressable>
            </>
          )}
        </View>
        <Text style={styles.footer}>“Somos embaixadores por Cristo.”</Text>
        <Text style={styles.body}>2 Coríntios 5:20</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f6f4ed" },
  content: { padding: 24, gap: 18 },
  marca: {
    color: "#183a38",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 16,
  },
  title: { fontSize: 40, fontWeight: "600", color: "#183a38", marginTop: 24 },
  subtitle: { color: "#526258", fontSize: 17, lineHeight: 26 },
  card: {
    backgroundColor: "#fffdf8",
    padding: 24,
    borderRadius: 8,
    borderTopWidth: 4,
    borderTopColor: "#b68a35",
    gap: 18,
    marginTop: 16,
  },
  heading: { color: "#183a38", fontSize: 24, fontWeight: "600" },
  body: { fontSize: 16, color: "#526258", lineHeight: 24 },
  button: {
    minHeight: 48,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#183a38",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  option: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#71817c",
    borderRadius: 8,
    padding: 12,
  },
  error: { color: "#972b25", fontSize: 16 },
  footer: { fontSize: 18, color: "#526258", marginTop: 18 },
});
