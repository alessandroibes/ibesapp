import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Financeiro } from "./Financeiro";
import { AcervoHistorico } from "./AcervoHistorico";
import type { Api } from "./api";

describe("Financeiro e acervo histórico", () => {
  it("apresenta entradas, saídas e saldo por iniciativa", async () => {
    const api = vi.fn(async (caminho: string) => {
      if (caminho === "/financeiro/referencias")
        return { pessoas: [], atividades: [] };
      if (caminho === "/financeiro/iniciativas")
        return [{ id: "i", versao: "v", nome: "Camisas" }];
      if (caminho.startsWith("/financeiro/resumo"))
        return {
          entradas: 100,
          saidas: 60,
          saldo: 40,
          quantidadeLancamentos: 2,
        };
      return [
        {
          id: "l",
          versao: "v",
          tipo: 1,
          data: "2026-09-01",
          valor: 100,
          motivo: "Pagamento de camisa",
          iniciativa: "Camisas",
        },
      ];
    }) as unknown as Api;
    render(
      <MemoryRouter>
        <Financeiro api={api} gerenciar={false} />
      </MemoryRouter>,
    );
    expect((await screen.findAllByText(/100,00/)).length).toBeGreaterThan(0);
    expect(screen.getByText(/60,00/)).toBeInTheDocument();
    expect(screen.getByText(/40,00/)).toBeInTheDocument();
    expect(screen.getByText(/Pagamento de camisa/)).toBeInTheDocument();
  });

  it("apresenta linha do tempo, autoria, pessoas e anexos", async () => {
    const api = vi.fn(async (caminho: string) => {
      if (caminho === "/acervo-historico/referencias")
        return { pessoas: [], atividades: [] };
      return [
        {
          id: "m",
          versao: "v",
          dataInicio: "1998-05-01",
          dataFim: "1998-05-03",
          titulo: "Primeiro acampamento",
          descricao: "Memória preservada.",
          categoria: "Acampamento",
          autor: "secretaria@example.test",
          pessoas: [{ id: "p", nome: "João" }],
          anexos: [
            {
              id: "a",
              versao: "v",
              nomeArquivo: "foto.jpg",
              tipoConteudo: "image/jpeg",
              tamanho: 10,
            },
          ],
        },
      ];
    }) as unknown as Api;
    render(
      <MemoryRouter initialEntries={["/acervo/m"]}>
        <AcervoHistorico api={api} igrejaId="igreja" gerenciar={false} />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Primeiro acampamento" }),
    ).toBeInTheDocument();
    expect(screen.getByText("secretaria@example.test")).toBeInTheDocument();
    expect(screen.getByText("João")).toBeInTheDocument();
    expect(screen.getByText("foto.jpg")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Baixar" })).toBeInTheDocument();
  });
});
