import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Pessoas } from "./Pessoas";
import type { Api } from "./api";

describe("Páginas de Pessoas", () => {
  it("lista ações e inativa preservando a confirmação explícita", async () => {
    const api = vi.fn().mockImplementation((caminho: string) => {
      if (caminho.startsWith("/pessoas?"))
        return Promise.resolve({
          total: 1,
          pessoas: [
            {
              id: "p1",
              versao: "v1",
              nome: "Daniel",
              dataNascimento: "2012-04-03",
              situacao: "Candidato",
              ativa: true,
            },
          ],
        });
      return Promise.resolve({ id: "p1", versao: "v2" });
    }) as unknown as Api;
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Pessoas api={api} igrejaId="igreja" permissoes={["pessoas.editar"]} />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("link", { name: "Adicionar pessoa" }),
    ).toHaveAttribute("href", "/pessoas/nova");
    expect(screen.getByRole("link", { name: "Visualizar" })).toHaveAttribute(
      "href",
      "/pessoas/p1",
    );
    await userEvent.click(screen.getByRole("button", { name: "Inativar" }));
    await userEvent.type(
      screen.getByLabelText("Motivo *"),
      "Mudança de cidade",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar inativação" }),
    );
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        "/pessoas/p1/inativacao",
        expect.objectContaining({ versao: "v1", motivo: "Mudança de cidade" }),
      ),
    );
  });
});
