import * as SecureStore from "expo-secure-store";
import { carregarSessao, guardarSessao, encerrarSessao } from "../lib/sessao";
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
beforeEach(() => jest.clearAllMocks());
test("recupera token válido do armazenamento seguro", async () => {
  const sessao = { accessToken: "token", expiraEm: Date.now() + 60000 };
  jest
    .mocked(SecureStore.getItemAsync)
    .mockResolvedValue(JSON.stringify(sessao));
  expect(await carregarSessao()).toEqual(sessao);
});
test("descarta token expirado", async () => {
  jest
    .mocked(SecureStore.getItemAsync)
    .mockResolvedValue(JSON.stringify({ accessToken: "token", expiraEm: 0 }));
  expect(await carregarSessao()).toBeNull();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("ibes.sessao");
});
test("descarta dados corrompidos", async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue("invalid");
  expect(await carregarSessao()).toBeNull();
});
test("grava e remove sessão no armazenamento seguro", async () => {
  await guardarSessao({ accessToken: "token", expiraEm: 123 });
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
    "ibes.sessao",
    expect.any(String),
  );
  await encerrarSessao();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("ibes.sessao");
});
