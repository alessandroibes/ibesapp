import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Jornada } from "./Jornada";
import type { Api } from "./api";

const jornada = {
  id: "j1",
  versao: "v1",
  situacao: "Embaixador",
  faixaEtaria: "Adolescente",
  dataBase: "2026-09-22",
  mesesPermanencia: 12,
  elegivelAdmissao: false,
  requisitos: [
    { requisito: 1, nome: "Tema dos ER", dataConclusao: "2024-01-01" },
  ],
  postos: [
    {
      id: "p1",
      posto: 1,
      nome: "Embaixador Escudeiro",
      dataIngresso: "2024-01-02",
      dataConclusao: null,
      versaoManualId: "m1",
      identificacaoManual: "2ª Edição",
      permanenciaAte: "2025-01-02",
      tarefas: [
        { id: "t1", nome: "Os postos", numero: 1, dataConclusao: "2024-01-03" },
      ],
    },
  ],
  cerimonias: [],
};

describe("Jornada", () => {
  it("numera tarefas e corrige somente a data de uma conclusão", async () => {
    const api = vi.fn((caminho: string) => {
      if (caminho.startsWith("/pessoas/")) return Promise.resolve(jornada);
      return Promise.resolve([]);
    }) as Api;
    render(
      <Jornada
        api={api}
        pessoaId="pessoa"
        versaoPessoa="pv"
        podeRegistrar
        atualizarPessoa={vi.fn()}
      />,
    );

    expect(await screen.findByText("Tarefa 1: Os postos")).toBeInTheDocument();
    const formulario = screen.getByRole("form", {
      name: "Corrigir data da Tarefa 1: Os postos",
      hidden: true,
    });
    const campoData = formulario.querySelector<HTMLInputElement>(
      'input[name="dataConclusao"]',
    );
    fireEvent.change(campoData!, {
      target: { value: "2024-01-04" },
    });
    fireEvent.click(
      within(formulario).getByRole("button", { name: "Salvar data corrigida" }),
    );
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        "/pessoas/pessoa/jornada/tarefas/t1",
        { versao: "v1", dataConclusao: "2024-01-04" },
        "PUT",
      ),
    );
  });
});
