import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Dominio } from "./Dominio";

vi.mock("./Pessoas", () => ({ Pessoas: () => <h2>Pessoas abertas</h2> }));
vi.mock("./Conselheiros", () => ({
  Conselheiros: () => <h2>Conselheiros abertos</h2>,
}));
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
  it("expõe somente áreas permitidas como páginas com URLs próprias", async () => {
    render(
      <MemoryRouter initialEntries={["/pessoas"]}>
        <Dominio
          igrejaId="igreja-a"
          nomeIgreja="Igreja A"
          nomeEmbaixada="Embaixada A"
          permissoes={["pessoas.consultar", "agenda.consultar"]}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("navigation", { name: "Gestão da Embaixada" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Meninos e jornada/ }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Pessoas abertas")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Meninos e jornada", level: 1 }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("link", { name: /Agenda e reuniões/ }),
    );
    expect(
      screen.getByRole("link", { name: /Agenda e reuniões/ }),
    ).toHaveAttribute("aria-current", "page");
    expect(await screen.findByText("Agenda aberta")).toBeInTheDocument();
    expect(screen.queryByText("Pessoas abertas")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Competições/ }),
    ).not.toBeInTheDocument();
  });

  it("abre Conselheiros em área própria quando a permissão da Embaixada está disponível", () => {
    render(
      <MemoryRouter initialEntries={["/conselheiros"]}>
        <Dominio
          igrejaId="igreja-a"
          nomeIgreja="Igreja A"
          nomeEmbaixada="Embaixada A"
          permissoes={["embaixada.consultar"]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Conselheiros" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Conselheiros abertos")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Meninos e jornada" }),
    ).not.toBeInTheDocument();
  });

  it("abre e fecha o painel móvel preservando o foco no acionador", async () => {
    const usuario = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/pessoas"]}>
        <Dominio
          igrejaId="igreja-a"
          nomeIgreja="Igreja A"
          nomeEmbaixada="Embaixada A"
          permissoes={["pessoas.consultar"]}
        />
      </MemoryRouter>,
    );

    const acionador = screen.getByRole("button", {
      name: "Áreas de trabalho",
    });
    await usuario.click(acionador);

    expect(
      screen.getByRole("dialog", { name: "Áreas de trabalho" }),
    ).toBeInTheDocument();
    await usuario.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog", { name: "Áreas de trabalho" }),
    ).not.toBeInTheDocument();
    expect(acionador).toHaveFocus();
  });
});
