import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dominio } from "./Dominio";

vi.mock("./Pessoas", () => ({ Pessoas: () => <h2>Pessoas abertas</h2> }));
vi.mock("./Instituicao", () => ({
  Instituicao: () => <h2>Instituição aberta</h2>,
}));
vi.mock("./Manuais", () => ({ Manuais: () => <h2>Manuais abertos</h2> }));
vi.mock("./Agenda", () => ({ Agenda: () => <h2>Agenda aberta</h2> }));
vi.mock("./Organizacao", () => ({
  Organizacao: () => <h2>Organização aberta</h2>,
}));
vi.mock("./Competicoes", () => ({
  Competicoes: () => <h2>Competições abertas</h2>,
}));
vi.mock("./Financeiro", () => ({
  Financeiro: () => <h2>Financeiro aberto</h2>,
}));
vi.mock("./AcervoHistorico", () => ({
  AcervoHistorico: () => <h2>Acervo aberto</h2>,
}));

describe("Navegação do domínio", () => {
  it("expõe áreas permitidas como abas e mantém somente uma área visível", async () => {
    render(
      <Dominio
        igrejaId="igreja-a"
        permissoes={["pessoas.consultar", "agenda.consultar"]}
      />,
    );

    expect(screen.getByRole("tablist")).toHaveAccessibleName(
      "Gestão da Embaixada",
    );
    expect(
      screen.getByRole("tab", { name: "Pessoas e jornada" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Pessoas abertas")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("tab", { name: "Agenda e reuniões" }),
    );

    expect(
      screen.getByRole("tab", { name: "Agenda e reuniões" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Agenda aberta")).toBeInTheDocument();
    expect(screen.queryByText("Pessoas abertas")).not.toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Agenda e reuniões" }),
    ).toHaveFocus();

    await userEvent.keyboard("{ArrowLeft}");
    expect(
      screen.getByRole("tab", { name: "Pessoas e jornada" }),
    ).toHaveFocus();
    expect(screen.getByText("Pessoas abertas")).toBeInTheDocument();
  });
});
