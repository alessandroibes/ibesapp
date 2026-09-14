import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import Inicio from "../app/index";
import * as sessao from "../lib/sessao";
import * as AuthSession from "expo-auth-session";
jest.mock("../lib/sessao", () => ({
  carregarSessao: jest.fn().mockResolvedValue(null),
  guardarSessao: jest.fn(),
  encerrarSessao: jest.fn(),
}));
jest.mock("expo-web-browser", () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: jest.requireActual("react-native").View,
}));
jest.mock("expo-auth-session", () => ({
  ResponseType: { Code: "code" },
  useAuthRequest: jest.fn(() => [
    { codeVerifier: "verifier" },
    null,
    jest.fn().mockResolvedValue({ type: "success", params: { code: "code" } }),
  ]),
  exchangeCodeAsync: jest
    .fn()
    .mockResolvedValue({ accessToken: "access", expiresIn: 600 }),
}));
afterEach(() => jest.clearAllMocks());
test("autentica com PKCE, seleciona Igreja e encerra sessão local", async () => {
  const fetcher = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ igrejas: [{ igrejaId: "a", nome: "Igreja A" }] }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embaixada: "Embaixada A" }),
    });
  global.fetch = fetcher;
  render(<Inicio />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Entrar na minha conta" }),
    ).toBeEnabled(),
  );
  fireEvent.press(
    screen.getByRole("button", { name: "Entrar na minha conta" }),
  );
  fireEvent.press(await screen.findByRole("button", { name: "Igreja A" }));
  expect(await screen.findByText("Embaixada A")).toBeTruthy();
  expect(AuthSession.exchangeCodeAsync).toHaveBeenCalledWith(
    expect.objectContaining({ extraParams: { code_verifier: "verifier" } }),
    expect.anything(),
  );
  expect(fetcher).toHaveBeenLastCalledWith(
    expect.stringContaining("/api/v1/contexto"),
    expect.objectContaining({
      headers: { Authorization: "Bearer access", "X-Igreja-Id": "a" },
    }),
  );
  fireEvent.press(
    screen.getByRole("button", { name: "Sair deste aplicativo" }),
  );
  await waitFor(() => expect(sessao.encerrarSessao).toHaveBeenCalled());
  expect(
    await screen.findByRole("button", { name: "Entrar na minha conta" }),
  ).toBeTruthy();
});
