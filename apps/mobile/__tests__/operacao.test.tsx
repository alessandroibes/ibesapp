import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { View } from "react-native";
import { Operacao } from "../components/Operacao";

test("chamada registra pontualidade com bearer e Igreja e limpa dados ao trocar tenant", async () => {
  let situacao: number | null = null;
  const fetcher = jest.fn(async (url: string, options?: RequestInit) => {
    const headers = options?.headers as Record<string, string>;
    if (options?.method === "PUT") {
      situacao = 1;
      return { ok: true, json: async () => ({ id: "f", versao: "v2" }) };
    }
    if (url.includes("/chamada"))
      return {
        ok: true,
        json: async () => ({
          total: 1,
          contagens: [],
          pessoas: [
            {
              pessoaId: "p",
              nome: "Visitante de teste",
              condicao: "Visitante",
              versao: situacao ? "v2" : null,
              situacao,
            },
          ],
        }),
      };
    if (url.endsWith("/reunioes/r"))
      return {
        ok: true,
        json: async () => ({
          titulo: "Reunião de teste",
          situacao: 1,
          roteiro: [],
        }),
      };
    return {
      ok: true,
      json: async () =>
        headers["X-Igreja-Id"] === "a"
          ? [{ id: "r", titulo: "Reunião de teste" }]
          : [],
    };
  });
  global.fetch = fetcher as unknown as typeof fetch;
  const props = {
    api: "https://api.test",
    token: "token",
    permissoes: ["frequencia.consultar", "frequencia.registrar"],
  };
  const view = render(
    <View>
      <Operacao key="a" {...props} igrejaId="a" />
    </View>,
  );
  fireEvent.press(
    await screen.findByRole("button", {
      name: "Abrir chamada: Reunião de teste",
    }),
  );
  fireEvent.press(
    await screen.findByRole("button", { name: "Presença com Pontualidade" }),
  );
  await waitFor(() =>
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.test/api/v1/reunioes/r/frequencia/p",
      expect.objectContaining({
        method: "PUT",
        headers: {
          Authorization: "Bearer token",
          "X-Igreja-Id": "a",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ versao: null, situacao: 1 }),
      }),
    ),
  );
  await screen.findByText("Visitante de teste: Presença com Pontualidade.");
  view.rerender(
    <View>
      <Operacao key="b" {...props} igrejaId="b" />
    </View>,
  );
  await screen.findByText(
    "Nenhuma reunião preparada. Prepare a reunião pela agenda web.",
  );
  expect(screen.queryByText("Visitante de teste")).toBeNull();
});
