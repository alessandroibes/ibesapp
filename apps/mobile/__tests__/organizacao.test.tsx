import { render, screen, waitFor } from "@testing-library/react-native";
import { Organizacao } from "../components/Organizacao";

describe("Organização no mobile", () => {
  it("mostra Consulados e Diretoria com linguagem de negócio em português", async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hoje: "2026-09-15",
        cargos: [],
        consulados: [
          {
            id: "c",
            versao: "v",
            nome: "Davi",
            dataInicio: "2024-01-01",
            dataFim: null,
            membros: [
              {
                id: "m",
                versao: "v",
                pessoaId: "p",
                nome: "João",
                dataInicio: "2024-01-01",
                dataFim: null,
                motivoFim: null,
              },
            ],
            consules: [
              {
                id: "l",
                versao: "v",
                pessoaId: "p",
                nome: "João",
                dataInicio: "2024-02-01",
                dataFim: null,
                motivoFim: null,
              },
            ],
          },
        ],
        mandatos: [
          {
            id: "d",
            versao: "v",
            nome: "Diretoria 2026",
            dataInicio: "2026-01-01",
            dataFim: "2026-12-31",
            observacoes: null,
            eleicoes: [],
            ocupacoes: [
              {
                id: "o",
                versao: "v",
                cargoId: "x",
                cargo: "Secretário",
                pessoaId: "p",
                nome: "João",
                dataInicio: "2026-01-01",
                dataFim: null,
                motivoFim: null,
                membroIgreja: true,
              },
            ],
          },
        ],
      }),
    });
    jest.spyOn(global, "fetch").mockImplementation(fetcher);
    render(
      <Organizacao api="https://api.test" token="token" igrejaId="igreja" />,
    );
    expect(await screen.findByText("Consulado Davi")).toBeTruthy();
    expect(screen.getByText("• João · Cônsul")).toBeTruthy();
    expect(screen.getByText("• Secretário: João")).toBeTruthy();
    await waitFor(() =>
      expect(fetcher).toHaveBeenCalledWith(
        "https://api.test/api/v1/organizacao",
        expect.objectContaining({
          headers: expect.objectContaining({ "X-Igreja-Id": "igreja" }),
        }),
      ),
    );
  });
});
