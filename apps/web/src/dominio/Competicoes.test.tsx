import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Competicoes } from "./Competicoes";
import type { Api } from "./api";

describe("Competições", () => {
  it("mostra data-base, regras e escalação em português", async () => {
    const consultar = vi.fn(async (caminho: string) => {
      if (caminho === "/competicoes/catalogo") return [];
      if (caminho === "/competicoes/aptidoes") return [];
      if (caminho === "/competicoes")
        return [
          {
            id: "c",
            versao: "v",
            nome: "Jogos 2026",
            dataInicio: "2026-07-01",
            dataFim: "2026-07-02",
            dataBaseCategoria: "2026-01-01",
            local: "Ginásio",
            quantidadeProvas: 1,
          },
        ];
      return {
        id: "c",
        versao: "v",
        nome: "Jogos 2026",
        dataInicio: "2026-07-01",
        dataFim: "2026-07-02",
        dataBaseCategoria: "2026-01-01",
        local: "Ginásio",
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
      };
    });
    const api = consultar as unknown as Api;
    render(<Competicoes api={api} gerenciar={false} />);
    await userEvent.click(
      await screen.findByRole("button", { name: /Jogos 2026/ }),
    );
    expect(
      await screen.findByText(/data-base 01\/01\/2026/),
    ).toBeInTheDocument();
    expect(screen.getByText(/máximo total 5/)).toBeInTheDocument();
    expect(screen.getByText("João · Titular")).toBeInTheDocument();
    expect(screen.getByText("Escalação Finalizada")).toBeInTheDocument();
  });
});
