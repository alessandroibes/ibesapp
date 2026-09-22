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

test("exibe numeração e corrige data de tarefa concluída", async () => {
  const fetcher = jest
    .fn()
    .mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "PUT")
        return Promise.resolve({ ok: true, json: async () => ({}) });
      if (url.endsWith("/pessoas?p") || url.includes("/pessoas?"))
        return Promise.resolve({
          ok: true,
          json: async () => ({
            total: 1,
            pessoas: [{ id: "p1", nome: "Daniel" }],
          }),
        });
      if (url.endsWith("/pessoas/p1"))
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: "p1",
            possuiJornada: true,
            conselheiroVigente: false,
            dados: { nome: "Daniel", dataNascimento: "2010-01-01" },
            responsaveis: [],
          }),
        });
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: "j1",
          versao: "v1",
          situacao: "Embaixador",
          mesesPermanencia: 12,
          requisitos: [],
          postos: [
            {
              id: "posto",
              nome: "Embaixador Escudeiro",
              dataIngresso: "2024-01-01",
              dataConclusao: null,
              identificacaoManual: "Edição",
              tarefas: [
                {
                  id: "t1",
                  numero: 1,
                  nome: "Os postos",
                  dataConclusao: "2024-01-02",
                },
              ],
            },
          ],
          cerimonias: [],
        }),
      });
    });
  global.fetch = fetcher;
  render(
    <Pessoas
      api="https://api.test"
      token="token"
      igrejaId="a"
      permissoes={[
        "pessoas.consultar",
        "progressao.consultar",
        "progressao.registrar",
      ]}
    />,
  );
  fireEvent.press(await screen.findByRole("button", { name: "Daniel" }));
  expect(
    await screen.findByText("Tarefa 1: Os postos · 2024-01-02"),
  ).toBeTruthy();
  fireEvent.changeText(
    screen.getByLabelText("Data do fato (AAAA-MM-DD)"),
    "2024-01-03",
  );
  fireEvent.press(
    screen.getByRole("button", {
      name: "Corrigir data da Tarefa 1: Os postos",
    }),
  );
  await waitFor(() =>
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.test/api/v1/pessoas/p1/jornada/tarefas/t1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ versao: "v1", dataConclusao: "2024-01-03" }),
      }),
    ),
  );
});
