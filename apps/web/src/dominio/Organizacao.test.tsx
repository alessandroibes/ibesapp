import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Organizacao } from "./Organizacao";

describe("Organização interna", () => {
  it("apresenta histórico, Cônsul e preferência de vínculo com a Igreja", async () => {
    const api = vi.fn().mockResolvedValue({
      hoje: "2026-09-15",
      cargos: [
        {
          id: "cargo",
          versao: "v",
          nome: "Secretário",
          quantidadeVagas: 1,
          ativo: true,
        },
      ],
      consulados: [
        {
          id: "consulado",
          versao: "v",
          nome: "Davi",
          dataInicio: "2024-01-01",
          dataFim: null,
          membros: [
            {
              id: "membro",
              versao: "v",
              pessoaId: "pessoa",
              nome: "João",
              dataInicio: "2024-01-01",
              dataFim: null,
              motivoFim: null,
            },
          ],
          consules: [
            {
              id: "consul",
              versao: "v",
              pessoaId: "pessoa",
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
          id: "mandato",
          versao: "v",
          nome: "Diretoria 2026",
          dataInicio: "2026-01-01",
          dataFim: "2026-12-31",
          observacoes: null,
          eleicoes: [],
          ocupacoes: [
            {
              id: "ocupacao",
              versao: "v",
              cargoId: "cargo",
              cargo: "Secretário",
              pessoaId: "pessoa",
              nome: "João",
              dataInicio: "2026-01-01",
              dataFim: null,
              motivoFim: null,
              membroIgreja: true,
            },
          ],
        },
      ],
    });
    render(<Organizacao api={api} gerenciar={false} />);
    expect(
      await screen.findByRole("heading", { name: "Consulado Davi" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Membro desta Igreja", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Postos e cargos não alteram permissões/),
    ).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith(
      "/organizacao",
      undefined,
      undefined,
      expect.any(AbortSignal),
    );
  });
});
