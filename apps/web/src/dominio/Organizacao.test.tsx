import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { OrganizacaoNova } from "./OrganizacaoNova";

const dados = {
  hoje: "2026-09-17",
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
          pessoaId: "p1",
          nome: "João",
          dataInicio: "2024-01-01",
          dataFim: null,
          motivoFim: null,
        },
        {
          id: "antigo",
          versao: "v",
          pessoaId: "p2",
          nome: "Pedro",
          dataInicio: "2023-01-01",
          dataFim: "2023-12-31",
          motivoFim: "Transferência",
        },
      ],
      consules: [
        {
          id: "consul",
          versao: "v",
          pessoaId: "p1",
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
          pessoaId: "p1",
          nome: "João",
          dataInicio: "2026-01-01",
          dataFim: null,
          motivoFim: null,
          membroIgreja: true,
        },
      ],
    },
  ],
};

describe("Organização interna", () => {
  it("separa lista, detalhe, vigentes e histórico em URLs estáveis", async () => {
    const api = vi.fn().mockResolvedValue(dados);
    render(
      <MemoryRouter initialEntries={["/organizacao/consulados"]}>
        <Routes>
          <Route
            path="/organizacao/*"
            element={<OrganizacaoNova api={api} gerenciar />}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Consulados" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Ver detalhes" }));
    expect(
      await screen.findByRole("heading", { name: "Consulado Davi" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pedro · membro/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Transferir" }));
    expect(
      screen.getByRole("form", { name: "Transferir João" }),
    ).toBeInTheDocument();
  });

  it("distingue mandato atual e informa preferência de vínculo sem bloquear", async () => {
    const api = vi.fn().mockResolvedValue(dados);
    render(
      <MemoryRouter initialEntries={["/organizacao/mandatos/mandato"]}>
        <Routes>
          <Route
            path="/organizacao/*"
            element={<OrganizacaoNova api={api} gerenciar={false} />}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Mandato atual")).toBeInTheDocument();
    expect(
      screen.getByText(/Membro desta Igreja.*informação, sem bloqueio/),
    ).toBeInTheDocument();
    expect(screen.getByText(/acumular cargos.*Cônsul/)).toBeInTheDocument();
  });
});
