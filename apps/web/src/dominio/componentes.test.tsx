import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Estado } from "./componentes";

describe("Estados compartilhados", () => {
  it("apresenta carregamento com semântica de status", () => {
    render(<Estado loading erro="" atualizar={vi.fn()} />);
    expect(
      screen.getByRole("status", { name: "Carregando conteúdo" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["Você não tem permissão para esta operação.", "Acesso não autorizado"],
    [
      "O registro mudou ou já existe. Atualize os dados antes de tentar novamente.",
      "Os dados foram atualizados",
    ],
    ["Não foi possível concluir a operação.", "Não foi possível carregar"],
  ])("classifica o erro %s", (erro, titulo) => {
    render(<Estado loading={false} erro={erro} atualizar={vi.fn()} />);
    expect(screen.getByText(titulo)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeInTheDocument();
  });
});
