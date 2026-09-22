import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Manuais } from "./Manuais";
import type { Api } from "./api";

const manual = {
  id: "manual",
  posto: 1,
  nomePosto: "Embaixador Escudeiro",
  identificacao: "2ª Edição",
  versao: "v1",
  emUso: true,
  postosEmAndamento: 1,
  postosConcluidos: 1,
  tarefas: [{ id: "t1", nome: "Texto inicial", numero: 1 }],
};

describe("Manuais", () => {
  it("explica o uso da versão e envia a correção com a identidade da tarefa", async () => {
    const api = vi.fn((caminho: string) => {
      if (caminho === "/manuais") return Promise.resolve([manual]);
      if (caminho === "/manuais/tarefas-conhecidas") return Promise.resolve({});
      return Promise.resolve({ id: "manual", versao: "v2" });
    }) as Api;
    render(
      <MemoryRouter initialEntries={["/manuais/manual/editar"]}>
        <Routes>
          <Route path="/manuais/*" element={<Manuais api={api} editar />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByText("Manual do Posto: Embaixador Escudeiro"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/postos concluídos não são recalculados/i),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Tarefa 1"), {
      target: { value: "Texto corrigido" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar tarefa" }));
    fireEvent.change(screen.getByLabelText("Tarefa 2"), {
      target: { value: "Nova tarefa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar correções" }));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith("/manuais/versoes/manual", {
        versao: "v1",
        identificacao: "2ª Edição",
        tarefas: [
          { id: "t1", nome: "Texto corrigido" },
          { nome: "Nova tarefa" },
        ],
      }),
    );
  });
});
