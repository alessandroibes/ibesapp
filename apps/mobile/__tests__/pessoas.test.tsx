import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Pessoas } from "../components/Pessoas";
import { View } from "react-native";

test("consulta autenticada e troca de Igreja não mantém ficha anterior", async () => {
  const fetcher = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        total: 1,
        pessoas: [{ id: "p1", nome: "Pessoa A" }],
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "p1",
        dados: { nome: "Pessoa A", dataNascimento: "2010-01-01" },
        responsaveis: [],
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total: 0, pessoas: [] }),
    });
  global.fetch = fetcher;
  const props = {
    api: "https://api.test",
    token: "token",
    permissoes: ["pessoas.consultar"],
  };
  const view = render(
    <View>
      <Pessoas key="a" {...props} igrejaId="a" />
    </View>,
  );
  fireEvent.press(await screen.findByRole("button", { name: "Pessoa A" }));
  await screen.findByText("Nascimento: 2010-01-01");
  expect(fetcher).toHaveBeenLastCalledWith(
    "https://api.test/api/v1/pessoas/p1",
    expect.objectContaining({
      headers: { Authorization: "Bearer token", "X-Igreja-Id": "a" },
    }),
  );
  view.rerender(
    <View>
      <Pessoas key="b" {...props} igrejaId="b" />
    </View>,
  );
  await screen.findByText("Nenhuma pessoa encontrada.");
  expect(screen.queryByText("Pessoa A")).toBeNull();
  await waitFor(() =>
    expect(fetcher).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { Authorization: "Bearer token", "X-Igreja-Id": "b" },
      }),
    ),
  );
});
