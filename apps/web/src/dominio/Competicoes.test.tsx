import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CompeticoesNova } from "./CompeticoesNova";
import type { Api } from "./api";

const detalhe = {
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
        situacao: 1,
        participantes: [{ pessoaId: "x", nome: "João", funcao: 1 }],
        alteracoes: [],
        avisos: [],
      },
    },
  ],
};

describe("Competições", () => {
  it("mostra regras, candidatos do servidor e confirmação de finalização", async () => {
    const consultar = vi.fn(async (caminho: string) =>
      caminho === "/competicoes/catalogo"
        ? []
        : caminho.endsWith("/candidatos")
          ? [
              {
                pessoaId: "x",
                nome: "João",
                faixaEtaria: "Juvenil",
                conflitos: [],
              },
            ]
          : detalhe,
    );
    render(
      <MemoryRouter initialEntries={["/competicoes/c"]}>
        <Routes>
          <Route
            path="/competicoes/*"
            element={
              <CompeticoesNova api={consultar as unknown as Api} gerenciar />
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Jogos 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Máximo total: 5/)).toBeInTheDocument();
    expect(
      await screen.findByText(/servidor já aplicou aptidão, idade e data-base/),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Finalizar escalação" }),
    );
    expect(
      screen.getByRole("heading", { name: "Finalizar escalação?" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/não poderá ser alterada/)).toBeInTheDocument();
  });

  it("exige motivo para confirmar uma reabertura", async () => {
    const finalizada = {
      ...detalhe,
      provas: [
        {
          ...detalhe.provas[0],
          escalacao: { ...detalhe.provas[0].escalacao, situacao: 2 },
        },
      ],
    };
    const api = vi.fn(async (caminho: string) =>
      caminho === "/competicoes/catalogo" ? [] : finalizada,
    );
    render(
      <MemoryRouter initialEntries={["/competicoes/c"]}>
        <Routes>
          <Route
            path="/competicoes/*"
            element={<CompeticoesNova api={api as unknown as Api} gerenciar />}
          />
        </Routes>
      </MemoryRouter>,
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Reabrir escalação" }),
    );
    expect(
      screen.getByRole("form", { name: "Reabrir escalação" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Motivo da reabertura *")).toBeRequired();
  });
});
