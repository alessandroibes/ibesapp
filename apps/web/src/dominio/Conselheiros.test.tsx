import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Conselheiros } from "./Conselheiros";
import type { Api } from "./api";

const conselheiro = {
  id: "c1",
  versao: "v1",
  pessoaId: "p1",
  nome: "João Conselheiro",
  usuarioId: null,
  dataInicio: "2024-01-01",
  dataFim: null,
  pessoaAtiva: true,
  possuiJornada: true,
};

function renderizar(api: Api, editar: boolean) {
  return render(
    <MemoryRouter initialEntries={["/conselheiros"]}>
      <Routes>
        <Route
          path="/conselheiros/*"
          element={
            <Conselheiros api={api} editar={editar} podeConsultarPessoas />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Área de Conselheiros", () => {
  it("lista e abre o detalhe com a trajetória antiga somente para consulta", async () => {
    const api = vi.fn(async (caminho: string) =>
      caminho === "/embaixada/conselheiros/c1" ? conselheiro : [conselheiro],
    ) as unknown as Api;
    renderizar(api, false);
    expect(await screen.findByText("João Conselheiro")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cadastrar Conselheiro" }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Visualizar" }));
    expect(
      await screen.findByRole("heading", { name: "Trajetória ER histórica" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Consultar trajetória histórica" }),
    ).toHaveAttribute("href", "/pessoas/p1?aba=jornada&origem=conselheiros");
  });

  it("respeita a permissão de edição ao oferecer o vínculo simples", async () => {
    const api = vi.fn(async (caminho: string) =>
      caminho.startsWith("/pessoas?") ? { total: 0, pessoas: [] } : [],
    ) as unknown as Api;
    renderizar(api, true);
    const botao = await screen.findByRole("button", {
      name: "Cadastrar Conselheiro",
    });
    await userEvent.click(botao);
    expect(
      screen.getByRole("dialog", { name: "Cadastrar Conselheiro" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Data de início *")).toBeInTheDocument();
    expect(screen.queryByLabelText("Função *")).not.toBeInTheDocument();
  });
});
