import * as SecureStore from "expo-secure-store";
export type Sessao = { accessToken: string; expiraEm: number };
const chave = "ibes.sessao";
export async function guardarSessao(sessao: Sessao) {
  await SecureStore.setItemAsync(chave, JSON.stringify(sessao));
}
export async function encerrarSessao() {
  await SecureStore.deleteItemAsync(chave);
}
export async function carregarSessao(): Promise<Sessao | null> {
  const value = await SecureStore.getItemAsync(chave);
  if (!value) return null;
  try {
    const sessao = JSON.parse(value) as Sessao;
    if (
      typeof sessao.accessToken !== "string" ||
      !Number.isFinite(sessao.expiraEm) ||
      sessao.expiraEm <= Date.now()
    ) {
      await encerrarSessao();
      return null;
    }
    return sessao;
  } catch {
    await encerrarSessao();
    return null;
  }
}
