import { fireEvent, render, screen } from "@testing-library/react-native";
import { Competicoes } from "../components/Competicoes";

describe("Competições no mobile", () => {
  it("consulta competição e escalação simplificada", async () => {
    const fetcher = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "c",
            versao: "v",
            nome: "Jogos 2026",
            dataInicio: "2026-07-01",
            dataFim: "2026-07-02",
            dataBaseCategoria: "2026-01-01",
            local: null,
            quantidadeProvas: 1,
          },
        ],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "c",
          versao: "v",
          nome: "Jogos 2026",
          dataInicio: "2026-07-01",
          dataFim: "2026-07-02",
          dataBaseCategoria: "2026-01-01",
          local: null,
          observacoes: null,
          provas: [
            {
              id: "pc",
              versao: "v",
              provaId: "p",
              prova: "Revezamento",
              modalidade: "Natação",
              natureza: 2,
              tipoReferencia: 1,
              categorias: [4],
              minimoTitulares: 4,
              maximoParticipantes: 5,
              maximoReservas: 1,
              quantidadeExataTitulares: 4,
              referencia: null,
              data: null,
              horaInicio: null,
              horaFim: null,
              escalacao: {
                id: "e",
                versao: "v",
                situacao: 2,
                participantes: [{ pessoaId: "x", nome: "João", funcao: 1 }],
                alteracoes: [],
                avisos: [],
              },
            },
          ],
        }),
      } as Response);
    render(
      <Competicoes api="https://api.test" token="token" igrejaId="igreja" />,
    );
    fireEvent.press(await screen.findByRole("button", { name: /Jogos 2026/ }));
    expect(await screen.findByText("Data-base: 01/01/2026")).toBeTruthy();
    expect(screen.getByText("• João · Titular")).toBeTruthy();
    expect(fetcher).toHaveBeenLastCalledWith(
      "https://api.test/api/v1/competicoes/c",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Igreja-Id": "igreja" }),
      }),
    );
  });
});
